# app/adapters/sharepoint_graph.py
from __future__ import annotations

import httpx

from app.adapters.sharepoint_port import SharePointPort


class SharePointGraphAdapter(SharePointPort):
    """SharePoint adapter using Microsoft Graph API (app-only auth via MSAL)."""

    def __init__(self, client: httpx.Client, tenant_id: str, client_id: str, client_secret: str):
        self._client = client
        self._tenant_id = tenant_id
        self._client_id = client_id
        self._client_secret = client_secret
        # TODO: add MSAL confidential client and token acquisition

    def get_list_items(self, site_id: str, list_id: str, select: str | None = None, filter: str | None = None) -> list[dict]:
        raise NotImplementedError("SharePoint Graph integration not implemented yet")

    def download_file(self, drive_id: str, item_id: str) -> bytes:
        raise NotImplementedError("SharePoint Graph integration not implemented yet")

    def get_delta(self, site_id: str, list_id: str, delta_link: str | None = None) -> dict:
        raise NotImplementedError("SharePoint Graph integration not implemented yet") 