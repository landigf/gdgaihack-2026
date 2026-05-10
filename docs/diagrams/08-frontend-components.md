# 08 — Frontend Component Tree

Houston's UI is a **single-page React 18 app** with a tight
component tree. State lives in `App.tsx` and flows down via props.
No Redux, no Zustand — props + a couple of `useState` hooks are
plenty for a hackathon-scale app.

```mermaid
flowchart TB
    APP["<b>App.tsx</b><br/>state: cwd · entries · selected ·<br/>customFavorites · query · indexedHistory<br/>localStorage: customFavorites"]

    TB[Toolbar.tsx<br/>back / forward / up<br/>path crumbs · search box]
    SB["Sidebar.tsx<br/>system favorites + custom favs<br/>onContextMenuCustomFavorite<br/>onOpenIndexedFolders"]
    BL[BrowseList.tsx<br/>file rows<br/>onContextMenu → buildEntryContextMenu]
    DP["DetailPanel.tsx<br/>preview · meta · AI button<br/>SSE stream consumer"]

    WO[WelcomeOverlay.tsx<br/>shown when cwd === null]
    CM[ContextMenu.tsx<br/>right-click menu portal]
    IFM[IndexedFoldersModal.tsx<br/>history list<br/>switch / forget]

    APP --> TB
    APP --> SB
    APP --> BL
    APP --> DP
    APP --> WO
    APP --> CM
    APP --> IFM

    SB -.->|onContextMenu| CM
    BL -.->|onContextMenu| CM
    CM -.->|Add to Favorites click| APP

    SB -.->|click Indexed Folders| IFM
    IFM -.->|switch / forget| APP

    DP -.->|fetch SSE| API[(sidecar :8765)]
    APP -.->|fetch /index /search| API

    classDef root fill:#7c2d12,stroke:#fb923c,color:#fff7ed
    classDef panel fill:#1e3a8a,stroke:#60a5fa,color:#dbeafe
    classDef overlay fill:#312e81,stroke:#a78bfa,color:#ede9fe
    classDef ext fill:#064e3b,stroke:#34d399,color:#d1fae5
    class APP root
    class TB,SB,BL,DP panel
    class WO,CM,IFM overlay
    class API ext
```

## Layout grid

The window is a **3-row × 2-column grid** with the toolbar
spanning the full width and a status bar at the bottom:

```mermaid
flowchart TB
    subgraph WIN["window — grid-template-rows: 48px 1fr 26px"]
        TBROW["Toolbar — 48px tall<br/>traffic lights overlay at x=18 y=18"]
        BODY["body — flex row"]
        SBROW["status bar — 26px"]
    end

    subgraph BODY["body"]
        SBC[Sidebar<br/>240px fixed]
        MAIN["BrowseList — flex 1 1 0%"]
        DPC[DetailPanel<br/>360px fixed]
    end

    TBROW --- BODY --- SBROW
    SBC --- MAIN --- DPC
```

## Data flow for "Summarize an image"

1. User clicks a `.png` in **BrowseList**.
2. `App.tsx` sets `selected = entry`.
3. **DetailPanel** receives `file = selected` via props.
4. `kindOfFilename` returns `"img"` — the preview shows the image.
5. User clicks **"Describe with AI"** (button label flipped by
   `isImageFilename`).
6. `runSummary()` POSTs to `/summarize/stream` with the path.
7. SSE deltas append to local `summary` state; the bullets render
   live.
8. On `event: done`, `aiState` flips back to `"idle"`.

State boundary: **DetailPanel owns the streaming summary state**
(it's transient, scoped to one file). **App owns** what file is
selected, what folder is open, and persistent favorites. This
keeps the SSE reader local — nobody else needs to know it
exists.

## Why custom context menu (not the OS menu)?

`event.preventDefault()` on `oncontextmenu` lets us render the
menu inside the webview. Two reasons:

- **Cross-platform consistency** — Houston shouldn't look
  different on macOS vs Linux even if today it only ships for
  macOS.
- **Action attachment** — "Add to Favorites" can call back into
  React state directly. With the OS menu we'd need to bridge
  through Tauri's `MenuBuilder` and `emit` events, which is more
  ceremony for the same outcome.

The menu is a **portal-mounted absolute-positioned div** that
closes on outside-click and on `Escape`. Standard pattern.
