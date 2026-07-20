// REPL driver for the scoring-workbench Vite/React SPA.
// Designed for agents: wrap in tmux, send-keys commands, capture-pane output.
// Assumes the Vite dev server is already running (see SKILL.md) —
// this driver only owns the browser side.
import { chromium } from 'playwright';
import * as readline from 'node:readline';
import * as fs from 'node:fs';
import * as path from 'node:path';

const BASE_URL = process.env.APP_URL || 'http://localhost:5173/scoring-workbench/';
const SHOT_DIR = process.env.SCREENSHOT_DIR || '/tmp/shots';
fs.mkdirSync(SHOT_DIR, { recursive: true });

let browser = null;
let page = null;

const COMMANDS = {
    async launch() {
        if (browser) return console.log('already launched');
        browser = await chromium.launch();
        page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
        page.on('console', msg => { if (msg.type() === 'error') console.log('[console error]', msg.text()); });
        page.on('pageerror', err => console.log('[page error]', String(err)));
        await page.goto(BASE_URL, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);
        console.log('launched.', BASE_URL);
    },

    // On a fresh session with no demo data loaded, a first-run tutorial overlay
    // covers the app and intercepts clicks on anything underneath it. Dismiss it
    // before trying to interact with the top bar or sidebar.
    async 'dismiss-tutorial'() {
        if (!page) return console.log('ERROR: launch first');
        const skip = page.locator('text=Skip');
        if (await skip.count() > 0) { await skip.first().click(); await page.waitForTimeout(300); console.log('dismissed'); }
        else console.log('no tutorial overlay found');
    },

    async ss(name) {
        if (!page) return console.log('ERROR: launch first');
        const f = path.join(SHOT_DIR, (name || `ss-${Date.now()}`) + '.png');
        await page.screenshot({ path: f });
        console.log('screenshot:', f);
    },

    async click(sel) {
        if (!page) return console.log('ERROR: launch first');
        try { await page.locator(sel).first().click({ timeout: 5000 }); console.log('clicked:', sel); }
        catch (e) { console.log('ERROR:', e.message.split('\n')[0]); }
    },

    async 'click-text'(text) {
        if (!page) return console.log('ERROR: launch first');
        try { await page.getByText(text, { exact: false }).first().click({ timeout: 5000 }); console.log('clicked text:', text); }
        catch (e) { console.log('ERROR:', e.message.split('\n')[0]); }
    },

    async type(text) { if (page) await page.keyboard.type(text, { delay: 30 }); },
    async press(key) { if (page) await page.keyboard.press(key); },

    async wait(sel) {
        if (!page) return console.log('ERROR: launch first');
        try { await page.waitForSelector(sel, { timeout: 10_000 }); console.log('found:', sel); }
        catch { console.log('TIMEOUT:', sel); }
    },

    async eval(expr) {
        if (!page) return console.log('ERROR: launch first');
        try { console.log(JSON.stringify(await page.evaluate(expr))); }
        catch (e) { console.log('ERROR:', e.message.split('\n')[0]); }
    },

    async text(sel) {
        if (!page) return console.log('ERROR: launch first');
        console.log(await page.evaluate(
            s => (s ? document.querySelector(s) : document.body)?.innerText ?? '(null)',
            sel || null));
    },

    async quit() { if (browser) await browser.close().catch(() => {}); browser = null; page = null; },
    help() { console.log('commands:', Object.keys(COMMANDS).join(', ')); },
};

// Plain process.stdin is fine here (unlike the Electron REPL pattern this was
// adapted from, nothing else is competing for stdin) — works for both a tmux
// TTY and piped/non-interactive input.
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: 'driver> ' });

// Piped (non-interactive) input delivers all lines back-to-back — readline's
// 'line' event does NOT wait for a previous async handler to finish, so without
// this queue, `launch` and the command after it can race (e.g. `dismiss-tutorial`
// running before `launch`'s page exists). Chaining onto `queue` serializes them.
let queue = Promise.resolve();
rl.on('line', line => {
    queue = queue.then(async () => {
        const [cmd, ...rest] = line.trim().split(/\s+/);
        if (!cmd) return;
        const fn = COMMANDS[cmd];
        if (!fn) { console.log('unknown:', cmd, '— try: help'); return; }
        try { await fn(rest.join(' ')); } catch (e) { console.log('ERROR:', e.message); }
        if (cmd === 'quit') { rl.close(); process.exit(0); }
    }).then(() => rl.prompt());
});
// With piped (non-TTY) input, readline hits EOF and fires 'close' right after
// synchronously dispatching all 'line' events — NOT after they finish running.
// Without waiting on `queue` here, this would kill the process (and the
// in-flight browser launch/commands) before the queued work ever executes.
rl.on('close', async () => { await queue.catch(() => {}); await COMMANDS.quit(); process.exit(0); });

console.log('scoring-workbench driver — "help" for commands, "launch" to start');
rl.prompt();
