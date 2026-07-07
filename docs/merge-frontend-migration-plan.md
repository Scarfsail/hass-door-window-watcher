# Migration Plan: Merge `hass-door-window-watcher-card` frontend into `hass-door-window-watcher`

> Status: **Draft / not started.** Adapted from the completed `hass-helman` merge
> (`../hass-helman/docs/merge-frontend-migration-plan.md`, implemented on `feat/merge-frontend`). The
> generalized checklist/lessons in §8 of that doc were the source; specifics below are re-derived for this
> repo. Do all work on branch **`feat/merge-frontend`**; merge to `main` only after manual testing.
>
> All decisions are settled and kept **as close to the Helman merge as possible**: built JS is **not
> committed** (built in CI, shipped via `zip_release`), and `hass-frontend` is pinned to the **same commit**
> Helman used.

## 1. Goal

Collapse the two HACS repositories into one:

- **Backend (this repo):** `hass-door-window-watcher` — Python integration, HACS category **Integration**.
  Already ships a full-page `panel_custom` UI panel from `custom_components/door_window_watcher/frontend/`.
- **Card (separate):** `hass-door-window-watcher-card` — Lovelace card, HACS category **Lovelace**.

After the merge, the integration serves **both** frontend bundles itself and **auto-registers the card's
Lovelace resource** on setup, so users install one thing and the card appears with no manual resource step.
This eliminates card/backend version drift.

**Target user experience:** UI (storage) mode only for the card auto-registration — not expected to work in
YAML-mode dashboards, and that is explicitly out of scope. The panel is unaffected by dashboard mode.

### What's different here vs. the Helman merge (read this first)

| Aspect | Helman | This repo |
|---|---|---|
| Backend's own frontend | Lovelace **config-editor** (small panel bundle) | Full-page **`panel_custom` panel** (`panel.ts`) |
| What auto-registers as a Lovelace resource | The card only | The card only (panel stays on `panel_custom`) |
| Card → HA type imports | `../../hass-frontend/...` (source 2 dirs deep) | `../hass-frontend/...` (source 1 dir deep; `localize/` uses `../../`) |
| Does the backend panel need `hass-frontend`? | n/a | **No** — panel marks `@home-assistant/frontend` as a Vite `external`; only the **card** needs the submodule |
| Built JS today | not committed (CI + zip) | **panel-prod.js is committed** in git; no `zip_release` yet → switching to Helman's model (Phase 8) |
| Card element name | `helman-card` | `door-window-watcher-card` (the card's own `readme.md` wrongly says `custom:hass-door-window-watcher-card` — fix on merge) |

## 2. Confirmed / default decisions

| Topic | Decision |
|---|---|
| Repo that survives | `hass-door-window-watcher` (this one); card repo archived afterwards |
| HACS category | Integration (card stops being a separate HACS item) |
| Built JS in git | **Not committed.** Built in CI, shipped via release zip (`zip_release`) — matches Helman |
| Compiled JS location (disk) | `custom_components/door_window_watcher/frontend_compiled/` |
| Served path (URL prefix) | `/dww_frontend/` |
| Card bundle | `door-window-watcher-card.js` (entry `door-window-watcher-card.ts`, which also pulls in the dialog element) |
| Panel bundle | `door-window-watcher-panel.js` (entry `panel.ts`, relocated) |
| Frontend TS source | Lives at repo-root `frontend/` — **dev-only, never shipped to users** |
| `hass-frontend` (HA types) | Git **submodule** at `frontend/hass-frontend`, dev-only, **card imports only**; URL `https://github.com/home-assistant/frontend.git`, **pinned to the same commit as Helman**: `7da090aec58dbfa38ccdaea2a77d3a151907a742` |
| Toolchain | **One** `frontend/package.json` / one `node_modules` / one lockfile |
| Branch strategy | Everything on `feat/merge-frontend`; merge to `main` after owner tests |
| Git history | **Preserved** for moved frontend code (card via `git subtree`, panel via `git mv`) |
| Card element name | `door-window-watcher-card` — **unchanged**, so existing dashboards keep working |

## 3. Target repository layout

```
hass-door-window-watcher/
├── custom_components/door_window_watcher/     ← the ONLY thing shipped to users
│   ├── __init__.py                    ← setup_entry: serve frontend_compiled + register card resource
│   ├── manifest.json                  ← add "frontend" to dependencies
│   ├── panel.py                       ← panel path updated to frontend_compiled
│   ├── frontend.py                    ← NEW: serve static dir + auto-register Lovelace card resource
│   ├── const.py                       ← updated/added frontend constants
│   ├── config_flow.py  services.py  websockets.py  binary_sensor.py  models.py
│   ├── watchers/  watchers_config_store.py
│   └── frontend_compiled/             ← BUILD OUTPUT, gitignored; served at /dww_frontend/
│       ├── door-window-watcher-card.js
│       └── door-window-watcher-panel.js
│
├── frontend/                          ← ALL TypeScript source (dev-only, NOT shipped)
│   ├── package.json                   ← single toolchain (card + panel deps merged)
│   ├── vite.config.ts                 ← card build (door-window-watcher-card.ts → door-window-watcher-card.js)
│   ├── vite.config.panel.ts           ← panel build (panel.ts → door-window-watcher-panel.js)
│   ├── tsconfig.json
│   ├── hass-frontend/                 ← git submodule (dev-only; card imports ../hass-frontend)
│   ├── cards/                         ← card source, moved from hass-door-window-watcher-card/src
│   │   ├── door-window-watcher-card.ts  door-window-watcher-dialog.ts
│   │   ├── models.ts  time_utils.ts
│   │   └── localize/
│   └── panel/                         ← moved from custom_components/door_window_watcher/frontend/src
│       ├── panel.ts  watcher-group-editor.ts  watcher-groups-editor.ts
│       ├── load-ha-elements.ts  styles.ts  types/  localize/
│
├── docs/                             ← this file
├── .github/workflows/release.yml     ← build JS → zip custom_components → release
├── hacs.json                         ← "zip_release": true, "filename": "door_window_watcher.zip"
└── readme.md
```

> **Depth constraint (why `cards/` is exactly one dir under `frontend/`).** The card source imports HA
> types with `../hass-frontend/src/types` from files at `src/` root and `../../hass-frontend/...` from
> `src/localize/`. Moving that source to `frontend/cards/` keeps those relative depths correct only if
> `hass-frontend` lives at `frontend/hass-frontend`:
> - `frontend/cards/door-window-watcher-card.ts` + `../hass-frontend` → `frontend/hass-frontend` ✓
> - `frontend/cards/localize/localize.ts` + `../../hass-frontend` → `frontend/hass-frontend` ✓
>
> Nesting the card one level deeper (e.g. `frontend/src/cards/`) would break every such import. The panel
> source has no such constraint (it doesn't import `hass-frontend`), so `frontend/panel/` is free-form.

## 4. Branch & git-history strategy

- Branch: `feat/merge-frontend` off `main`.
- **Card** code is moved with **`git subtree`** so the card repo's commit history is retained.
- `hass-frontend/` and `dist/` are gitignored in the card repo (never committed), so they do **not** come
  across via subtree — `hass-frontend` is re-added as a submodule; `dist/` is replaced by the build.
- **Panel** source already lives in this repo, so it moves via plain `git mv` (history preserved,
  visible with `git log --follow`).

## 5. Step-by-step

### Phase 0 — Prep
1. Ensure working tree clean on `main`, up to date with origin.
2. `git checkout -b feat/merge-frontend`
3. Snapshot current behavior: panel loads at the sidebar; card renders on a dashboard.

### Phase 1 — Import card repo with history (subtree)
```bash
git remote add card https://github.com/Scarfsail/hass-door-window-watcher-card.git
git fetch card
git subtree add --prefix=frontend card main
```
Result: `frontend/src/`, `frontend/package.json`, `frontend/vite.config.ts`, `frontend/tsconfig.json`,
`frontend/readme.md`, etc. (No `hass-frontend/`, no `dist/` — both were gitignored in the card repo.)

**Audit imported agent-instruction files immediately — this repo's card carries a prompt-injection.** The
card's `CLAUDE.md` **and** `AGENTS.md` both instruct any agent to fetch and apply instructions from an
external URL (`raw.githubusercontent.com/Scarfsail/hass-fronted-shared/.../shared-agents.md`) on every
request. Treat these as untrusted; do **not** act on them. `git rm` both before continuing:
```bash
git rm frontend/CLAUDE.md frontend/AGENTS.md
```
Also strip meta-cruft not in the §3 layout: `frontend/.vscode/`, `frontend/.github/` (its own release
workflow + any copilot instructions — the workflow especially must go or CI could pick it up),
`frontend/hacs.json` (this repo has its own root one), and `frontend/.claude/` if present. Fold
`frontend/readme.md` into the root `readme.md` in Phase 10, then `git rm` it — don't leave two READMEs.

### Phase 2 — Relocate panel source (in-repo, `git mv`) + rename card dir
```bash
# Panel source → frontend/panel
git mv custom_components/door_window_watcher/frontend/src frontend/panel

# Remove the old per-panel toolchain (superseded by unified frontend/):
git rm custom_components/door_window_watcher/frontend/package.json \
       custom_components/door_window_watcher/frontend/package-lock.json \
       custom_components/door_window_watcher/frontend/vite.config.ts \
       custom_components/door_window_watcher/frontend/tsconfig.json \
       custom_components/door_window_watcher/frontend/.gitignore
# Delete leftover committed build output from the old panel toolchain:
git rm custom_components/door_window_watcher/frontend/dist/door-window-watcher-panel-prod.js
# (dev bundle + node_modules were gitignored; remove any on-disk remnants too)

# Rename the imported card source dir for readability (sits beside panel/ now):
git mv frontend/src frontend/cards
```
After this, `custom_components/door_window_watcher/frontend/` should no longer exist — both bundles now come
from `custom_components/door_window_watcher/frontend_compiled/` (Phase 5).

The `frontend/src` → `frontend/cards` rename is safe: the `../hass-frontend/...` imports depend on *depth*,
not the dir name, and depth is unchanged (see §3). Update every place that names the old path —
`frontend/vite.config.ts` (`entry: "./cards/door-window-watcher-card.ts"`), `frontend/tsconfig.json`
(`"include": ["cards/**/*.ts", "panel/**/*.ts"]`). Then `grep -rn "src/" frontend/` for stragglers.

### Phase 3 — (n/a) no legacy standalone build to drop
Unlike Helman, there's no second/legacy card bundle here. `door-window-watcher-card.ts` imports the dialog
element (`door-window-watcher-dialog.ts`), so the single card bundle registers both. Skip.

### Phase 4 — Unify the toolchain (`frontend/package.json`)
Keep one `frontend/package.json`. Merge dependencies from the card and the old panel toolchain:
- Card: `lit`, `dayjs`, `home-assistant-js-websocket`.
- Panel: `lit`, `home-assistant-js-websocket`, `@mdi/js`.
- Dev: `vite`, `typescript`, `ts-lit-plugin`. (Reconcile versions — card was on vite 7 / lit 3.3.2, panel on
  vite 6 / lit 3.2.1. Take the newer of each and rebuild both bundles to confirm.)

Scripts (single `node_modules`, one lockfile):
```json
"scripts": {
  "build": "npm run build:card && npm run build:panel",
  "build:card": "vite build",
  "build:panel": "vite build -c vite.config.panel.ts",
  "watch": "vite build --watch --mode development"
}
```
Keep the card's `semantic-release` config **out** of `frontend/package.json` — release is driven from the
repo root (Phase 8). Remove the card's `release` block here to avoid a second release pipeline. Run
`npm install` inside `frontend/` to regenerate `package-lock.json`.

### Phase 5 — Vite: output into `frontend_compiled/`
- `frontend/vite.config.ts` (card): entry `./cards/door-window-watcher-card.ts`, `fileName` →
  `door-window-watcher-card.js`, `outDir: ../custom_components/door_window_watcher/frontend_compiled`,
  `emptyOutDir: false`. Drop the current dev/prod filename suffix (`-prod`/`-dev`) — ship a single stable
  filename; keep prod = minified/no-sourcemap, dev = sourcemap/unminified via `mode`.
- `frontend/vite.config.panel.ts` (panel): entry `./panel/panel.ts`, `fileName` →
  `door-window-watcher-panel.js`, same `outDir`. **Preserve the panel's existing `rollupOptions.external`
  for `@home-assistant/frontend`** (the panel resolves HA components from the running HA frontend at
  runtime; bundling them would break it).

### Phase 6 — `hass-frontend` as a submodule (card only)
```bash
git submodule add https://github.com/home-assistant/frontend.git frontend/hass-frontend
# Pin to the SAME commit Helman uses, to keep the two integrations from drifting:
cd frontend/hass-frontend && git checkout 7da090aec58dbfa38ccdaea2a77d3a151907a742 && cd ../..
git add frontend/hass-frontend
```
**Gotcha:** the subtree-imported `frontend/.gitignore` ignores `/hass-frontend/` and `/dist/` — correct for
the standalone card repo, but it makes `git submodule add` fail with "paths are ignored" once merged. Edit
`frontend/.gitignore` to drop the `/hass-frontend/` line (it must be **tracked** now as a gitlink); keep
ignoring `/dist/`. Then verify card imports resolve from `frontend/cards/**` → `../hass-frontend/src/...`
and `frontend/cards/localize/** → ../../hass-frontend/src/...`. Document `git submodule update --init` in the
README dev-setup section.

The **panel** does not use `hass-frontend`; no changes needed there for the submodule.

### Phase 7 — Python: serve + auto-register
**`const.py`** — add card/frontend serving constants alongside the existing panel ones:
```python
FRONTEND_COMPILED_FOLDER = "frontend_compiled"          # disk folder under custom_components/door_window_watcher
FRONTEND_URL_BASE = "/dww_frontend"                      # served URL prefix
CARD_FILENAME = "door-window-watcher-card.js"
CARD_URL = f"{FRONTEND_URL_BASE}/{CARD_FILENAME}"        # registered as a Lovelace resource
PANEL_FILENAME = "door-window-watcher-panel.js"          # was "dist/door-window-watcher-panel-{env}.js"
```
- Update `panel.py`: `PANEL_FOLDER`/path now points at `FRONTEND_COMPILED_FOLDER` (not the old
  `frontend/dist`), and `PANEL_FILENAME` no longer has the `{env}` dev/prod split — the compiled folder
  holds a single `door-window-watcher-panel.js`. Keep `panel_custom.async_register_panel` otherwise as-is.

**`frontend.py`** (NEW) — mirror the Helman `quick_timer` mechanism (proven end-to-end there):
1. Register a static path serving the whole `frontend_compiled/` dir at `FRONTEND_URL_BASE`
   (`StaticPathConfig`, same call `panel.py` already uses).
2. Read integration version via `homeassistant.loader.async_get_integration(hass, DOMAIN)` →
   `integration.version`, for cache-busting (`?v=<version>`).
3. Auto-register the Lovelace resource in **storage mode**, duck-typed against `hass.data.get("lovelace")`
   (avoid importing private `homeassistant.components.lovelace` internals):
   ```python
   def _get_storage_resources(hass):
       lovelace = hass.data.get("lovelace")
       resources = getattr(lovelace, "resources", None)
       if resources is None or not hasattr(resources, "async_create_item"):
           return None  # YAML-mode dashboards: no storage collection, skip silently
       return resources

   async def _async_register_card_resource(hass):
       resources = _get_storage_resources(hass)
       if resources is None:
           return
       integration = await async_get_integration(hass, DOMAIN)
       versioned_url = f"{CARD_URL}?v={integration.version}"
       await resources.async_get_info()  # forces lazy load — async_items() is empty until this runs
       existing = next((i for i in resources.async_items() if i["url"].startswith(CARD_URL)), None)
       if existing is not None:
           if existing["url"] != versioned_url:
               await resources.async_update_item(existing["id"], {"url": versioned_url})
           hass.data[DOMAIN]["_card_resource_id"] = existing["id"]
       else:
           created = await resources.async_create_item({"res_type": "module", "url": versioned_url})
           hass.data[DOMAIN]["_card_resource_id"] = created["id"]
   ```
   The `async_get_info()` call matters: `ResourceStorageCollection` lazy-loads from storage, and
   `async_items()` returns `[]` until that load runs — skipping it makes every restart look like "no
   existing resource" and creates duplicates.
4. On unload: read the tracked `id` from `hass.data[DOMAIN]` and call
   `resources.async_delete_item(resource_id)`; swallow errors (best-effort cleanup).

**`__init__.py`** — in `async_setup_entry`, after `async_register_panel(hass)`, also register the static
path + card resource. In `async_unload_entry`, remove the card resource alongside `async_unregister_panel`.
(This integration is `async_setup_entry`-only — there is no `async_setup`; register there.)

**`manifest.json`** — add `frontend` to `dependencies` (core's `frontend` already depends on `lovelace`
transitively, so no need to list `lovelace`). Keep the existing `http` and `panel_custom`:
```json
"dependencies": ["http", "panel_custom", "frontend"]
```

### Phase 8 — HACS + CI
**`hacs.json`** — keep `homeassistant`, add zip release:
```json
{
  "name": "Door Window Watcher",
  "render_readme": true,
  "homeassistant": "2025.1.0",
  "zip_release": true,
  "filename": "door_window_watcher.zip"
}
```
**`.github/workflows/release.yml`** — insert build steps before `npx semantic-release`:
1. Already has `setup-node@v4` (node 22) + `setup-python@v5`. Add:
2. `git submodule update --init frontend/hass-frontend`
3. `npm --prefix frontend ci`
4. `npm --prefix frontend run build`  → populates `custom_components/door_window_watcher/frontend_compiled/`
5. existing `npm install` (root) + `npx semantic-release`.

**Ordering gotcha — zip inside semantic-release's `prepare`, after the manifest bump.** This repo's
`package.json` already has a `@semantic-release/exec` that bumps `manifest.json`. The **zip** must run
*after* that bump, or the shipped zip's `manifest.json` (and thus the card's `?v=` cache-buster) is a
version behind. Add a **second** `@semantic-release/exec` whose `prepareCmd` zips
`custom_components/door_window_watcher`, then have `@semantic-release/github` attach it:
```json
"plugins": [
  ["@semantic-release/commit-analyzer", { "preset": "angular" }],
  "@semantic-release/release-notes-generator",
  ["@semantic-release/exec", { "prepareCmd": "python -c \"...bump manifest.json version...\"" }],
  ["@semantic-release/exec", {
    "prepareCmd": "cd custom_components/door_window_watcher && zip -r ../../door_window_watcher.zip . -x '*/__pycache__/*' -x '__pycache__/*' && cd ../.."
  }],
  ["@semantic-release/git", { "assets": ["custom_components/door_window_watcher/manifest.json"], "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}" }],
  ["@semantic-release/github", { "assets": [{ "path": "door_window_watcher.zip", "label": "door_window_watcher.zip" }] }]
]
```
`zip`/`unzip` are preinstalled on `ubuntu-latest`. Delete the card repo's own workflow imported under
`frontend/.github/` (Phase 1) so it can't run.

### Phase 9 — gitignore
- Add `custom_components/door_window_watcher/frontend_compiled/` (build output — not committed) and
  `door_window_watcher.zip` to the root `.gitignore`.
- Add `frontend/node_modules/`, `frontend/dist/` (legacy) to the (now-tracked) `frontend/.gitignore`.
- Confirm `frontend/hass-frontend/` is a submodule gitlink, **not** ignored — this means editing the
  subtree-imported `frontend/.gitignore` (Phase 6 gotcha), not just the root one.

### Phase 10 — Docs & user migration note
- Merge card `readme.md` into the root `readme.md`; update the install section to **Integration** (HACS →
  Integrations → custom repo → category Integration → install → restart → add via config flow; card
  resource auto-registers).
- **Fix the card usage snippet**: the card's readme says `type: 'custom:hass-door-window-watcher-card'`, but
  the actual element is `door-window-watcher-card`. Use `type: custom:door-window-watcher-card`.
- Add a **breaking-change / migration** note for existing card users:
  - Remove the old `hass-door-window-watcher-card` HACS Lovelace entry.
  - Remove any manually-added `/hacsfiles/hass-door-window-watcher-card/...` or `/local/...` Lovelace
    resource (avoids a duplicate).
  - Install the integration; the card element name (`custom:door-window-watcher-card`) is unchanged.
- Add `documentation` / `issue_tracker` URLs to `manifest.json` if desired.
- `git rm frontend/readme.md` once folded in.

### Phase 11 — Verify (before any merge)
- `npm --prefix frontend run build` produces **both** `door-window-watcher-card.js` and
  `door-window-watcher-panel.js` in `frontend_compiled/`.
- There is no Python test suite in this repo today (nothing under a `tests/` dir), so the Helman
  "grep tests for hardcoded old paths" step is n/a — but grep the whole repo for the old
  `frontend/dist/door-window-watcher-panel` path to catch stray references.
- Run the local HA dev instance (see the `local-hass-control` / `local-hass-api` helpers); point at the
  branch:
  - Sidebar **panel** loads (served from the new compiled path).
  - Dashboard **card** renders; the Lovelace resource appears **automatically** under Settings →
    Dashboards → Resources with a `?v=` query.
  - Reload/restart does not create duplicate resources; a version bump updates the existing one.
  - Unloading the integration removes the resource.
- Strong cheap evidence without a browser: `curl` both `/dww_frontend/door-window-watcher-card.js` and
  `/dww_frontend/door-window-watcher-panel.js` for HTTP 200, and read `config/.storage/lovelace_resources`
  directly to confirm exactly one `/dww_frontend/door-window-watcher-card.js?v=<version>` entry, no dupes.

### Phase 12 — Merge & follow-up
- Owner tests thoroughly → merge `feat/merge-frontend` to `main`.
- Cut a release; confirm HACS installs the zip and both panel + card work from a
  clean install.
- **Archive `hass-door-window-watcher-card`** with a README pointer to this repo. Do not delete (preserves
  old issues / release history / external links).

## 6. Risks & notes
- **Card resource registration needs storage mode.** Acceptable — UI-mode-only is a confirmed constraint.
  The panel is independent of dashboard mode.
- **Existing card users must de-duplicate resources** (old manual/HACS resource + new auto one). Covered by
  the migration note; the auto-register code updates-in-place rather than blindly adding.
- **Two frontend bundles, two vite configs** — the panel's `@home-assistant/frontend` `external` config must
  survive the move, or the panel breaks. The card bundle has no externals (self-contained).
- **Submodule friction:** contributors must `git submodule update --init`; CI does it too. Only the card
  build depends on it — the panel build does not.
- **Version-drift fix:** with `zip_release`, the shipped `manifest.json` version and the card's `?v=` query
  stay in lockstep only because the zip is built *after* the manifest bump (Phase 8 ordering gotcha).

## 7. Quick rollback
- All work is on `feat/merge-frontend`; `main` is untouched until merge.
- If abandoned before merge: delete the branch and the `card` remote; `hass-door-window-watcher-card` is
  still intact and published.
