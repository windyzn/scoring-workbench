// Dump the association constants (src/data/associations.js + src/App.jsx) to JSON (same shape as the
// my-biomarker-scoring skill's references/mapping_data.json and the JSON block in
// molecular_you_scoring_prompt.md §12). Evaluates the literal source of each constant
// rather than parsing it by hand, so the output is exactly what the app scores with.
//
// Usage: node scripts/export_mapping.mjs > mapping_data.json
import { readFileSync } from "node:fs";
import { MARKER_NAMES, MARKER_IDS } from "../src/data/markers.js";

const app = ["../src/data/associations.js", "../src/App.jsx"]
    .map(f => readFileSync(new URL(f, import.meta.url), "utf8")).join("\n");

function constSource(name) {
    const start = app.indexOf(`const ${name} = `);
    if (start < 0) throw new Error(`const ${name} not found in App.jsx`);
    let i = app.indexOf("=", start) + 1;
    while (/\s/.test(app[i])) i++;
    const open = app[i], close = open === "[" ? "]" : "}";
    let depth = 0, inStr = null;
    for (let j = i; j < app.length; j++) {
        const ch = app[j];
        if (inStr) { if (ch === "\\") j++; else if (ch === inStr) inStr = null; continue; }
        if (ch === '"' || ch === "'" || ch === "`") { inStr = ch; continue; }
        if (ch === open) depth++;
        else if (ch === close && --depth === 0) return app.slice(i, j + 1);
    }
    throw new Error(`unterminated const ${name}`);
}

const C = new Proxy({}, { get: (_, k) => String(k) }); // colour tokens aren't part of the mapping
const evalConst = name => Function("C", `return (${constSource(name)});`)(C);

// Same as markerKey / dbMarkerName in App.jsx: the app shows and scores every association under
// the database name for its MYCO ID (CANCER_SYSTEMS is written with older names in source).
const markerKey = n => (n ?? "").toLowerCase().replace(/[^a-z0-9%#]/g, "");
const dbName = n => MARKER_NAMES[MARKER_IDS[markerKey(n)]] ?? n;
const rekey = obj => Object.fromEntries(Object.entries(obj).map(([k, v]) => {
    const i = k.indexOf("::");
    return [i < 0 ? k : `${k.slice(0, i)}::${dbName(k.slice(i + 2))}`, v];
}));
const strip = ({ id, name, processes, levels }) => {
    const procs = Object.fromEntries(Object.entries(processes).map(([p, bms]) => [p, [...new Set(bms.map(dbName))]]));
    return levels ? { id, name, processes: procs, levels: rekey(levels) } : { id, name, processes: procs };
};
const systems = {
    health_systems: evalConst("SYSTEMS").map(strip),
    disease_systems: evalConst("DISEASE_SYSTEMS").map(strip),
    cancer_systems: evalConst("CANCER_SYSTEMS").map(strip),
};
// Other known spellings (case/punctuation-insensitive keys) of the markers used above -> the
// database name they're listed under. Only spellings that differ beyond case/punctuation.
const loose = n => n.toLowerCase().replace(/[^a-z0-9]/g, "");
const used = new Set(Object.values(systems).flat().flatMap(s => Object.values(s.processes).flat()));
const aliases = Object.fromEntries(Object.entries(MARKER_IDS)
    .filter(([k, id]) => used.has(MARKER_NAMES[id]) && loose(k) !== loose(MARKER_NAMES[id]))
    .map(([k, id]) => [k, MARKER_NAMES[id]]));
const out = {
    association_version: evalConst("ASSOC_VERSION"),
    ...systems,
    cancer_tiers: evalConst("CANCER_HEALTH_SYSTEMS"),
    cancer_classifications: evalConst("CANCER_CLASSIFICATIONS").map(({ min, max, label }) => ({ min, max, label })),
    aliases,
};
process.stdout.write(JSON.stringify(out, null, 2) + "\n");
