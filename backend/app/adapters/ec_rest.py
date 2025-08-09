# app/adapters/ec_rest.py
from __future__ import annotations

import httpx
from typing import Iterable

from app.adapters.ec_port import EnergyComponentsPort, Network


class EnergyComponentsRestAdapter(EnergyComponentsPort):
    """Energy Components adapter using the vendor REST API.

    Configure base URL and OAuth/client-credentials as required by your EC deployment.
    """

    def __init__(self, client: httpx.Client, base_url: str, client_id: str | None = None, client_secret: str | None = None, scope: str | None = None, timeout_seconds: int = 30):
        self._client = client
        self._base_url = base_url.rstrip("/")
        self._client_id = client_id
        self._client_secret = client_secret
        self._scope = scope
        self._timeout_seconds = timeout_seconds
        # TODO: implement auth/token acquisition if required

    def get_assets(self) -> list[dict]:
        raise NotImplementedError("EC REST integration not implemented yet")

    def get_hubs(self, asset_id: str) -> list[dict]:
        raise NotImplementedError("EC REST integration not implemented yet")

    def get_facilities(self, hub_id: str) -> list[dict]:
        raise NotImplementedError("EC REST integration not implemented yet")

    def get_facility_kpis(self, facility_id: str, networks: Iterable[Network]) -> dict:
        raise NotImplementedError("EC REST integration not implemented yet")

    def get_gap_drivers(
        self, asset_id: str | None, facility_ids: list[str] | None, window: str
    ) -> list[dict]:
        raise NotImplementedError("EC REST integration not implemented yet")

    def get_terminal_kpis(self, terminal_id: str) -> dict:
        raise NotImplementedError("EC REST integration not implemented yet")

    def get_hub_performance(self, hub_id: str, window: str) -> list[dict]:
        raise NotImplementedError("EC REST integration not implemented yet") 