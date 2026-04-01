import os
import logging
from simple_salesforce import Salesforce

logger = logging.getLogger(__name__)

_sf_client: Salesforce | None = None
_describe_cache: dict[str, dict] = {}


def get_sf_client() -> Salesforce:
    """Return a cached Salesforce client, creating one if needed."""
    global _sf_client
    if _sf_client is None:
        username = os.getenv("SF_USERNAME")
        password = os.getenv("SF_PASSWORD")
        security_token = os.getenv("SF_SECURITY_TOKEN", "")
        domain = os.getenv("SF_DOMAIN", "login")

        if not username or not password:
            raise RuntimeError("SF_USERNAME and SF_PASSWORD must be set in environment")

        logger.info("Connecting to Salesforce org (%s.salesforce.com) as %s", domain, username)
        _sf_client = Salesforce(
            username=username,
            password=password,
            security_token=security_token,
            domain=domain,
        )
        logger.info("Salesforce connection established")

    return _sf_client


def reset_sf_client() -> None:
    """Force re-authentication on next get_sf_client() call. Also clears describe cache."""
    global _sf_client
    _sf_client = None
    _describe_cache.clear()


def describe_object_for_llm(object_name: str) -> str:
    """
    Returns a compact field list for a Salesforce object, formatted for LLM consumption.
    Includes all fields — standard and custom (__c). Cached in memory per process.
    """
    if object_name not in _describe_cache:
        sf = get_sf_client()
        try:
            meta = getattr(sf, object_name).describe()
        except Exception as e:
            raise RuntimeError(f"Cannot describe '{object_name}': {e}")
        _describe_cache[object_name] = meta

    meta = _describe_cache[object_name]
    lines = [
        f"Object: {object_name} ({meta.get('label', object_name)})",
        f"Queryable: {meta.get('queryable', False)}",
        "Fields (API name | Label | Type):",
    ]

    for f in meta.get("fields", []):
        name = f.get("name")
        if not name or not f.get("queryable", True):
            continue

        line = f"  {name} | {f.get('label', '')} | {f.get('type', '')}"

        if f.get("type") == "picklist":
            active_values = [v["value"] for v in f.get("picklistValues", []) if v.get("active")]
            if active_values:
                shown = active_values[:15]
                suffix = f" (+{len(active_values) - 15} more)" if len(active_values) > 15 else ""
                line += f" | values: {shown}{suffix}"

        rel = f.get("relationshipName")
        if rel:
            line += f" | relationship: {rel}"

        lines.append(line)

    return "\n".join(lines)
