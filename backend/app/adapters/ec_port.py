# app/adapters/ec_port.py
from typing import Protocol, Iterable, Literal

Network = Literal["oil", "domesticGas", "exportGas", "flaredGas"]


class EnergyComponentsPort(Protocol):
    """Port interface for querying Energy Components (Oracle-backed) data.

    Implementations may query directly via Oracle (python-oracledb/SQLAlchemy)
    or call vendor REST APIs if DB access is restricted. Methods should return
    plain dict/list structures aligned with the SPA's contract layer upstream.
    """

    def get_assets(self) -> list[dict]:
        """Return the list of assets (e.g., East, West) with identifiers and labels."""

    def get_hubs(self, asset_id: str) -> list[dict]:
        """Return production hubs for a given asset."""

    def get_facilities(self, hub_id: str) -> list[dict]:
        """Return facilities for a given production hub."""

    def get_facility_kpis(self, facility_id: str, networks: Iterable[Network]) -> dict:
        """Return KPI metrics per requested networks for the facility.

        Expected keys per network: maxCapacity, businessTarget, currentProduction, deferment
        """

    def get_gap_drivers(
        self,
        asset_id: str | None,
        facility_ids: list[str] | None,
        window: str,
    ) -> list[dict]:
        """Return top contributors to deferment filtered by asset/facilities/time window."""

    def get_terminal_kpis(self, terminal_id: str) -> dict:
        """Return terminal KPIs: maxCapacity, grossStock, readyCrude, productionRate, endurance."""

    def get_hub_performance(self, hub_id: str, window: str) -> list[dict]:
        """Return time series for hub performance (trend chart)."""