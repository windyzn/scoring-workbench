"""Regenerate the workbench association and marker files from the science team's association
file and the MYCO ID lists.

  src/data/associations.js  SYSTEMS and DISEASE_SYSTEMS, from data/data-associations/MYMet2.0_associations.csv
  src/data/markers.js       MYCO ID -> database name, and every known spelling -> MYCO ID

Usage: python3 scripts/build_associations.py [--check]

Biomarkers are matched by MYCO ID, not by name. Each association row's MYCO_ID column picks the
marker; the name shown in the workbench is the database name for that ID. Rows without a MYCO_ID
fall back to looking their name up in the spelling index, and rows that still don't resolve keep
their name as written (they're reported, and score only if a lab export uses that exact name).

Database names and spellings come from:
  1. data/data-associations/mysci_markers_myco_ids.csv   (pulled from the MYSCI database)
  2. data/data-associations/marker_synonyms.csv          (other spellings the science team uses for
                                                          a MYSCI marker; every ID must be in MYSCI)
  3. data/data-associations/lab_export_names.csv         (short names older lab exports use, e.g.
                                                          C0, ADMA, PC aa C36:2; these exports carry
                                                          no MYCO ID, so the workbench matches them
                                                          by name. Frozen from the MYCO 1.2 mapping.)
A spelling claimed by two IDs is ambiguous and left out. A synonym whose spelling already belongs
to a different MYSCI marker is ignored. Both are reported. Synonyms still marked "pending" are
listed on every run until science confirms them.

Cleanup applied to the association file (reported on stdout):
  - CR line endings, surrounding whitespace, "?" (lost non-breaking hyphen) -> "-"
  - case-only variants of a system / health area collapse to one spelling
  - exact duplicate rows dropped; conflicting directions are reported and fail the run
  - "Individual biomarker" rows are excluded (no downstream health area grouping)
"""
import csv, io, re, sys, collections, json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data/data-associations/MYMet2.0_associations.csv"
MYSCI_FILE = ROOT / "data/data-associations/mysci_markers_myco_ids.csv"
SYNONYMS_FILE = ROOT / "data/data-associations/marker_synonyms.csv"
LAB_NAMES_FILE = ROOT / "data/data-associations/lab_export_names.csv"
OUT = ROOT / "src/data/associations.js"
MARKERS_OUT = ROOT / "src/data/markers.js"

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
# Preferred spelling when case-variants disagree (otherwise the most common one wins).
PREFERRED = {"b-vitamin status": "B-Vitamin Status"}
SKIP_HEALTH_AREAS = {"individual biomarker"}


def clean(s):
    return re.sub(r"\s+", " ", s.replace("?", "-")).strip()


def spelling_key(n):
    """Case/punctuation-insensitive key; keeps % and # so "Basophils" != "Basophils%".
    Must match markerKey() in src/App.jsx."""
    return re.sub(r"[^a-z0-9%#]", "", n.lower())


def read_csv(path):
    with open(path, newline="", encoding="utf-8-sig") as fh:
        return list(csv.DictReader(fh))


def registry():
    """-> (names: id -> database name, spellings: key -> id, notes)"""
    names, spellings, notes = {}, {}, []
    by_key = collections.defaultdict(set)
    for r in read_csv(MYSCI_FILE):
        n, i = r["MARKER_NAME"].strip(), r["MYCO_ID"].strip()
        if n and i:
            names.setdefault(i, n)
            by_key[spelling_key(n)].add((n, i))
    for k, hits in sorted(by_key.items()):
        ids = {i for _, i in hits}
        if len(ids) > 1:
            label = " / ".join(sorted({n for n, _ in hits}))
            notes.append(f"MYSCI: {label!r} is used for {', '.join(sorted(ids))}; spelling left out")
        else:
            spellings[k] = ids.pop()
    extra = [(r["ALTERNATE_NAME"], r["MYCO_ID"], r["STATUS"], SYNONYMS_FILE) for r in read_csv(SYNONYMS_FILE)]
    extra += [(r["LAB_NAME"], r["MYCO_ID"], "confirmed", LAB_NAMES_FILE) for r in read_csv(LAB_NAMES_FILE)]
    for n, i, status, src in extra:
        n, i, status = n.strip(), i.strip(), status.strip().lower()
        if i not in names:
            raise SystemExit(f"{src.name}: {n!r} points at {i}, which isn't in {MYSCI_FILE.name}")
        k = spelling_key(n)
        if spellings.get(k, i) != i:
            notes.append(f"synonym {n!r} -> {i} ignored; that spelling is already {spellings[k]} in MYSCI")
            continue
        spellings[k] = i
        if status != "confirmed":
            notes.append(f"synonym pending science review: {n!r} -> {names[i]} ({i})")
    return names, spellings, notes


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
        r["LEVEL"] = r["LEVEL"].lower()
        r.setdefault("MYCO_ID", "")
    for col in ("SYSTEM_NAME", "HEALTH_AREA"):
        canon = canonical(r[col] for r in rows)
        for r in rows:
            r[col] = canon[r[col]]
    return rows


def resolve_ids(rows, names, spellings):
    """Set each row's BIOMARKER to the database name for its MYCO ID. Returns report lines."""
    renamed, unresolved, mismatched = {}, set(), set()
    for r in rows:
        written, mid = r["BIOMARKER"], r["MYCO_ID"]
        by_name = spellings.get(spelling_key(written))
        if mid and mid not in names:
            raise SystemExit(f"{written!r} has MYCO_ID {mid}, which isn't in the MYSCI list")
        if mid and by_name and by_name != mid:
            mismatched.add(f"{written!r}: MYCO_ID column says {mid}, name matches {by_name}; using {mid}")
        mid = mid or by_name
        if not mid:
            unresolved.add(written)
            continue
        r["MYCO_ID"], r["BIOMARKER"] = mid, names[mid]
        if names[mid] != written:
            renamed[written] = f"{names[mid]} ({mid})"
    lines = [f"name: {a} -> {b}" for a, b in sorted(renamed.items(), key=lambda kv: kv[0].lower())]
    lines += [f"WARN: {m}" for m in sorted(mismatched)]
    lines += [f"name: {n} (no MYCO ID; kept as written)" for n in sorted(unresolved, key=str.lower)]
    return lines


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
    return json.dumps(s, ensure_ascii=False)


def sort_ci(xs):
    return sorted(xs, key=lambda x: (x.lower(), x))


def render(health, disease):
    out = ["// GENERATED FILE: don't hand-edit. Source: data/data-associations/MYMet2.0_associations.csv",
           "// Regenerate with: python3 scripts/build_associations.py",
           "// Biomarker names are database names for each row's MYCO ID (see src/data/markers.js).",
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
    return sys_block + "\n\n" + "\n".join(out) + "\n"


def render_markers(names, spellings):
    out = ["// GENERATED FILE: don't hand-edit. Regenerate with: python3 scripts/build_associations.py",
           "// Sources: data/data-associations/mysci_markers_myco_ids.csv, marker_synonyms.csv, lab_export_names.csv",
           "",
           "// MYCO ID -> database measure name (MYSCI database spelling).",
           "export const MARKER_NAMES = {"]
    out += [f"    {js_str(i)}: {js_str(n)}," for i, n in sorted(names.items())]
    out += ["};", "",
            "// Spelling key (lowercase, only a-z 0-9 % #; see markerKey in App.jsx) -> MYCO ID.",
            "export const MARKER_IDS = {"]
    out += [f"    {js_str(k)}: {js_str(i)}," for k, i in sorted(spellings.items())]
    out.append("};")
    return "\n".join(out) + "\n"


def main():
    names, spellings, reg_notes = registry()
    for n in reg_notes:
        print("ids:", n)
    rows = load()
    for line in resolve_ids(rows, names, spellings):
        print(line)
    health, disease, notes, errors = build(rows)
    for n in notes:
        print("note:", n)
    if errors:
        for e in errors:
            print("ERROR:", e)
        sys.exit(1)
    outputs = {OUT: render(health, disease), MARKERS_OUT: render_markers(names, spellings)}
    bms = {b for s in health.values() for l in s.values() for b in l} | {b for d in disease.values() for p in d.values() for b in p}
    print(f"health systems: {len(health)}, health areas: {sum(len(s) for s in health.values())}, "
          f"diseases: {len(disease)}, biomarkers: {len(bms)}, marker ids: {len(names)}")
    if "--check" in sys.argv:
        sys.exit(0 if all(p.exists() and p.read_text() == c for p, c in outputs.items()) else 2)
    for p, c in outputs.items():
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(c)


if __name__ == "__main__":
    main()
