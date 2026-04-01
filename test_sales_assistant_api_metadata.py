import unittest

from api.routes.sales_assistant import _extract_sales_metadata


class SalesAssistantApiMetadataTests(unittest.TestCase):
    def test_extract_sales_metadata_splits_clean_response_and_payload(self):
        response = """Summary

- Deal looks healthy

```salesmeta
{
  "opportunity_insights": {
    "deal_value": "$125,000",
    "stage": "Negotiation/Review",
    "risk_level": "medium",
    "last_activity": "Apr 1, 2026"
  },
  "account_summary": {
    "key_contacts": ["Jordan Lee", "Maya Patel"],
    "engagement_score": "78/100"
  },
  "recommended_actions": ["Confirm procurement call", "Tighten close plan"],
  "email": {
    "subject": "Follow-up on renewal",
    "body": "Hi team\\nCan we confirm next steps?"
  }
}
```"""

        clean, metadata = _extract_sales_metadata(response)

        self.assertNotIn("salesmeta", clean)
        self.assertIn("Deal looks healthy", clean)
        self.assertEqual(metadata["opportunity_insights"]["deal_value"], "$125,000")
        self.assertEqual(metadata["account_summary"]["key_contacts"][0], "Jordan Lee")
        self.assertEqual(metadata["recommended_actions"][0], "Confirm procurement call")
        self.assertEqual(metadata["email"]["subject"], "Follow-up on renewal")


if __name__ == "__main__":
    unittest.main()
