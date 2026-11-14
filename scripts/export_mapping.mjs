// Dump the association constants (src/data/associations.js + src/App.jsx) to JSON (same shape as the
// my-biomarker-scoring skill's references/mapping_data.json and the JSON block in
// molecular_you_scoring_prompt.md §12). Evaluates the literal source of each constant
// rather than parsing it by hand, so the output is exactly what the app scores with.
//
// Usage: node scripts/export_mapping.mjs > mapping_data.json
import { readFileSync } from "node:fs";

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

const strip = ({ id, name, processes, levels }) => (levels ? { id, name, processes, levels } : { id, name, processes });
const out = {
    association_version: evalConst("ASSOC_VERSION"),
    health_systems: evalConst("SYSTEMS").map(strip),
    disease_systems: evalConst("DISEASE_SYSTEMS").map(strip),
    cancer_systems: evalConst("CANCER_SYSTEMS").map(strip),
    cancer_tiers: evalConst("CANCER_HEALTH_SYSTEMS"),
    cancer_classifications: evalConst("CANCER_CLASSIFICATIONS").map(({ min, max, label }) => ({ min, max, label })),
    aliases: evalConst("ALIASES"),
};
process.stdout.write(JSON.stringify(out, null, 2) + "\n");
