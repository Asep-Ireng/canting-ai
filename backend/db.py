"""Tiny SQLite layer: templates, designs, and a generation log (for timing metrics)."""
import json
import sqlite3
import time
import uuid
from pathlib import Path

from prompts import MOTIFS

DATA = Path(__file__).resolve().parent.parent / "data"
IMAGES = DATA / "images"
IMAGES.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA / "canting.db"


def conn():
    c = sqlite3.connect(DB_PATH)
    c.row_factory = sqlite3.Row
    return c


def init():
    with conn() as c:
        c.executescript("""
        CREATE TABLE IF NOT EXISTS templates(
          id TEXT PRIMARY KEY, name TEXT, description TEXT, palette TEXT,
          origin TEXT, meaning TEXT, builtin INTEGER DEFAULT 0,
          ref_images TEXT DEFAULT '[]', created REAL);
        CREATE TABLE IF NOT EXISTS designs(
          id TEXT PRIMARY KEY, data TEXT, created REAL, updated REAL);
        CREATE TABLE IF NOT EXISTS gen_log(
          id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT, ms INTEGER, ok INTEGER, mock INTEGER, created REAL);
        """)
        for key, m in MOTIFS.items():
            c.execute("""INSERT OR IGNORE INTO templates(id,name,description,palette,origin,meaning,builtin,ref_images,created)
                         VALUES(?,?,?,?,?,?,1,'[]',?)""",
                      (key, m["name"], m["description"], m["palette"], json.dumps(m["origin"]), json.dumps(m["meaning"]), 0))


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


# ---------- images ----------
def save_image(png: bytes) -> str:
    iid = new_id("img")
    (IMAGES / f"{iid}.png").write_bytes(png)
    return iid


def load_image(iid: str) -> bytes:
    p = IMAGES / f"{Path(iid).name}.png"  # Path().name blocks path traversal
    if not p.exists():
        raise FileNotFoundError(iid)
    return p.read_bytes()


# ---------- templates ----------
def _tpl(row) -> dict:
    t = dict(row)
    t["builtin"] = bool(t["builtin"])
    t["ref_images"] = json.loads(t["ref_images"] or "[]")
    for k in ("origin", "meaning"):
        try:
            t[k] = json.loads(t[k]) if t[k] else None
        except (TypeError, json.JSONDecodeError):
            t[k] = {"id": t[k], "en": t[k]}
    return t


def list_templates() -> list[dict]:
    with conn() as c:
        rows = c.execute("SELECT * FROM templates ORDER BY builtin DESC, created DESC").fetchall()
    return [_tpl(r) for r in rows]


def get_template(tid: str) -> dict | None:
    with conn() as c:
        r = c.execute("SELECT * FROM templates WHERE id=?", (tid,)).fetchone()
    return _tpl(r) if r else None


def upsert_template(t: dict) -> dict:
    tid = t.get("id") or new_id("tpl")
    with conn() as c:
        old = c.execute("SELECT builtin, created FROM templates WHERE id=?", (tid,)).fetchone()
        if old and old["builtin"]:
            raise PermissionError("builtin")
        c.execute("""INSERT OR REPLACE INTO templates(id,name,description,palette,origin,meaning,builtin,ref_images,created)
                     VALUES(?,?,?,?,?,?,0,?,?)""",
                  (tid, t["name"], t["description"], t.get("palette"), json.dumps(t.get("origin")),
                   json.dumps(t.get("meaning")), json.dumps(t.get("ref_images", [])),
                   old["created"] if old else time.time()))
    return get_template(tid)


def delete_template(tid: str):
    with conn() as c:
        c.execute("DELETE FROM templates WHERE id=? AND builtin=0", (tid,))


# ---------- designs (stored as a JSON blob; the frontend owns the shape) ----------
def list_designs() -> list[dict]:
    with conn() as c:
        rows = c.execute("SELECT data FROM designs ORDER BY updated DESC").fetchall()
    return [json.loads(r["data"]) for r in rows]


def upsert_design(d: dict) -> dict:
    d["id"] = d.get("id") or new_id("dsn")
    now = time.time()
    with conn() as c:
        c.execute("""INSERT INTO designs(id,data,created,updated) VALUES(?,?,?,?)
                     ON CONFLICT(id) DO UPDATE SET data=excluded.data, updated=excluded.updated""",
                  (d["id"], json.dumps(d), now, now))
    return d


def delete_design(did: str):
    with conn() as c:
        c.execute("DELETE FROM designs WHERE id=?", (did,))


# ---------- metrics ----------
def log_gen(kind: str, ms: int, ok: bool, mock: bool):
    with conn() as c:
        c.execute("INSERT INTO gen_log(kind,ms,ok,mock,created) VALUES(?,?,?,?,?)", (kind, ms, int(ok), int(mock), time.time()))


def stats() -> dict:
    with conn() as c:
        r = c.execute("SELECT COUNT(*) n, AVG(ms) avg FROM gen_log WHERE ok=1 AND kind IN ('generate','edit')").fetchone()
        f = c.execute("SELECT COUNT(*) n FROM gen_log WHERE ok=0").fetchone()
    return {"images": r["n"], "avg_ms": round(r["avg"] or 0), "failed": f["n"]}
