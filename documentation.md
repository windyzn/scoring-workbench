# Molecular You — Biomarker Scoring System
**Technical Specification · v1.4**

---

## Project Goal

Modify the calculation of Molecular You's current percentage-based health scores to fit the new system-level scores (implemented with the rollout of the PDF-first product).

This document describes how a raw biomarker measurement is turned into a score between 0 and 100, how those scores are rolled up into process scores, and how process scores are rolled up into the final health system scores.

---

## Important Links

- **Prototype:** https://windyzn.github.io/scoring-workbench/
- **Data for prototype:** https://drive.google.com/drive/folders/1gjlc_irj0skTBsm3zoVgEhvzQ2RlkpiX
- **Back-end data:** https://docs.google.com/spreadsheets/d/1_Cev13sOQZ7J_Hs5pzbmMJCtkgyOtz-6rQzBzf3Fhak/edit?gid=1155009125#gid=1155009125

---

## 1. Overview

The full scoring system has three levels:

```
Biomarker score  →  Process score  →  Health system score
```

- Each **biomarker** has a measured concentration and a reference range. The score (0–100) reflects how close the concentration is to the healthy part of that range.
- Each **process** groups a set of related biomarkers (previously called "pathways"). Its score is the weighted average of the biomarker scores in that group.
- Each **system** groups a set of related processes. Its score is the weighted average of the process scores in that group.

Weights at the biomarker and process levels can be customised. The sections below explain exactly how each step works.

The relationship between each step can be found here: https://docs.google.com/spreadsheets/d/1_Cev13sOQZ7J_Hs5pzbmMJCtkgyOtz-6rQzBzf3Fhak/edit?usp=sharing

---

## 2. Required Input Data

Each biomarker has three required fields in order to calculate all subsequent scores:

| Column | Description |
|--------|-------------|
| `concentration` | The measured lab concentration |
| `ref_low` | Lower bound of the reference range |
| `ref_high` | Upper bound of the reference range |

If a biomarker record is missing entirely (not present in the data), it is excluded from all calculations. It does not count as zero.

Certain concentration values are also excluded before scoring:

| Value | Meaning | Action |
|-------|---------|--------|
| `BLQ` | Below Limit of Quantification — concentration too low to measure reliably | Excluded |
| `NR` | Not Reported — result not reported by the lab | Excluded |
| `ND` | Not Detected — analyte not detected in the sample | Excluded |

These are treated identically to missing records — excluded from all weighted averages and not counted as zero.

---

## 3. Biomarker Colour Classification

Before scoring, each biomarker is assigned a colour and a direction.

### 3.1 Derived Boundaries

First, compute the range width:

```
range = ref_high - ref_low
```

Then compute four boundaries using the green margin parameter `green_pct` (default: `0.05`):

```
green_low  = ref_low  + green_pct × range
green_high = ref_high - green_pct × range

yellow_low  = ref_low  - green_pct × range
yellow_high = ref_high + green_pct × range
```

`green_pct` creates a small buffer inside the reference range that defines the "fully healthy" colour band, and a matching buffer outside that defines the "borderline" colour band.

### 3.2 Colour Assignment

```
if concentration >= green_low AND concentration <= green_high:
    colour = GREEN

else if concentration >= yellow_low AND concentration <= yellow_high:
    colour = YELLOW

else:
    colour = RED
```

### 3.3 Direction Assignment

```
if concentration > green_high:
    direction = HIGH

else if concentration < green_low:
    direction = LOW

else:
    direction = NORMAL
```

---

## 4. Biomarker Score

### 4.1 Green Zone — Score Is 100

If `colour = GREEN`, the biomarker scores `100`. No further calculation needed.

### 4.2 Out-of-Range — Distance-Based Decay

If the biomarker colour is yellow or red, calculate how far the concentration is outside the **green zone boundary**, expressed as a fraction of the **green range width**:

```
green_range = green_high - green_low

if direction = HIGH:
    distance = (concentration - green_high) / green_range

if direction = LOW:
    distance = (green_low - concentration) / green_range
```

> **Note:** Distance is measured from the green boundary (not the raw reference boundary) and normalised against the green range width. The green reference range is defined as 5% within the actual curated reference range on both ends. For example, a curated reference range of 0–100 would have a green reference range of 5–95, giving a `green_range` of 90.

Then normalise against the cutoff parameter (default: `0.5`). This is the distance at which the score reaches 0:

```
t = clamp(distance / cutoff, 0, 1)
```

`clamp(x, 0, 1)` means: if `x < 0` return `0`; if `x > 1` return `1`; otherwise return `x`.

### 4.3 Decay Curves

Apply one of two decay curves to `t` to get the score. The curve is controlled by the `curve` parameter (default: `"linear"`).

**Linear:**
```
score = 100 × (1 - t)
```

**Log2** (faster initial drop, gentler tail — score falls more quickly for mild deviations then flattens toward zero):
```
score = max(0, 100 × (1 - log2(1 + t)))
```

The decay curve will be decided by the science team. In all cases, clamp the final score to `[0, 100]`.

### 4.4 Pseudocode for Biomarker Scoring

```
function biomarker_score(concentration, ref_low, ref_high, green_pct, cutoff, curve):

    range = ref_high - ref_low
    if range <= 0:
        return NULL

    green_low   = ref_low  + green_pct × range
    green_high  = ref_high - green_pct × range
    green_range = green_high - green_low

    if concentration >= green_low AND concentration <= green_high:
        return 100

    if concentration > green_high:
        distance = (concentration - green_high) / green_range
    else:
        distance = (green_low - concentration) / green_range

    t = clamp(distance / cutoff, 0, 1)

    if curve = "linear":
        score = 100 × (1 - t)
    else if curve = "log2":
        score = max(0, 100 × (1 - log2(1 + t)))

    return clamp(score, 0, 100)
```

---

## 5. Effective Biomarker Weight

Each biomarker has an effective weight used when averaging into its process score. This weight comes from one of two sources:

- a manual biomarker weight set by the science team, if the biomarker is clinically important, or
- a global colour multiplier otherwise

### 5.1 Global Colour Multipliers

The scoring algorithm uses a weighted-risk model, where out-of-range biomarkers are assigned higher weights by default to ensure significant clinical deviations are immediately apparent. These apply by default to all biomarkers based on their colour:

| Biomarker colour | Multiplier parameter | Default value |
|-----------------|---------------------|---------------|
| green | always 1.0, not configurable | 1.0 |
| yellow | `yellow_weight` | 2.0 |
| red | `red_weight` | 4.0 |

The default values carry forward from the previous percentage-based scoring system, but should be flexible for any future adjustments.

### 5.2 Manual Biomarker Weight

The science team can assign a manual weight override to any biomarker that is more clinically relevant. The manual weight entry has three fields:

| Field | Allowed values | Description |
|-------|---------------|-------------|
| `bio_weight` | Integer 1–10 | The weight value itself |
| `bio_color` | `"red"`, `"yellow"`, `"both"` | Which biomarker colour must be active for this weight to apply |
| `bio_level` | `"high"`, `"low"`, `"both"` | Which direction must be active for this weight to apply |

The manual weight only replaces the global multiplier when both conditions are met:

```
color_match = (bio_color = "both")
           OR (bio_color = "red"    AND colour = RED)
           OR (bio_color = "yellow" AND colour = YELLOW)

level_match = (bio_level = "both")
           OR (bio_level = "high" AND direction = HIGH)
           OR (bio_level = "low"  AND direction = LOW)

if no explicit entry for this biomarker:
    effective_weight = colour multiplier   # yellow_weight, red_weight, or 1.0
else if color_match AND level_match:
    effective_weight = bio_weight          # replaces colour multiplier
else:
    effective_weight = colour multiplier   # conditions not met
```

> **Note:** The manual weight and the colour multiplier do not stack. The manual weight fully replaces the colour multiplier when its conditions are met; otherwise the colour multiplier is used as-is.

---

## 6. Process Score

A process score is the weighted average of its biomarker scores, using each biomarker's effective weight. Only biomarkers with data are included — missing biomarkers are skipped entirely (not treated as 0).

```
function process_score(biomarkers):

    total_weight = 0
    weighted_sum = 0

    for each biomarker in biomarkers:
        if biomarker is missing:
            skip

        score = biomarker_score(...)
        eff_w = effective_biomarker_weight(...)

        weighted_sum += score × eff_w
        total_weight += eff_w

    if total_weight = 0:
        return NULL    # no data for this process

    return weighted_sum / total_weight
```

A process with no data returns NULL and is excluded from the health system score.

---

## 7. Effective Process Weight

Each process has a weight that controls its influence on the overall system score. Like biomarker weights, the manual weight only applies when an explicit entry exists and the process score falls in the matching colour zone — otherwise the weight falls back to 1.

Unlike biomarker weights, process weights do not have a `level` condition.

| Field | Allowed values | Meaning |
|-------|---------------|---------|
| `proc_weight` | Integer 1–10 | The weight value itself |
| `proc_color` | `"red"`, `"yellow"`, `"both"` | Which zone the process score must be in for this weight to apply |

### 7.1 Process Zone Classification

Process scores are mapped to colour zones using thresholds set by the science team:

| Process score | Zone |
|---------------|------|
| ≥ 91 | GREEN |
| 70 – 90 | YELLOW |
| 0 – 69 | RED |

### 7.2 Applying the Condition

```
proc_zone = process_zone(process_score)

color_match = (proc_color = "both")
           OR (proc_color = "red"    AND proc_zone = RED)
           OR (proc_color = "yellow" AND proc_zone = YELLOW)
           OR (proc_color = "green"  AND proc_zone = GREEN)

if no explicit entry for this process:
    effective_process_weight = 1
else if color_match:
    effective_process_weight = proc_weight
else:
    effective_process_weight = 1    # colour condition not met
```

Same logic as biomarkers: the override only applies when an entry has been explicitly set. Absence of an entry always falls back to a weight of 1.

---

## 8. System Score

A system score is the weighted average of its process scores, using each process's weight. Only processes with a non-null score are included.

```
function system_score(processes):

    total_weight = 0
    weighted_sum = 0

    for each process in processes:
        if process score is NULL:
            skip

        eff_pw = effective_process_weight(process_score, proc_weight, proc_color)

        weighted_sum += process_score × eff_pw
        total_weight += eff_pw

    if total_weight = 0:
        return NULL

    return weighted_sum / total_weight
```

---

## 9. Default Parameter Values

These are the defaults used in the current implementation. They are all adjustable and should be saved in the database.

| Parameter | Default | Description | Example |
|-----------|---------|-------------|---------|
| `green_pct` | `0.05` | Size of the buffer for the "yellow" biomarkers as a fraction of the reference range | 5% means "yellow" straddles 5% on either side of the true reference range |
| `cutoff` | `0.5` | Distance from the green boundary (as a fraction of the green range width) at which the score reaches 0 | 50% means any concentration more than 50% of the green range width beyond the green boundary scores 0 |
| `curve` | `"linear"` | Decay curve shape: `"linear"` or `"log2"` | |
| `yellow_weight` | `2.0` | Multiplier applied to yellow biomarkers by default | |
| `red_weight` | `4.0` | Multiplier applied to red biomarkers by default | |
| `bio_weight` | `1` | The weight (importance) applied to a biomarker-process relationship. Can be any value 1–10. | |
| `bio_color` | `"red"` | The colour of the biomarker needed for the manual weight to apply | If `bio_color = "red"`, the `bio_weight` override only activates when biomarker colour is red |
| `bio_level` | `"high"` | The direction of the biomarker needed for the manual weight to apply | If `bio_level = "high"`, the `bio_weight` override only activates when biomarker direction is high |
| `proc_weight` | `1` | The weight (importance) applied to a process-system relationship. Can be any value 1–10. | |
| `proc_color` | `"red"` | The colour of the process needed for the manual weight to apply | If `proc_color = "red"`, the `proc_weight` override only activates when process colour is red |

---

## 10. Score Colour Cut-offs

After a process and/or system score is computed, it is assigned a colour zone — green, yellow, or red — based on where it falls relative to two thresholds. This colour is used to communicate health status at a glance.

All processes share a single set of cut-offs — the same boundaries apply uniformly across every process in every health system. Similarly, all systems share a single set of cut-offs.

Process and system cut-offs are independent of each other. A score of 75 may be yellow at the process level and green at the system level if the two sets of thresholds differ.

### 10.1 What the Cut-offs Mean

| Colour | Meaning |
|--------|---------|
| Green | Score is at or above the healthy threshold — the process or system is performing well |
| Yellow | Score is below the green threshold but above the concern threshold — borderline, warrants attention |
| Red | Score is below the concern threshold — the process or system should be prioritised for review |

### 10.2 Current Default Values

| Level | Green | Yellow | Red |
|-------|-------|--------|-----|
| Process | ≥ 91 | 70 – 90 | 0 – 69 |
| System | ≥ 91 | 70 – 90 | 0 – 69 |

> **Note for implementers:** These thresholds are based on the previous percentage scoring system and are expected to be refined as more client data is collected and reviewed by the science team. Do not hardcode these values — they should be configurable parameters in any downstream implementation.

---

## 11. Worked Example

This example walks through the full calculation for a single biomarker, up to its contribution to a system score.

### Setup

| Variable | Value |
|----------|-------|
| Biomarker | Homocysteine |
| `concentration` | 18.0 |
| `ref_low` | 5.0 |
| `ref_high` | 15.0 |
| `green_pct` | 0.05 (default) |
| `cutoff` | 0.5 (default) |
| `curve` | `"linear"` (default) |
| `yellow_weight` | 2.0 (default) |
| `red_weight` | 4.0 (default) |
| `bio_weight` | 5 (manually set by scientist) |
| `bio_color` | `"red"` |
| `bio_level` | `"high"` |

### Step 1 — Zone Classification

```
range      = 15.0 - 5.0 = 10.0

green_low  = 5.0  + 0.05 × 10.0 = 5.5
green_high = 15.0 - 0.05 × 10.0 = 14.5

yellow_low  = 5.0  - 0.05 × 10.0 = 4.5
yellow_high = 15.0 + 0.05 × 10.0 = 15.5
```

`concentration = 18.0`, which is above `yellow_high (15.5)`, so:

```
colour    = RED
direction = HIGH
```

### Step 2 — Biomarker Score

```
green_range = 14.5 - 5.5 = 9.0

distance = (18.0 - 14.5) / 9.0 = 3.5 / 9.0 ≈ 0.389

t = clamp(0.389 / 0.5, 0, 1) = clamp(0.778, 0, 1) = 0.778

score = 100 × (1 - 0.778) = 22.2
```

### Step 3 — Effective Biomarker Weight

```
color_match = (bio_color = "red" AND colour = RED)      → TRUE
level_match = (bio_level = "high" AND direction = HIGH) → TRUE

→ effective_weight = 5   (manual override applies)
```

If the conditions had not matched, or if no explicit entry existed, the effective weight would have been `red_weight = 4.0`.

### Step 4 — Process Score

Assume this process has two biomarkers:

| Biomarker | Score | Effective weight | Notes |
|-----------|-------|-----------------|-------|
| Homocysteine | 22.2 | 5 | manual override |
| Methylmalonic acid | 85.0 | 2.0 | yellow colour, no override |

```
weighted_sum  = (22.2 × 5) + (85.0 × 2) = 111.0 + 170.0 = 281.0
total_weight  = 5 + 2 = 7

process_score = 281.0 / 7 ≈ 40.1
```

Process score: **40.1** — RED zone (< 70).

### Step 5 — Effective Process Weight

Assume this process has a manual `proc_weight` of 3, with `proc_color = "red"`:

```
proc_zone = RED   # process_score = 40.1 < 70

color_match = (proc_color = "red" AND proc_zone = RED)  → TRUE

→ effective_process_weight = 3   (manual override applies)
```

### Step 6 — System Score

Assume the system has two processes:

| Process | Score | Effective process weight | Notes |
|---------|-------|------------------------|-------|
| Methylation | 40.1 | 3 | manual override, RED zone |
| Oxidative Stress | 72.0 | 1 | no explicit entry, falls back to 1 |

```
weighted_sum  = (40.1 × 3) + (72.0 × 1) = 120.3 + 72.0 = 192.3
total_weight  = 3 + 1 = 4

system_score  = 192.3 / 4 = 48.1
```

System score: **48.1** — RED zone (< 70).

---

## 12. Variable Hierarchy Depth

The scoring model is designed around a three-level hierarchy (biomarker → process → system), but this is not fixed. Different products may use different depths.

### 12.1 Two-Tier Products

Some products — for example, a cancer screening panel — may bypass the process level entirely and map biomarkers directly to a final score:

```
Biomarker score  →  Final score
```

In this case, the same weighted-average logic from section 6 (process score) applies at the final level, using biomarker scores directly.

### 12.2 Extending to More Tiers

The model should be expandable. Each additional tier is computed the same way as the previous one: a weighted average of the scores from the tier below. For example, a four-level hierarchy:

```
Biomarker score  →  Process score  →  System score  →  Domain score
```

Each tier uses the same logic: collect scores from the tier below, apply weights and zone multipliers, return a weighted average. Only the labels change.

---

## 13. Overall Score

An overall score can be derived by taking the simple average of all final-tier scores (system scores in a three-tier product, or direct scores in a two-tier product):

```
overall_score = mean(score_1, score_2, ..., score_n)
```

Where `score_i` are all non-NULL scores at the final tier. NULL scores are excluded from the average.

This is intentionally unweighted — each system contributes equally. If differential weighting across systems is needed in the future, the same `effective_process_weight` logic from section 7 can be applied at the system level.

> **Note for implementers:** The overall score is a summary statistic for reporting purposes and a potential future feature request. To keep implementation simple, it can hold the same structure as proposed in section 12, but keep all weights at 1 to calculate a simple average.

---

## 14. Edge Cases to Handle

| Situation | Behaviour |
|-----------|-----------|
| `ref_high = ref_low` (zero-width range) | Return score of NULL — cannot compute a meaningful distance; treated the same as a missing biomarker |
| Biomarker not present in data | Exclude from all scores — do not treat as 0 |
| Concentration value is BLQ, NR, or ND | Exclude from all scores — do not treat as 0 |
| All biomarkers in a process are missing | Process score is NULL |
| All processes in a system are NULL | System score is NULL |
| Manual `bio_weight = 1` with conditions matching | Effective weight = 1 — the explicit 1× overrides the colour multiplier |