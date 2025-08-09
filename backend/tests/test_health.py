from fastapi.testclient import TestClient


def test_healthz(client: TestClient):
    resp = client.get("/api/v1/healthz")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "app" in data
    assert "env" in data
