# app/adapters/pi_web_api.py
from __future__ import annotations

from typing import Any
import httpx

from app.adapters.pi_port import PiSystemPort


class PiWebApiAdapter(PiSystemPort):
    """PI System adapter using PI Web API over HTTP(S).

    Configure base URL and auth in environment. Supports Basic/NTLM/OAuth depending on infra.
    """

    def __init__(self, client: httpx.Client, base_url: str):
        self._client = client
        self._base_url = base_url.rstrip("/")

    def get_stream_summary(self, web_id: str, start: str, end: str, interval: str) -> dict:
        # Placeholder implementation
        raise NotImplementedError("PI Web API integration not implemented yet")

    def get_recorded(self, web_id: str, start: str, end: str) -> list[dict]:
        # Placeholder implementation
        raise NotImplementedError("PI Web API integration not implemented yet")

    def get_current_values(self, web_ids: list[str]) -> dict[str, dict]:
        # Placeholder implementation
        raise NotImplementedError("PI Web API integration not implemented yet") 