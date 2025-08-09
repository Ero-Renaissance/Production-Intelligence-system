# app/adapters/ec_oracle.py
from __future__ import annotations

from typing import Iterable

from app.adapters.ec_port import EnergyComponentsPort, Network


class EnergyComponentsOracleAdapter(EnergyComponentsPort):
    """Energy Components adapter using Oracle (python-oracledb / SQLAlchemy).

    This is a stub; wire actual queries/views with your EC team. Return shapes aligned with
    the SPA service layer expectations.
    """

    def __init__(self, dsn: str, user: str, password: str):
        self._dsn = dsn
        self._user = user
        self._password = password
        # TODO: initialize connection pool/engine

    def get_assets(self) -> list[dict]:
        raise NotImplementedError("EC Oracle integration not implemented yet")

    def get_hubs(self, asset_id: str) -> list[dict]:
        raise NotImplementedError("EC Oracle integration not implemented yet")

    def get_facilities(self, hub_id: str) -> list[dict]:
        raise NotImplementedError("EC Oracle integration not implemented yet")

    def get_facility_kpis(self, facility_id: str, networks: Iterable[Network]) -> dict:
        raise NotImplementedError("EC Oracle integration not implemented yet")

    def get_gap_drivers(
        self, asset_id: str | None, facility_ids: list[str] | None, window: str
    ) -> list[dict]:
        raise NotImplementedError("EC Oracle integration not implemented yet")

    def get_terminal_kpis(self, terminal_id: str) -> dict:
        raise NotImplementedError("EC Oracle integration not implemented yet")

    def get_hub_performance(self, hub_id: str, window: str) -> list[dict]:
        raise NotImplementedError("EC Oracle integration not implemented yet") 