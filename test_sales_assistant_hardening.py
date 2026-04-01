import asyncio
import json
import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from agents.sales_assistant.agent import chat
from agents.sales_assistant.prompts import (
    SALES_ASSISTANT_FALLBACK_PROMPT,
    SALES_ASSISTANT_SYSTEM_PROMPT,
)
from agents.sales_assistant.tools import create_task_in_sf, run_soql_query


class FakeCompletions:
    def __init__(self):
        self.calls = []

    async def create(self, **kwargs):
        self.calls.append(kwargs)
        if len(self.calls) == 1:
            raise RuntimeError(
                "Error code: 400 - {'error': {'message': 'tool call validation failed', "
                "'code': 'tool_use_failed'}}"
            )
        return SimpleNamespace(
            choices=[
                SimpleNamespace(
                    finish_reason="stop",
                    message=SimpleNamespace(content="Fallback answer"),
                )
            ]
        )


class SalesAssistantHardeningTests(unittest.TestCase):
    def test_chat_retries_with_fallback_prompt_after_tool_validation_error(self):
        completions = FakeCompletions()
        fake_client = SimpleNamespace(
            chat=SimpleNamespace(completions=completions)
        )

        with patch("agents.sales_assistant.agent._get_client", return_value=fake_client):
            result = asyncio.run(chat("How many open opportunities do we have?", []))

        self.assertEqual(result, "Fallback answer")
        self.assertEqual(len(completions.calls), 2)
        self.assertEqual(
            completions.calls[0]["messages"][0]["content"],
            SALES_ASSISTANT_SYSTEM_PROMPT,
        )
        self.assertEqual(
            completions.calls[1]["messages"][0]["content"],
            SALES_ASSISTANT_FALLBACK_PROMPT,
        )

    def test_run_soql_query_returns_partial_result_metadata(self):
        with patch("agents.sales_assistant.tools.get_sf_client") as mock_sf:
            sf = MagicMock()
            sf.query_all.return_value = {
                "records": [{"attributes": {"type": "Opportunity"}, "Id": "001"}],
                "totalSize": 55,
            }
            mock_sf.return_value = sf

            payload = json.loads(run_soql_query("SELECT Id FROM Opportunity LIMIT 20"))

        self.assertTrue(payload["partial_result"])
        self.assertEqual(payload["returned"], 1)
        self.assertEqual(payload["total_size"], 55)
        self.assertIn("note", payload)

    def test_run_soql_query_empty_results_are_consistent(self):
        with patch("agents.sales_assistant.tools.get_sf_client") as mock_sf:
            sf = MagicMock()
            sf.query_all.return_value = {"records": [], "totalSize": 0}
            mock_sf.return_value = sf

            payload = json.loads(run_soql_query("SELECT Id FROM Opportunity LIMIT 20"))

        self.assertEqual(payload["returned"], 0)
        self.assertEqual(payload["total_size"], 0)
        self.assertFalse(payload["partial_result"])
        self.assertEqual(payload["records"], [])

    def test_create_task_does_not_link_when_match_is_ambiguous(self):
        with patch("agents.sales_assistant.tools.get_sf_client") as mock_sf:
            sf = MagicMock()
            sf.query.side_effect = [
                {"records": []},
                {
                    "records": [
                        {"Id": "006A", "Name": "Globex Renewal - Manufacturing"},
                        {"Id": "006B", "Name": "Globex Renewal - Logistics"},
                    ]
                },
            ]
            sf.Task.create.return_value = {"success": True, "id": "00T100"}
            mock_sf.return_value = sf

            payload = json.loads(
                create_task_in_sf(
                    subject="Follow up",
                    related_opportunity_name="Globex Renewal",
                )
            )

        created_task = sf.Task.create.call_args[0][0]
        self.assertNotIn("WhatId", created_task)
        self.assertIsNone(payload["linked_opportunity_id"])
        self.assertIn("warning", payload)
        self.assertIn("Multiple similar opportunities", payload["warning"])


if __name__ == "__main__":
    unittest.main()
