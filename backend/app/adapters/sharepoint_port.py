# app/adapters/sharepoint_port.py
from typing import Protocol


class SharePointPort(Protocol):
    """Port interface for SharePoint data via Microsoft Graph API."""

    def get_list_items(
        self,
        site_id: str,
        list_id: str,
        select: str | None = None,
        filter: str | None = None,
    ) -> list[dict]:
        """Return items from a SharePoint list. Supports $select and $filter."""

    def download_file(self, drive_id: str, item_id: str) -> bytes:
        """Download a file content from SharePoint/OneDrive drive item."""

    def get_delta(self, site_id: str, list_id: str, delta_link: str | None = None) -> dict:
        """Return delta changes for a list (for incremental sync)."""