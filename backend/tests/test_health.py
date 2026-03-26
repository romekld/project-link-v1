from fastapi.testclient import TestClient


def test_health_returns_200(client: TestClient) -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200


def test_health_response_shape(client: TestClient) -> None:
    body = client.get("/api/v1/health").json()
    assert body["data"]["status"] == "ok"
    assert body["data"]["version"] == "1.0.0"
    assert body["error"] is None
    assert "meta" in body


def test_health_meta_is_dict(client: TestClient) -> None:
    body = client.get("/api/v1/health").json()
    assert isinstance(body["meta"], dict)
