"""Vercel entry point (and local: python -m uvicorn app:app --reload). Loads the FastAPI app from backend/."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "backend"))

from main import app  # noqa: E402,F401
