"""Test bootstrap for the ares package.

Mirrors backend/tests/conftest.py: pushes the backend dir onto sys.path so
`from ares import …` and `from main import …` both resolve when pytest runs
from `backend/`.
"""
import sys
from pathlib import Path

# backend/ares/tests/conftest.py → parents[2] is backend/
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
