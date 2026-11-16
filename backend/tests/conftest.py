"""Shared API test fixtures for the curated scheme and eligibility endpoints."""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="session")
def client():
    # The context manager runs the lifespan hook, creating app.state.
    with TestClient(app) as test_client:
        yield test_client
