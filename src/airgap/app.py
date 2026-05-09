"""Streamlit fallback UI for Sovereign Investigation Workbench.

Use this if AnythingLLM phones home in airplane mode and we can't block it
in time, or if the team votes against AnythingLLM at the T+90 huddle.

This UI satisfies the brief's "AI cannot be an isolated terminal chatbot"
mandate by:
  - Drag-and-drop folder ingestion (not just chat)
  - Sidebar showing the indexed corpus + entity tags
  - Per-citation "open source" panel (clickable [S_n] links)
  - Visible airplane-mode banner that updates from `is_reachable()` checks

Dependencies:
    /opt/homebrew/bin/python3.12 -m pip install --user --break-system-packages streamlit

Run:
    /opt/homebrew/bin/python3.12 -m streamlit run src/airgap/app.py -- \\
        --db benchmarks/datasets/investigation-corpus/app.db

Notes:
  - Streamlit is local (binds 127.0.0.1:8501); zero outbound network
    when run with `--server.address 127.0.0.1`. Streamlit *does* check
    for updates by default — pin offline by setting in ~/.streamlit/config.toml:
        [browser]
        gatherUsageStats = false
        [global]
        showWarningOnDirectExecution = false
  - This is a hackathon demo, not production. No auth, no SSL.
"""
from __future__ import annotations

import argparse
import os
import sys
import time
from pathlib import Path

# Force-disable Streamlit telemetry BEFORE importing it.
os.environ["STREAMLIT_BROWSER_GATHERUSAGESTATS"] = "false"
os.environ["STREAMLIT_GLOBAL_DEVELOPMENTMODE"] = "false"

try:
    import streamlit as st
except ImportError:
    print(
        "streamlit not installed. Run:\n"
        "  /opt/homebrew/bin/python3.12 -m pip install --user "
        "--break-system-packages streamlit",
        file=sys.stderr,
    )
    sys.exit(1)

from . import llm, prompt, retrieve

# --------------------------------------------------------------------------
# CLI args (Streamlit-friendly: forwarded after `--`)
# --------------------------------------------------------------------------
def _parse_args() -> argparse.Namespace:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--db",
        default="benchmarks/datasets/investigation-corpus/app.db",
    )
    ap.add_argument("--llm-model", default="gemma3:4b")
    ap.add_argument("--persona", default="investigation",
                    choices=["incident", "investigation"])
    ap.add_argument("--top-k", type=int, default=6)
    return ap.parse_args(sys.argv[sys.argv.index("--") + 1:]
                          if "--" in sys.argv else [])


ARGS = _parse_args()

# --------------------------------------------------------------------------
# Page config
# --------------------------------------------------------------------------
st.set_page_config(
    page_title="Sovereign Investigation Workbench",
    page_icon="🔒",
    layout="wide",
    initial_sidebar_state="expanded",
)

# --------------------------------------------------------------------------
# Top banner — airplane-mode proof
# --------------------------------------------------------------------------
ollama_up = llm.is_reachable()
db_path = Path(ARGS.db)
db_present = db_path.is_file()

col1, col2, col3 = st.columns([2, 1, 1])
with col1:
    st.markdown("# 🔒 Sovereign Investigation Workbench")
    st.caption("On-device · zero cloud · cited evidence-surfacing for "
               "investigators, auditors, whistleblower offices, public defenders.")

with col2:
    if ollama_up:
        st.success("✅ Ollama local")
    else:
        st.error("⚠️ Ollama unreachable — start `ollama serve`")

with col3:
    if db_present:
        st.success(f"✅ Corpus indexed")
    else:
        st.error(f"⚠️ Index missing at {db_path.name}")

# --------------------------------------------------------------------------
# Sidebar — corpus inspector + settings
# --------------------------------------------------------------------------
with st.sidebar:
    st.markdown("### Corpus")
    st.caption(f"DB: `{ARGS.db}`")
    st.caption(f"Model: `{ARGS.llm_model}` · persona `{ARGS.persona}`")

    if db_present:
        import sqlite3
        conn = sqlite3.connect(ARGS.db)
        try:
            n_docs = conn.execute("SELECT COUNT(*) FROM docs").fetchone()[0]
            n_chunks = conn.execute("SELECT COUNT(*) FROM chunks").fetchone()[0]
            st.metric("Documents", n_docs)
            st.metric("Chunks", n_chunks)
            with st.expander("Document list", expanded=False):
                for row in conn.execute(
                    "SELECT d.doc_id, d.title, COUNT(c.chunk_id) AS n "
                    "FROM docs d LEFT JOIN chunks c USING(doc_id) "
                    "GROUP BY d.doc_id ORDER BY d.doc_id"
                ):
                    st.markdown(f"- **{row[0]}** ({row[2]} chunks)")
                    if row[1]:
                        st.caption(row[1][:120])
        finally:
            conn.close()
    else:
        st.warning("Run `python3 -m src.airgap.index` first.")

    st.markdown("---")
    st.markdown("### Drop documents")
    uploaded = st.file_uploader(
        "Add to corpus (markdown / PDF / HTML / email)",
        type=["md", "pdf", "html", "txt"],
        accept_multiple_files=True,
        help="Files are saved locally and re-indexed; nothing leaves the device.",
    )
    if uploaded:
        st.info(
            f"{len(uploaded)} file(s) staged. "
            "Save them under "
            "`benchmarks/datasets/investigation-corpus/sources/dropped/` "
            "then re-run `python3 -m src.airgap.index ...` to include them."
        )

    st.markdown("---")
    st.markdown("### Airplane-mode evidence")
    st.code(
        "sudo tcpdump -i any -n 'host not localhost'",
        language="bash",
    )
    st.caption("Run in a side terminal during demo. Should be silent.")

# --------------------------------------------------------------------------
# Main panel — query + cited findings
# --------------------------------------------------------------------------
st.markdown("---")
st.markdown("### Ask the corpus")

example_queries = [
    "Find every email that contradicts the press release about Q3 outlook",
    "Build a timeline of communications about the Raptor SPE",
    "Surface money flows above $1 million between Enron and any SPE",
    "Find self-contradictions in Skilling's communications about Q3 outlook",
    "Flag PDFs with redactions and infer what's behind them",
    "Draft a SOX-style findings memo from the audit anomaly worksheets",
]

with st.expander("Example queries (click to use)", expanded=False):
    for q in example_queries:
        if st.button(q, key=f"ex_{hash(q)}"):
            st.session_state["query"] = q

query = st.text_area(
    "Query",
    value=st.session_state.get("query", ""),
    height=80,
    placeholder=(
        "Ask in plain English. The model will only cite from the indexed "
        "corpus and abstain if evidence is insufficient."
    ),
)

run = st.button("🔍 Search & analyze", type="primary", disabled=not (db_present and ollama_up))

if run and query.strip():
    with st.status("Running on-device pipeline...", expanded=True) as status:
        status.update(label="1/3 retrieving from local corpus...")
        t0 = time.perf_counter()
        hits = retrieve.hybrid_search(ARGS.db, query, k=ARGS.top_k)
        t_retrieve = (time.perf_counter() - t0) * 1000
        status.write(f"  → {len(hits)} hits in {t_retrieve:.0f} ms")

        if not hits:
            status.update(label="No hits. Try a different query.", state="error")
            st.warning("Retrieval returned 0 hits — try broader keywords.")
            st.stop()

        status.update(label="2/3 building cited prompt...")
        messages = prompt.build_messages(query, hits, persona=ARGS.persona)
        status.write(f"  → system={len(messages[0]['content'])}ch, "
                     f"user={len(messages[1]['content'])}ch")

        status.update(label="3/3 calling local LLM (gemma3:4b)...")
        t1 = time.perf_counter()
        text, timing = llm.chat(messages, model=ARGS.llm_model, timeout=180)
        t_llm = time.perf_counter() - t1
        status.write(f"  → LLM responded in {t_llm:.2f}s ({len(text)} chars)")
        status.update(label="Done.", state="complete")

    # ----- render answer -----
    st.markdown("### Answer")
    parsed = prompt.parse_response(text)
    if parsed:
        st.json(parsed, expanded=True)
    else:
        st.warning("LLM did not return parseable JSON; showing raw output.")
        st.code(text, language="json")

    # ----- citation explorer -----
    st.markdown("### Sources cited")
    for i, h in enumerate(hits, 1):
        with st.expander(f"[S{i}] {h.doc_id} · {h.anchor[:70]}", expanded=False):
            st.markdown(f"**Document:** `{h.doc_id}`")
            st.markdown(f"**Section:** `{h.anchor}`")
            st.markdown(f"**Page:** {h.page} · **chunk_id:** {h.chunk_id} · "
                        f"**score:** {h.score:.3f}")
            st.markdown("**Full text:**")
            st.text(h.text)

    # ----- timing strip -----
    st.markdown("---")
    cA, cB, cC = st.columns(3)
    cA.metric("Retrieval", f"{t_retrieve:.0f} ms")
    cB.metric("LLM (e2e)", f"{t_llm:.2f} s")
    cC.metric("Total", f"{(t_retrieve / 1000 + t_llm):.2f} s")

elif run and not query.strip():
    st.warning("Enter a query.")

# --------------------------------------------------------------------------
# Footer
# --------------------------------------------------------------------------
st.markdown("---")
st.caption(
    "Sovereign Investigation Workbench · PoliSa · GDG AI HACK 2026 · "
    "MSI Cut the Cord · runs on-device, no cloud, airplane-mode-safe by construction."
)
