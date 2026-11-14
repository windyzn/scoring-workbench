"""Regenerate SYSTEMS and DISEASE_SYSTEMS (src/data/associations.js) from the science team's
association file (data/data-associations/MYMet2.0_associations.csv).

Usage: python3 scripts/build_associations.py [--check]

Cleanup applied to the source file (reported on stdout):
  - CR line endings, surrounding whitespace, "?" (lost non-breaking hyphen) -> "-"
  - case-only variants of a system / health area / biomarker collapse to one spelling
  - "Trimethylamine-N-Oxide" merges into "Trimethylamine N-Oxide"
  - exact duplicate rows dropped; conflicting directions are reported and fail the run
  - "Individual biomarker" rows are excluded (no downstream health area grouping)

Biomarker names: the database spelling (MEASURE_NAME in our lab exports) wins. A science-team
name is matched to the database by DB_NAMES below, then by a case/punctuation-insensitive
comparison. Names with no database match are kept as written; they're new-panel biomarkers
that will start scoring once the lab reports them under that name.
"""
import csv, io, re, sys, collections
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data/data-associations/MYMet2.0_associations.csv"
DB_EXPORTS = [ROOT / "data/biomarker_full_export_20260827.csv", ROOT / "data/biomarker_explorer_full.csv"]
OUT = ROOT / "src/data/associations.js"

HEALTH_SYSTEM_IDS = {  # keep existing ids so saved weight profiles still line up
    "Blood Flow & Vessel Health": "bfvh", "Cell Defence & Detox": "cdd",
    "Digestion & Gut Health": "dgh", "Energy & Metabolism": "em",
    "Hormone & Brain Function": "hbf", "Immune System & Inflammation": "isi",
    "Tissue Repair & Healing": "trh",
}
DISEASES = {  # source name -> (id, display name)
    "Alzheimer's disease": ("alzheimers_disease", "Alzheimer's Disease"),
    "Cardiovascular disease": ("cardiovascular_disease", "Cardiovascular Disease"),
    "Depression": ("depression", "Depression"),
    "Inflammatory bowel disease": ("inflammatory_bowel_disease", "Inflammatory Bowel Disease"),
    "Kidney disease": ("kidney_disease", "Kidney Disease"),
    "Liver disease": ("liver_disease", "Liver Disease"),
    "Polyendocrine metabolic ovarian syndrome": ("polyendocrine_metabolic_ovarian_syndrome", "PMOS"),
    "Pulmonary disease": ("pulmonary_disease", "Pulmonary Disease"),
    "Rheumatoid arthritis": ("rheumatoid_arthritis", "Rheumatoid Arthritis"),
    "Type 2 diabetes": ("type_2_diabetes", "Type 2 Diabetes"),
}
BIOMARKER_MERGES = {"Trimethylamine-N-Oxide": "Trimethylamine N-Oxide"}
# Science-team name -> database measure name, where the two differ by more than case/punctuation.
DB_NAMES = {
    "3-(3-Hydroxyphenyl)-3-hydroxypropanoic acid": "HPHPA",
    "3-Hydroxybutyric acid": "beta-Hydroxybutyric acid",
    "3-Indoleacetic acid": "Indole acetic acid",
    "3-Nitrotyrosine": "Nitro-Tyrosine",
    "5-Hydroxyindoleacetic Acid": "5HIAA",
    "alpha-Aminobutyric acid": "Alpha-amino-N-butyric acid",
    "Asymmetric dimethylarginine": "ADMA",
    "Carnitine": "C0",
    "cis-4-Hydroxyproline": "cis-OH-Proline",
    "Guanidinoacetic Acid": "Guanidoacetic acid",
    "Hexadecanoylcarnitine": "C16",
    "Hydroxysphingomyelin C14:1": "SM (OH) C14:1",
    "L-Pipecolic Acid": "Pipecolic acid",
    "N-Acetyl-L-Alanine": "N-Acetylalanine",
    "N-Acetyl-L-Tyrosine": "N-Acetyltyrosine",
    "N1,N12-Diacetylspermine": "Diacetylspermine",
    "N2-Acetyl-Ornithine": "Acetyl-Ornithine",
    "N6-Acetyl-Glutamine": "N-Acetylglutamine",          # same molecule (Julia, 2026-11-13)
    "Octadecadienylcarnitine": "C18:2",
    "Octadecanoylcarnitine": "C18",
    "p-Hydroxyhippuric Acid": "Para-hydroxyhippuric acid",
    "Sphingomyelin C16:0": "SM C16:0",
    "Sphingomyelin C16:1": "SM C16:1",
    "Sphingomyelin C20:2": "SM C20:2",
    "Total dimethylarginine": "Asymmetric dimethylarginine + Symmetric dimethylarginine",  # (Julia, 2026-11-13)
    "trans-4-Hydroxyproline": "trans-OH-Proline",
    "Trimethylamine N-Oxide": "TMAO",
}
# Preferred spelling when case-variants disagree (otherwise the most common one wins).
PREFERRED = {"b-vitamin status": "B-Vitamin Status"}
SKIP_HEALTH_AREAS = {"individual biomarker"}


def clean(s):
    return re.sub(r"\s+", " ", s.replace("?", "-")).strip()


def canonical(values):
    """Map each case-variant to the most common spelling (ties -> first seen)."""
    groups = collections.defaultdict(collections.Counter)
    for v in values:
        groups[v.lower()][v] += 1
    out = {}
    for variants in groups.values():
        best = PREFERRED.get(next(iter(variants)).lower()) or variants.most_common(1)[0][0]
        for v in variants:
            out[v] = best
    return out


def load():
    raw = SRC.read_text(encoding="utf-8-sig").replace("\r\n", "\n").replace("\r", "\n")
    rows = [{k: clean(v or "") for k, v in r.items()} for r in csv.DictReader(io.StringIO(raw))]
    for r in rows:
        r["BIOMARKER"] = BIOMARKER_MERGES.get(r["BIOMARKER"], r["BIOMARKER"])
        r["LEVEL"] = r["LEVEL"].lower()
    for col in ("SYSTEM_NAME", "HEALTH_AREA", "BIOMARKER"):
        canon = canonical(r[col] for r in rows)
        for r in rows:
            r[col] = canon[r[col]]
    return rows


def norm(n):
    return re.sub(r"[^a-z0-9]", "", n.lower())


def db_names():
    names = set()
    for f in DB_EXPORTS:
        with open(f, newline="", encoding="utf-8-sig") as fh:
            for r in csv.DictReader(fh):
                names.add((r.get("MEASURE_NAME") or "").strip())
    names.discard("")
    return names


def to_db_names(rows):
    db = db_names()
    by_norm = {}
    for n in sorted(db):
        by_norm.setdefault(norm(n), n)
    mapped, new = {}, set()
    for r in rows:
        n = r["BIOMARKER"]
        target = DB_NAMES.get(n)
        if target is not None and target not in db:
            raise SystemExit(f"DB_NAMES maps {n!r} to {target!r}, which isn't in the database exports")
        hit = target or (n if n in db else by_norm.get(norm(n)))
        if hit:
            if hit != n:
                mapped[n] = hit
            r["BIOMARKER"] = hit
        else:
            new.add(n)
    return mapped, new


def build(rows):
    notes, errors = [], []
    seen = {}
    health = collections.defaultdict(lambda: collections.defaultdict(set))
    disease = collections.defaultdict(lambda: collections.defaultdict(dict))
    for r in rows:
        grp, sysn, ha, bm, lvl = r["GROUP"].lower(), r["SYSTEM_NAME"], r["HEALTH_AREA"], r["BIOMARKER"], r["LEVEL"]
        if ha.lower() in SKIP_HEALTH_AREAS:
            notes.append(f"skipped individual biomarker row: {grp} / {sysn or '-'} / {bm}")
            continue
        key = (grp, sysn, ha, bm)
        if key in seen:
            if seen[key] != lvl:
                errors.append(f"conflicting directions for {key}: {seen[key]} vs {lvl}")
            else:
                notes.append(f"dropped duplicate row: {' / '.join(key)}")
            continue
        seen[key] = lvl
        if grp == "health_system":
            if sysn not in HEALTH_SYSTEM_IDS:
                errors.append(f"unknown health system: {sysn!r} ({bm})")
                continue
            health[sysn][ha].add(bm)
        elif grp == "disease":
            if sysn not in DISEASES:
                errors.append(f"unknown disease: {sysn!r} ({bm})")
                continue
            if lvl not in ("high", "low", "both"):
                errors.append(f"bad direction {lvl!r}: {sysn} / {bm}")
                continue
            disease[sysn][ha][bm] = lvl
        else:
            errors.append(f"unknown group {grp!r}")
    return health, disease, notes, errors


def js_str(s):
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'


def sort_ci(xs):
    return sorted(xs, key=lambda x: (x.lower(), x))


def render(health, disease):
    out = ["// GENERATED FILE: don't hand-edit. Source: data/data-associations/MYMet2.0_associations.csv",
           "// Regenerate with: python3 scripts/build_associations.py",
           "",
           "// ─── Health Systems ──────────────────────────────────────────────────────────",
           "export const SYSTEMS = ["]
    for name, sid in HEALTH_SYSTEM_IDS.items():
        out.append("    {")
        out.append(f"        id: {js_str(sid)}, name: {js_str(name)}, processes: {{")
        for ha in sort_ci(health[name]):
            out.append(f"            {js_str(ha)}: [{', '.join(js_str(b) for b in sort_ci(health[name][ha]))}],")
        out.append("        }")
        out.append("    },")
    out.append("];")
    sys_block = "\n".join(out)

    out = ["// ─── Disease Health Systems ──────────────────────────────────────────────────",
           "// Each disease lists only the biomarkers the science team associated with it, grouped by",
           "// health area, with a per-biomarker direction (levels).",
           "export const DISEASE_SYSTEMS = ["]
    for src_name, (did, disp) in sorted(DISEASES.items(), key=lambda kv: kv[1][1].lower()):
        procs = disease[src_name]
        out.append("    {")
        out.append(f"        id: {js_str(did)}, name: {js_str(disp)}, processes: {{")
        for ha in sort_ci(procs):
            out.append(f"            {js_str(ha)}: [{', '.join(js_str(b) for b in sort_ci(procs[ha]))}],")
        out.append("        },")
        out.append("        levels: {")
        for ha in sort_ci(procs):
            for bm in sort_ci(procs[ha]):
                out.append(f"            {js_str(ha + '::' + bm)}: {js_str(procs[ha][bm])},")
        out.append("        },")
        out.append("    },")
    out.append("];")
    return sys_block, "\n".join(out)


def main():
    rows = load()
    mapped, new = to_db_names(rows)
    for a, b in sorted(mapped.items(), key=lambda kv: kv[0].lower()):
        print(f"name: {a} -> {b}")
    for n in sorted(new, key=str.lower):
        print(f"name: {n} (no database match; kept, likely new-panel)")
    health, disease, notes, errors = build(rows)
    for n in notes:
        print("note:", n)
    if errors:
        for e in errors:
            print("ERROR:", e)
        sys.exit(1)
    sys_block, dis_block = render(health, disease)
    content = sys_block + "\n\n" + dis_block + "\n"
    bms = {b for s in health.values() for l in s.values() for b in l} | {b for d in disease.values() for p in d.values() for b in p}
    print(f"health systems: {len(health)}, health areas: {sum(len(s) for s in health.values())}, "
          f"diseases: {len(disease)}, biomarkers: {len(bms)}")
    if "--check" in sys.argv:
        sys.exit(0 if OUT.exists() and OUT.read_text() == content else 2)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(content)


if __name__ == "__main__":
    main()
