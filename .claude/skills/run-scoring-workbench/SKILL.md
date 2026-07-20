---
name: run-scoring-workbench
description: Build, run, and drive the scoring-workbench Vite/React SPA. Use when asked to start scoring-workbench, run its dev server, build it, take a screenshot of its UI, or interact with the running app (click a button, open a modal, verify a UI change actually renders).
---

Scoring-workbench is a single-file React 18 + Vite SPA (no backend, no
database — `src/App.jsx` is the whole app). It's served at the base
path `/scoring-workbench/`, not `/`. Drive it via the Playwright REPL
at `.claude/skills/run-scoring-workbench/driver.mjs`, wrapped in tmux.

All paths below are relative to `scoring_workbench/` (this repo's root).

## Prerequisites

- Node.js (verified with v22.22.2) + npm — no OS packages needed;
  Playwright's Chromium runs headless by default, so **no xvfb is
  required even on Linux**.
- `tmux`, for the interactive driver wrapping below. On this machine
  (macOS) that was `brew install tmux` (pulls in `ncurses`,
  `utf8proc`). On Linux it's `sudo apt-get install -y tmux` (not
  verified this session, but standard).

## Setup

```bash
npm install                                         # app deps (react, vite)
cd .claude/skills/run-scoring-workbench && npm install && cd ../../..
```

The driver's `playwright` dependency is installed in its own
`package.json` inside the skill directory — deliberately isolated from
the app's own `package.json` so the app itself never depends on a
browser-automation library. Playwright's Chromium binary is cached
globally at `~/Library/Caches/ms-playwright` (macOS) /
`~/.cache/ms-playwright` (Linux) the first time you run
`npx playwright install chromium`; if `driver.mjs` fails with a
"browser not found" error, run that once.

## Build

```bash
npm run build     # vite build → dist/
```

Not needed to run the driver — the driver talks to the **dev server**
(`npm run dev`), not a built bundle.

## Run (agent path)

1. Start the dev server in the background and wait for it to actually
   serve (don't fixed-`sleep`):

   ```bash
   npm run dev > /tmp/vite_dev.log 2>&1 &
   i=0; while ! curl -sf http://localhost:5173 >/dev/null; do sleep 1; i=$((i+1)); [ $i -ge 20 ] && break; done
   curl -sf http://localhost:5173 >/dev/null && echo "up" || cat /tmp/vite_dev.log
   ```

   Stop it later with: `lsof -ti:5173 -sTCP:LISTEN | xargs -r kill`
   (don't `pkill -f vite` — broad patterns can catch the agent's own
   process).

2. Launch the driver under tmux and drive it:

   ```bash
   tmux new-session -d -s app -x 200 -y 50
   tmux send-keys -t app 'SCREENSHOT_DIR=/tmp/shots node .claude/skills/run-scoring-workbench/driver.mjs' Enter
   i=0; while ! tmux capture-pane -t app -p | grep -q "driver>"; do sleep 0.3; i=$((i+1)); [ $i -ge 40 ] && break; done

   tmux send-keys -t app 'launch' Enter
   tmux send-keys -t app 'dismiss-tutorial' Enter    # first-run only, see Gotchas
   tmux send-keys -t app 'ss 01-landing' Enter
   tmux capture-pane -t app -p
   ```

   Then click/screenshot whatever the task needs, e.g.:

   ```bash
   tmux send-keys -t app 'click button[title^="What'"'"'s changed"]' Enter
   tmux send-keys -t app 'ss 02-modal' Enter
   tmux capture-pane -t app -p
   ```

   Screenshots land in `$SCREENSHOT_DIR` (default `/tmp/shots`).

   **No tmux available?** The driver is a plain stdin-reading REPL —
   pipe commands directly instead of wrapping in tmux:
   ```bash
   printf 'launch\ndismiss-tutorial\nss 01\nquit\n' | SCREENSHOT_DIR=/tmp/shots node .claude/skills/run-scoring-workbench/driver.mjs
   ```
   This loses live iteration (you can't react to one command's output
   before sending the next), but works fine for a fixed sequence.

### Driver commands

| command | what it does |
|---|---|
| `launch` | launch headless Chromium, navigate to `http://localhost:5173/scoring-workbench/` (override with `APP_URL`) |
| `dismiss-tutorial` | click "Skip" on the first-run onboarding overlay if present (no-op otherwise) |
| `ss [name]` | screenshot → `$SCREENSHOT_DIR/<name>.png` |
| `click <css-sel>` | click the first matching element (Playwright locator, not raw coordinates) |
| `click-text <text>` | click the first element containing that text |
| `type <text>` / `press <key>` | keyboard input |
| `wait <css-sel>` | wait up to 10s for an element |
| `eval <js>` | evaluate JS in the page, print JSON |
| `text [css-sel]` | print `innerText` of a selector (or `body`) |
| `quit` | close the browser, exit |

## Run (human path)

```bash
npm run dev    # → http://localhost:5173/scoring-workbench/ — Ctrl-C to stop
```

## Test

No test suite exists in this repo (`package.json` has no `test`
script) — verification is manual/visual via the driver above.

---

## Gotchas

- **Base path isn't `/`.** The dev server serves the app at
  `/scoring-workbench/` (set in `vite.config.js`'s `base`). Navigating
  to bare `http://localhost:5173/` loads nothing useful — always
  include the path.
- **First-run tutorial overlay covers the middle of the screen.** On a
  session with no demo data loaded, a "Step 1 of 15" onboarding modal
  sits center-screen — it does *not* block top-bar buttons (verified:
  clicking a top-bar button works fine with it still up), but it does
  visually overlap anything else you screenshot underneath it, and
  hasn't been tested against sidebar/main-panel clicks. Run
  `dismiss-tutorial` right after `launch` for a clean screenshot, or if
  clicking something outside the top bar doesn't seem to land.
- **This machine has no `chromium-cli`.** The generic web-app pattern
  (`/run` skill's `examples/playwright.md`) assumes it's installed;
  it isn't here. `driver.mjs` is a from-scratch Playwright REPL
  instead — same shape (`launch`/`click`/`ss`), different tool.
- **Playwright lives in its own `package.json`** inside this skill
  directory, not the app's. If you add driver commands that need new
  Playwright APIs, `npm install` inside
  `.claude/skills/run-scoring-workbench/`, not the repo root.
- **Piped input races unless commands are queued.** Piping all
  commands at once (the stdin-pipe fallback above) delivers every line
  to readline's `'line'` event back-to-back, and Node's `'close'`
  event (EOF) fires right after — *not* after each async command
  finishes. The driver serializes commands through a `queue` promise
  chain and makes `'close'` await it before exiting; if you edit
  `driver.mjs`, keep both, or the pipe form will silently exit after
  printing only the startup banner (this exact bug happened while
  building this skill — no error, just nothing ran).

## Troubleshooting

- **`tmux: command not found`**: not installed. `brew install tmux`
  (macOS, verified) or `apt-get install -y tmux` (Linux, standard) —
  or skip tmux entirely and use the stdin-pipe form above.
- **Driver hangs on `launch`**: usually means Chromium's binary isn't
  downloaded yet. Run `npx playwright install chromium` (from the
  skill directory, so it picks up the right `node_modules`) and retry.
- **Piped input prints only the startup banner, nothing else runs**:
  see the queue Gotcha above — `driver.mjs` already handles this
  correctly as shipped; this only recurs if the queue/close-await logic
  gets edited out.
