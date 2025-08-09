from __future__ import annotations

import httpx
from dataclasses import dataclass

from app.core.config import get_settings
from app.adapters.pi_web_api import PiWebApiAdapter
from app.adapters.ec_oracle import EnergyComponentsOracleAdapter
from app.adapters.ec_rest import EnergyComponentsRestAdapter
from app.adapters.sharepoint_graph import SharePointGraphAdapter


@dataclass
class HttpClients:
    default: httpx.Client
    timeout_seconds: int


def create_http_clients() -> HttpClients:
    settings = get_settings()

    default_client = httpx.Client(timeout=30)

    return HttpClients(default=default_client, timeout_seconds=30)


def create_pi_client(http_clients: HttpClients) -> PiWebApiAdapter | None:
    settings = get_settings()
    pi_base = getattr(settings, "PI_BASE_URL", None)
    if not pi_base:
        return None
    return PiWebApiAdapter(client=http_clients.default, base_url=pi_base)


def create_ec_client(http_clients: HttpClients) -> EnergyComponentsRestAdapter | EnergyComponentsOracleAdapter | None:
    settings = get_settings()
    # Prefer REST if configured
    ec_base = getattr(settings, "EC_API_BASE_URL", None)
    if ec_base:
        return EnergyComponentsRestAdapter(
            client=http_clients.default,
            base_url=ec_base,
            client_id=getattr(settings, "EC_API_CLIENT_ID", None),
            client_secret=getattr(settings, "EC_API_CLIENT_SECRET", None),
            scope=getattr(settings, "EC_API_SCOPE", None),
            timeout_seconds=int(getattr(settings, "EC_API_TIMEOUT_SECONDS", 30)),
        )

    # Fallback to Oracle if REST not configured
    host = getattr(settings, "EC_DB_HOST", None)
    service = getattr(settings, "EC_DB_SERVICE_NAME", None)
    user = getattr(settings, "EC_DB_USER", None)
    password = getattr(settings, "EC_DB_PASSWORD", None)
    if host and service and user and password:
        dsn = f"{host}/{service}"
        return EnergyComponentsOracleAdapter(dsn=dsn, user=user, password=password)

    return None


def create_sharepoint_client(http_clients: HttpClients) -> SharePointGraphAdapter | None:
    settings = get_settings()
    tenant = getattr(settings, "SP_TENANT_ID", None)
    client_id = getattr(settings, "SP_CLIENT_ID", None)
    client_secret = getattr(settings, "SP_CLIENT_SECRET", None)
    if not (tenant and client_id and client_secret):
        return None
    return SharePointGraphAdapter(
        client=http_clients.default,
        tenant_id=tenant,
        client_id=client_id,
        client_secret=client_secret,
    ) 