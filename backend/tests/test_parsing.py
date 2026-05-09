from pathlib import Path
from parsing import parse_file


def test_parse_txt(tmp_path: Path):
    f = tmp_path / "x.txt"
    f.write_text("plain body")
    assert parse_file(f) == "plain body"


def test_parse_md(tmp_path: Path):
    f = tmp_path / "x.md"
    f.write_text("# Title\nbody")
    out = parse_file(f)
    assert "Title" in out and "body" in out


def test_parse_unknown_returns_empty(tmp_path: Path):
    f = tmp_path / "x.xyz"
    f.write_text("ignored")
    assert parse_file(f) == ""
