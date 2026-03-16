import { useState, useCallback, useMemo, useRef, useEffect } from "react";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const C = {
  navy:"#18374B", navyMid:"#3B5464", steel:"#61859D", teal:"#8CCFCF",
  iceLight:"#D5E6EE", iceMid:"#B8CCD4", white:"#F6FCFF", surface:"#FFFFFF",
  border:"#D5E6EE", textPrimary:"#18374B", textSecond:"#3B5464",
  textMuted:"#61859D", textFaint:"#8CAABB",
  green:"#658385", good:"#61859D", fair:"#C4956A", atRisk:"#B07555", critical:"#B07070",
};
const T = { display:"'Georgia',serif", body:"'Trebuchet MS','Segoe UI',sans-serif", mono:"'Courier New',monospace" };

// ─── System / process / marker mapping ───────────────────────────────────────
const SYSTEMS = [
  { id:"bfvh", name:"Blood Flow & Vessel Health", processes:{
    "Blood Clotting Control":["Alpha-2-antiplasmin","Antithrombin-III","Beta-2-glycoprotein 1","Carboxypeptidase B2","Heparin cofactor 2","Histidine-rich glycoprotein","Kininogen-1"],
    "Blood Vessel Lining Health":["Asymmetric dimethylarginine","Cadherin-5","Kallistatin"],
    "Cell Membrane Lipids":["Hydroxysphingomyelin C14:1","Sphingomyelin C16:0","Sphingomyelin C20:2"],
    "Circulation Support":["Angiotensinogen","Phosphatidylinositol-glycan-specific phospholipase D","Plasma serine protease inhibitor","Tetranectin"],
    "Fat & Cholesterol Transport":["Apolipoprotein A-I","Apolipoprotein A-II","Apolipoprotein A-IV","Apolipoprotein B-100","Apolipoprotein C-I","Apolipoprotein C-II","Apolipoprotein C-III","Apolipoprotein C-IV","Apolipoprotein D","Apolipoprotein E","Apolipoprotein L1","Apolipoprotein M","Phospholipid transfer protein","Zinc-alpha-2-glycoprotein"],
    "Kidney Filtration":["Beta-2-microglobulin","Creatinine","Cystatin-C","Uric acid"],
    "Oxygen Transport":["Carbonic anhydrase 1","Hemoglobin subunit alpha 1"],
    "Vitamin & Mineral Transport":["Afamin","Retinol-binding protein 4","Serotransferrin","Serum albumin","Transthyretin","Vitamin D-binding protein"],
  }},
  { id:"cdd", name:"Cell Defence & Detox", processes:{
    "Blood Cleaning & Recycling":["Glutathione peroxidase 3","Haptoglobin","Hemopexin","Peroxiredoxin-2"],
    "Cell Protection & Detox":["Beta-Ala-His dipeptidase","Ceruloplasmin","Cholinesterase","Methionine-Sulfoxide","Nitro-Tyrosine","Serum paraoxonase/arylesterase 1"],
    "Dietary & Environmental Exposures":["Cotinine","Proline-Betaine"],
    "Enzyme Control":["Alpha-1-antichymotrypsin","Alpha-1-antitrypsin","Carboxypeptidase N catalytic chain","Carboxypeptidase N subunit 2","Inter-alpha-trypsin inhibitor heavy chain H1","Inter-alpha-trypsin inhibitor heavy chain H2","Inter-alpha-trypsin inhibitor heavy chain H4","Protein AMBP"],
  }},
  { id:"dgh", name:"Digestion & Gut Health", processes:{
    "Digestive Enzymes":["Biotinidase","Xaa-Pro dipeptidase"],
    "Gut Bacteria Activity":["Benzoic acid","Hippuric acid","Hydroxyphenylacetic acid","Indole acetic acid","Para-hydroxyhippuric acid","Trigonelline","Trimethylamine N-oxide"],
    "Gut Lining Health":["Citrulline"],
    "Short-Chain Fatty Acid Production":["Butyric acid","Isobutyric acid","Propionic acid"],
  }},
  { id:"em", name:"Energy & Metabolism", processes:{
    "Amino Acid Pool":["Acetyl-Ornithine","Alpha-amino-N-butyric acid","alpha-Aminoadipic acid","Arginine","Asparagine","Beta-alanine","Carnosine","cis-OH-Proline","Glutamine","Histidine","Lysine","Methylhistidine","Ornithine","Taurine","trans-OH-Proline"],
    "Amino Acids Used for Energy":["Creatine","Isoleucine","Leucine","Methionine","Phenylalanine","Proline","Serine","Threonine","Tyrosine","Valine"],
    "Blood Sugar Control":["Adipocyte plasma membrane-associated protein","Alanine","Aspartic acid","Glucose","Glutamic acid"],
    "Cell Growth and Renewal":["Diacetylspermine","Putrescine","Spermidine","Spermine"],
    "DNA & Gene Regulation":["Betaine","Choline","Glycine","Sarcosine"],
    "Fatty Acid Oxidation":["beta-Hydroxybutyric acid","Carnitine","Hexadecanoylcarnitine","Octadecadienylcarnitine","Octadecanoylcarnitine"],
    "Methylation & B-Vitamin Status":["Homocysteine","Methylmalonic acid"],
    "Mitochondrial Energy":["alpha-Ketoglutaric acid","Citric acid","Fumaric acid","Lactic acid","Pyruvic acid","Succinic acid"],
    "Tryptophan Processing":["Kynurenine","Tryptophan"],
  }},
  { id:"hbf", name:"Hormone & Brain Function", processes:{
    "Brain & Nerve Signals":["5-Hydroxyindole-3-acetic acid","DOPA","Gamma-aminobutyric acid","Histamine","Homovanillic acid","Phenylethylamine","Serotonin","Tyramine"],
    "Hormone Balance":["Corticosteroid-binding globulin","Insulin-like growth factor-binding protein 2","Insulin-like growth factor-binding protein 3","Insulin-like growth factor-binding protein complex acid labile subunit","Pregnancy zone protein","Sex hormone-binding globulin","Thyroxine-binding globulin"],
  }},
  { id:"isi", name:"Immune System & Inflammation", processes:{
    "Early Warning Response":["Alpha-1B-glycoprotein","Clusterin","Lipopolysaccharide-binding protein","Plasma protease C1 inhibitor"],
    "Germ Detection":["Ficolin-2","Ficolin-3","Lysozyme C","Mannan-binding lectin serine protease 2","Mannose-binding protein C"],
    "Immune Activation":["Complement C1q subcomponent subunit B","Complement C1r subcomponent","Complement C1r subcomponent-like protein","Complement C1s subcomponent","Complement C2","Complement C3","Complement C4-B","Complement C5","Complement component C6","Complement component C7","Complement component C8 alpha chain","Complement component C8 beta chain","Complement component C9","Complement factor B","Complement factor D","Probable G-protein coupled receptor 116"],
    "Immune Cell Movement":["Endothelial protein C receptor","Plastin-2"],
    "Immune Cell Recruitment":["Attractin","CD44 antigen","Galectin-3-binding protein","Intercellular adhesion molecule 1","L-selectin"],
    "Immune System Regulation":["C4b-binding protein alpha chain","CD5 antigen-like","Complement factor H","Complement factor I","Ig mu chain C region","IgGFc-binding protein","Leucine-rich alpha-2-glycoprotein 1","Protein S100-A9"],
    "Inflammation Response":["Alpha-1-acid glycoprotein 1","Alpha-2-macroglobulin","C-reactive protein","Serum amyloid A-1 protein","Serum amyloid A-4 protein","Serum amyloid P-component"],
  }},
  { id:"trh", name:"Tissue Repair & Healing", processes:{
    "Clotting & Wound Healing":["Coagulation factor IX","Coagulation factor V","Coagulation factor X","Coagulation factor XI","Coagulation factor XII","Coagulation factor XIII A chain","Coagulation factor XIII B chain","Fibrinogen alpha chain","Fibrinogen beta chain","Fibrinogen gamma chain","Plasminogen","Protein Z-dependent protease inhibitor","Prothrombin","Thrombospondin-1","Vitamin K-dependent protein S","Vitamin K-dependent protein Z","Vitronectin","von Willebrand Factor"],
    "Tissue & Joint Health":["Angiogenin","Cartilage acidic protein 1","Extracellular matrix protein 1","Fibronectin","Fibulin-1","Gelsolin","Lumican","Proteoglycan 4","Tenascin"],
    "Tissue Support Proteins":["Alpha-2-HS-glycoprotein","Fetuin-B","Pigment epithelium-derived factor","Vasorin"],
  }},
];

const ALL_MARKERS = SYSTEMS.flatMap(s => Object.values(s.processes).flat());
const ALIASES = {
  "Asymmetric dimethylarginine":"ADMA","Hydroxysphingomyelin C14:1":"SM (OH) C14:1",
  "Sphingomyelin C16:0":"SM C16:0","Sphingomyelin C20:2":"SM C20:2",
};

// All biomarker and process weights default to 1.0 — zone-based auto-weighting
// is handled dynamically at score time using yellowWeight / redWeight globals.
// Bio weight entry: { weight, color, level, ref }
// color: "red"|"yellow"|"both"  level: "high"|"low"|"both"
// ref: optional PubMed ID string
const DEFAULT_BIO_ENTRY  = { weight: 1, color: "red",  level: "high", ref: "" };
const DEFAULT_PROC_ENTRY = { weight: 1, color: "red",               ref: "" };

function makeDefaultBioWeights() {
  return {};
}
function makeDefaultProcWeights() {
  return {};
}

// ─── Demo client (all markers at green-zone midpoint) ────────────────────────
// ─── Demo personas ────────────────────────────────────────────────────────────
const DEMO_MARKERS_HEALTHY = {
  "5HIAA": { value: 0.0500, refLow: 0.0420, refHigh: 0.0580 },
  "ADMA": { value: 0.4650, refLow: 0.3000, refHigh: 0.6300 },
  "Acetyl-Ornithine": { value: 0.9600, refLow: 0.3200, refHigh: 1.6000 },
  "Adipocyte plasma membrane-associated protein": { value: 20.45, refLow: 8.9000, refHigh: 32.00 },
  "Afamin": { value: 504.20, refLow: 281.00, refHigh: 727.40 },
  "Alanine": { value: 390.55, refLow: 242.50, refHigh: 538.60 },
  "Alpha-1-acid glycoprotein 1": { value: 5241.0, refLow: 2592.7, refHigh: 7889.4 },
  "Alpha-1-antichymotrypsin": { value: 3177.2, refLow: 2065.3, refHigh: 4289.2 },
  "Alpha-1-antitrypsin": { value: 22714.3, refLow: 13435.6, refHigh: 31993.0 },
  "Alpha-1B-glycoprotein": { value: 1743.6, refLow: 925.10, refHigh: 2562.0 },
  "Alpha-2-HS-glycoprotein": { value: 4920.3, refLow: 3120.4, refHigh: 6720.2 },
  "Alpha-2-antiplasmin": { value: 1045.0, refLow: 772.80, refHigh: 1317.2 },
  "Alpha-2-macroglobulin": { value: 8169.8, refLow: 3953.4, refHigh: 12386.2 },
  "Alpha-amino-N-butyric acid": { value: 17.85, refLow: 8.6000, refHigh: 27.10 },
  "Angiogenin": { value: 6.2500, refLow: 2.5000, refHigh: 10.00 },
  "Angiotensinogen": { value: 1167.7, refLow: 494.60, refHigh: 1840.7 },
  "Antithrombin-III": { value: 86003.6, refLow: 70378.6, refHigh: 101628.5 },
  "Apolipoprotein A-I": { value: 47648.8, refLow: 28754.4, refHigh: 66543.1 },
  "Apolipoprotein A-II": { value: 10532.7, refLow: 5913.7, refHigh: 15151.7 },
  "Apolipoprotein A-IV": { value: 1610.8, refLow: 638.80, refHigh: 2582.9 },
  "Apolipoprotein B-100": { value: 326.75, refLow: 143.10, refHigh: 510.40 },
  "Apolipoprotein C-I": { value: 4288.1, refLow: 1408.1, refHigh: 7168.1 },
  "Apolipoprotein C-II": { value: 1940.0, refLow: 713.00, refHigh: 3167.0 },
  "Apolipoprotein C-III": { value: 7161.2, refLow: 2588.1, refHigh: 11734.3 },
  "Apolipoprotein C-IV": { value: 130.20, refLow: 26.70, refHigh: 233.70 },
  "Apolipoprotein D": { value: 2161.2, refLow: 1105.9, refHigh: 3216.5 },
  "Apolipoprotein E": { value: 880.10, refLow: 406.10, refHigh: 1354.1 },
  "Apolipoprotein L1": { value: 467.10, refLow: 222.60, refHigh: 711.60 },
  "Apolipoprotein M": { value: 420.45, refLow: 176.50, refHigh: 664.40 },
  "Arginine": { value: 78.45, refLow: 43.80, refHigh: 113.10 },
  "Asparagine": { value: 40.40, refLow: 26.60, refHigh: 54.20 },
  "Aspartic acid": { value: 12.95, refLow: 6.1000, refHigh: 19.80 },
  "Attractin": { value: 109.10, refLow: 72.80, refHigh: 145.40 },
  "Benzoic acid": { value: 0.2215, refLow: 0.0530, refHigh: 0.3900 },
  "Beta-2-glycoprotein 1": { value: 1732.9, refLow: 358.90, refHigh: 3106.9 },
  "Beta-2-microglobulin": { value: 138.65, refLow: 77.90, refHigh: 199.40 },
  "Beta-Ala-His dipeptidase": { value: 89.85, refLow: 42.80, refHigh: 136.90 },
  "Beta-alanine": { value: 11.15, refLow: 4.4000, refHigh: 17.90 },
  "Betaine": { value: 57.10, refLow: 19.30, refHigh: 94.90 },
  "Biotinidase": { value: 96.95, refLow: 56.60, refHigh: 137.30 },
  "Butyric acid": { value: 1.1250, refLow: 0.5500, refHigh: 1.7000 },
  "C-reactive protein": { value: 54.15, refLow: 0, refHigh: 108.30 },
  "C0": { value: 38.45, refLow: 22.20, refHigh: 54.70 },
  "C10": { value: 0.4700, refLow: 0.1600, refHigh: 0.7800 },
  "C10:1": { value: 0.2800, refLow: 0.1400, refHigh: 0.4200 },
  "C10:2": { value: 0.0635, refLow: 0.0410, refHigh: 0.0860 },
  "C12": { value: 0.1260, refLow: 0.0620, refHigh: 0.1900 },
  "C12-DC": { value: 0.0140, refLow: 0.00890, refHigh: 0.0190 },
  "C12:1": { value: 0.1800, refLow: 0.1000, refHigh: 0.2600 },
  "C14": { value: 0.0490, refLow: 0.0320, refHigh: 0.0660 },
  "C14:1": { value: 0.1350, refLow: 0.0600, refHigh: 0.2100 },
  "C14:1-OH": { value: 0.0235, refLow: 0.0160, refHigh: 0.0310 },
  "C14:2": { value: 0.0545, refLow: 0.0200, refHigh: 0.0890 },
  "C14:2-OH": { value: 0.0160, refLow: 0.0100, refHigh: 0.0220 },
  "C16": { value: 0.1190, refLow: 0.0680, refHigh: 0.1700 },
  "C16-OH": { value: 0.0136, refLow: 0.00920, refHigh: 0.0180 },
  "C16:1": { value: 0.0450, refLow: 0.0290, refHigh: 0.0610 },
  "C16:1-OH": { value: 0.0147, refLow: 0.00940, refHigh: 0.0200 },
  "C16:2": { value: 0.0164, refLow: 0.00980, refHigh: 0.0230 },
  "C16:2-OH": { value: 0.0126, refLow: 0.00810, refHigh: 0.0170 },
  "C18": { value: 0.0455, refLow: 0.0230, refHigh: 0.0680 },
  "C18:1": { value: 0.1340, refLow: 0.0780, refHigh: 0.1900 },
  "C18:1-OH": { value: 0.0131, refLow: 0.00830, refHigh: 0.0180 },
  "C18:2": { value: 0.0615, refLow: 0.0340, refHigh: 0.0890 },
  "C2": { value: 8.2500, refLow: 4.1000, refHigh: 12.40 },
  "C3": { value: 0.3650, refLow: 0.1800, refHigh: 0.5500 },
  "C3-DC (C4-OH)": { value: 0.0540, refLow: 0.0290, refHigh: 0.0790 },
  "C3-OH": { value: 0.0385, refLow: 0.0250, refHigh: 0.0520 },
  "C3:1": { value: 0.0710, refLow: 0.0450, refHigh: 0.0970 },
  "C4": { value: 0.2250, refLow: 0.1100, refHigh: 0.3400 },
  "C4:1": { value: 0.0290, refLow: 0.0150, refHigh: 0.0430 },
  "C4b-binding protein alpha chain": { value: 3301.4, refLow: 1606.7, refHigh: 4996.2 },
  "C5": { value: 0.1325, refLow: 0.0650, refHigh: 0.2000 },
  "C5-M-DC": { value: 0.0350, refLow: 0.0230, refHigh: 0.0470 },
  "C5-OH (C3-DC-M)": { value: 0.0380, refLow: 0.0240, refHigh: 0.0520 },
  "C5:1": { value: 0.0565, refLow: 0.0430, refHigh: 0.0700 },
  "C5:1-DC": { value: 0.0220, refLow: 0.0130, refHigh: 0.0310 },
  "C6 (C4:1-DC)": { value: 0.0820, refLow: 0.0440, refHigh: 0.1200 },
  "C6:1": { value: 0.3165, refLow: 0.0430, refHigh: 0.5900 },
  "C7-DC": { value: 0.0740, refLow: 0.0380, refHigh: 0.1100 },
  "C8": { value: 0.2950, refLow: 0.1700, refHigh: 0.4200 },
  "C9": { value: 0.0565, refLow: 0.0250, refHigh: 0.0880 },
  "CD44 antigen": { value: 50.40, refLow: 22.70, refHigh: 78.10 },
  "CD5 antigen-like": { value: 660.85, refLow: 227.20, refHigh: 1094.5 },
  "Cadherin-5": { value: 36.30, refLow: 18.40, refHigh: 54.20 },
  "Carbonic anhydrase 1": { value: 87.45, refLow: 20.70, refHigh: 154.20 },
  "Carboxypeptidase B2": { value: 95.55, refLow: 60.50, refHigh: 130.60 },
  "Carboxypeptidase N catalytic chain": { value: 99.50, refLow: 57.40, refHigh: 141.60 },
  "Carboxypeptidase N subunit 2": { value: 200.35, refLow: 53.60, refHigh: 347.10 },
  "Carnosine": { value: 0.0475, refLow: 0, refHigh: 0.0950 },
  "Cartilage acidic protein 1": { value: 22.00, refLow: 8.2000, refHigh: 35.80 },
  "Ceruloplasmin": { value: 2030.7, refLow: 1058.6, refHigh: 3002.8 },
  "Choline": { value: 11.65, refLow: 6.0000, refHigh: 17.30 },
  "Cholinesterase": { value: 10.80, refLow: 5.7000, refHigh: 15.90 },
  "Citric acid": { value: 107.40, refLow: 62.10, refHigh: 152.70 },
  "Citrulline": { value: 30.95, refLow: 19.40, refHigh: 42.50 },
  "Clusterin": { value: 529.90, refLow: 111.70, refHigh: 948.10 },
  "Coagulation factor IX": { value: 45.10, refLow: 27.00, refHigh: 63.20 },
  "Coagulation factor V": { value: 59.90, refLow: 37.70, refHigh: 82.10 },
  "Coagulation factor X": { value: 141.65, refLow: 89.70, refHigh: 193.60 },
  "Coagulation factor XI": { value: 52.00, refLow: 33.30, refHigh: 70.70 },
  "Coagulation factor XII": { value: 356.65, refLow: 126.00, refHigh: 587.30 },
  "Coagulation factor XIII A chain": { value: 111.10, refLow: 55.30, refHigh: 166.90 },
  "Coagulation factor XIII B chain": { value: 129.75, refLow: 75.30, refHigh: 184.20 },
  "Complement C1q subcomponent subunit B": { value: 316.20, refLow: 202.10, refHigh: 430.30 },
  "Complement C1r subcomponent": { value: 372.70, refLow: 261.80, refHigh: 483.60 },
  "Complement C1r subcomponent-like protein": { value: 59.80, refLow: 39.10, refHigh: 80.50 },
  "Complement C1s subcomponent": { value: 254.65, refLow: 177.30, refHigh: 332.00 },
  "Complement C2": { value: 114.35, refLow: 65.40, refHigh: 163.30 },
  "Complement C3": { value: 4274.5, refLow: 2484.3, refHigh: 6064.7 },
  "Complement C4-B": { value: 1408.5, refLow: 608.50, refHigh: 2208.6 },
  "Complement C5": { value: 192.85, refLow: 124.00, refHigh: 261.70 },
  "Complement component C6": { value: 227.35, refLow: 112.40, refHigh: 342.30 },
  "Complement component C7": { value: 169.85, refLow: 91.20, refHigh: 248.50 },
  "Complement component C8 alpha chain": { value: 166.15, refLow: 96.10, refHigh: 236.20 },
  "Complement component C8 beta chain": { value: 194.60, refLow: 121.10, refHigh: 268.10 },
  "Complement component C9": { value: 274.20, refLow: 123.20, refHigh: 425.20 },
  "Complement factor B": { value: 1345.2, refLow: 772.70, refHigh: 1917.7 },
  "Complement factor D": { value: 59.75, refLow: 32.30, refHigh: 87.20 },
  "Complement factor H": { value: 1182.7, refLow: 695.70, refHigh: 1669.7 },
  "Complement factor I": { value: 372.40, refLow: 220.30, refHigh: 524.50 },
  "Corticosteroid-binding globulin": { value: 661.45, refLow: 365.40, refHigh: 957.50 },
  "Cotinine": { value: 0.00800, refLow: 0, refHigh: 0.0160 },
  "Creatine": { value: 23.65, refLow: 8.8000, refHigh: 38.50 },
  "Creatinine": { value: 86.25, refLow: 50.50, refHigh: 122.00 },
  "Cystatin-C": { value: 40.95, refLow: 23.40, refHigh: 58.50 },
  "DOPA": { value: 0.00485, refLow: 0.00180, refHigh: 0.00790 },
  "Diacetylspermine": { value: 0.0480, refLow: 0.0460, refHigh: 0.0500 },
  "Endothelial protein C receptor": { value: 9.1500, refLow: 8.8000, refHigh: 9.5000 },
  "Extracellular matrix protein 1": { value: 69.30, refLow: 39.10, refHigh: 99.50 },
  "Fetuin-B": { value: 72.65, refLow: 31.80, refHigh: 113.50 },
  "Fibrinogen alpha chain": { value: 18419.1, refLow: 10298.2, refHigh: 26539.9 },
  "Fibrinogen beta chain": { value: 13744.2, refLow: 7806.5, refHigh: 19682.0 },
  "Fibrinogen gamma chain": { value: 15671.1, refLow: 8532.7, refHigh: 22809.4 },
  "Fibronectin": { value: 1427.6, refLow: 339.90, refHigh: 2515.3 },
  "Fibulin-1": { value: 195.45, refLow: 107.50, refHigh: 283.40 },
  "Ficolin-2": { value: 58.30, refLow: 24.90, refHigh: 91.70 },
  "Ficolin-3": { value: 229.55, refLow: 119.10, refHigh: 340.00 },
  "Fumaric acid": { value: 1.2150, refLow: 0.5300, refHigh: 1.9000 },
  "Galectin-3-binding protein": { value: 53.20, refLow: 32.20, refHigh: 74.20 },
  "Gamma-aminobutyric acid": { value: 0.2060, refLow: 0.0820, refHigh: 0.3300 },
  "Gelsolin": { value: 406.55, refLow: 268.40, refHigh: 544.70 },
  "Glucose": { value: 4798.6, refLow: 3824.3, refHigh: 5772.8 },
  "Glutamic acid": { value: 62.35, refLow: 29.60, refHigh: 95.10 },
  "Glutamine": { value: 539.85, refLow: 391.20, refHigh: 688.50 },
  "Glutathione peroxidase 3": { value: 129.60, refLow: 77.10, refHigh: 182.10 },
  "Glycine": { value: 260.15, refLow: 158.50, refHigh: 361.80 },
  "Haptoglobin": { value: 25646.5, refLow: 5184.6, refHigh: 46108.3 },
  "Hemoglobin subunit alpha 1": { value: 1521.0, refLow: 269.90, refHigh: 2772.1 },
  "Hemopexin": { value: 6721.2, refLow: 1698.1, refHigh: 11744.4 },
  "Heparin cofactor 2": { value: 755.55, refLow: 409.50, refHigh: 1101.6 },
  "Hippuric acid": { value: 7.9500, refLow: 1.4000, refHigh: 14.50 },
  "Histamine": { value: 0.00475, refLow: 0, refHigh: 0.00950 },
  "Histidine": { value: 80.05, refLow: 55.60, refHigh: 104.50 },
  "Histidine-rich glycoprotein": { value: 1956.1, refLow: 773.30, refHigh: 3138.9 },
  "Homocysteine": { value: 9.7000, refLow: 6.3000, refHigh: 13.10 },
  "Homovanillic acid": { value: 0.0605, refLow: 0.0290, refHigh: 0.0920 },
  "Hydroxyphenylacetic acid": { value: 0.2005, refLow: 0.0810, refHigh: 0.3200 },
  "Ig mu chain C region": { value: 10223.5, refLow: 2887.8, refHigh: 17559.2 },
  "IgGFc-binding protein": { value: 13.15, refLow: 3.1000, refHigh: 23.20 },
  "Indole acetic acid": { value: 1.7500, refLow: 1.0000, refHigh: 2.5000 },
  "Insulin-like growth factor-binding protein 2": { value: 6.5500, refLow: 1.9000, refHigh: 11.20 },
  "Insulin-like growth factor-binding protein 3": { value: 30.10, refLow: 17.30, refHigh: 42.90 },
  "Insulin-like growth factor-binding protein complex acid labile subunit": { value: 133.35, refLow: 72.00, refHigh: 194.70 },
  "Inter-alpha-trypsin inhibitor heavy chain H1": { value: 3150.6, refLow: 1035.5, refHigh: 5265.8 },
  "Inter-alpha-trypsin inhibitor heavy chain H2": { value: 1375.1, refLow: 945.30, refHigh: 1804.9 },
  "Inter-alpha-trypsin inhibitor heavy chain H4": { value: 1549.6, refLow: 918.70, refHigh: 2180.4 },
  "Intercellular adhesion molecule 1": { value: 6.7500, refLow: 4.2000, refHigh: 9.3000 },
  "Isobutyric acid": { value: 1.2850, refLow: 0.6700, refHigh: 1.9000 },
  "Isoleucine": { value: 62.20, refLow: 39.90, refHigh: 84.50 },
  "Kallistatin": { value: 95.65, refLow: 54.00, refHigh: 137.30 },
  "Kininogen-1": { value: 1869.4, refLow: 1265.6, refHigh: 2473.3 },
  "Kynurenine": { value: 2.5000, refLow: 1.6000, refHigh: 3.4000 },
  "L-selectin": { value: 46.00, refLow: 24.30, refHigh: 67.70 },
  "Lactic acid": { value: 1484.2, refLow: 692.00, refHigh: 2276.4 },
  "Leucine": { value: 126.70, refLow: 80.30, refHigh: 173.10 },
  "Leucine-rich alpha-2-glycoprotein 1": { value: 438.85, refLow: 198.50, refHigh: 679.20 },
  "Lipopolysaccharide-binding protein": { value: 59.80, refLow: 24.60, refHigh: 95.00 },
  "Lumican": { value: 319.50, refLow: 189.40, refHigh: 449.60 },
  "Lysine": { value: 183.65, refLow: 116.60, refHigh: 250.70 },
  "Lysozyme C": { value: 78.45, refLow: 43.30, refHigh: 113.60 },
  "Mannan-binding lectin serine protease 2": { value: 35.70, refLow: 26.20, refHigh: 45.20 },
  "Mannose-binding protein C": { value: 58.55, refLow: 26.60, refHigh: 90.50 },
  "Methionine": { value: 24.05, refLow: 16.30, refHigh: 31.80 },
  "Methionine-Sulfoxide": { value: 0.7450, refLow: 0.3900, refHigh: 1.1000 },
  "Methylhistidine": { value: 37.20, refLow: 6.0000, refHigh: 68.40 },
  "Methylmalonic acid": { value: 0.0940, refLow: 0.0380, refHigh: 0.1500 },
  "Nitro-Tyrosine": { value: 0.0218, refLow: 0.00670, refHigh: 0.0370 },
  "Ornithine": { value: 72.90, refLow: 46.60, refHigh: 99.20 },
  "PC aa C32:2": { value: 3.5000, refLow: 1.8000, refHigh: 5.2000 },
  "PC aa C36:0": { value: 8.0000, refLow: 4.5000, refHigh: 11.50 },
  "PC aa C36:6": { value: 1.4850, refLow: 0.5700, refHigh: 2.4000 },
  "PC aa C38:0": { value: 4.7500, refLow: 2.3000, refHigh: 7.2000 },
  "PC aa C38:6": { value: 99.05, refLow: 46.50, refHigh: 151.60 },
  "PC aa C40:1": { value: 0.7050, refLow: 0.4400, refHigh: 0.9700 },
  "PC aa C40:2": { value: 0.6150, refLow: 0.3300, refHigh: 0.9000 },
  "PC aa C40:6": { value: 27.35, refLow: 13.20, refHigh: 41.50 },
  "PC ae C36:0": { value: 1.3800, refLow: 0.6600, refHigh: 2.1000 },
  "PC ae C40:6": { value: 5.5500, refLow: 2.8000, refHigh: 8.3000 },
  "Para-hydroxyhippuric acid": { value: 0.0810, refLow: 0.0220, refHigh: 0.1400 },
  "Peroxiredoxin-2": { value: 32.75, refLow: 8.9000, refHigh: 56.60 },
  "Phenylalanine": { value: 59.75, refLow: 44.20, refHigh: 75.30 },
  "Phenylethylamine": { value: 0.000245, refLow: 0, refHigh: 0.000490 },
  "Phosphatidylinositol-glycan-specific phospholipase D": { value: 75.00, refLow: 36.90, refHigh: 113.10 },
  "Phospholipid transfer protein": { value: 49.45, refLow: 29.20, refHigh: 69.70 },
  "Pigment epithelium-derived factor": { value: 236.40, refLow: 145.10, refHigh: 327.70 },
  "Plasma protease C1 inhibitor": { value: 1562.6, refLow: 1023.8, refHigh: 2101.3 },
  "Plasma serine protease inhibitor": { value: 121.75, refLow: 66.80, refHigh: 176.70 },
  "Plasminogen": { value: 476.80, refLow: 297.30, refHigh: 656.30 },
  "Plastin-2": { value: 34.30, refLow: 21.20, refHigh: 47.40 },
  "Pregnancy zone protein": { value: 398.10, refLow: 41.70, refHigh: 754.50 },
  "Probable G-protein coupled receptor 116": { value: 2.5000, refLow: 1.2000, refHigh: 3.8000 },
  "Proline": { value: 200.55, refLow: 109.20, refHigh: 291.90 },
  "Proline-Betaine": { value: 10.45, refLow: 1.1000, refHigh: 19.80 },
  "Propionic acid": { value: 1.2050, refLow: 0.7100, refHigh: 1.7000 },
  "Protein AMBP": { value: 830.80, refLow: 338.10, refHigh: 1323.5 },
  "Protein S100-A9": { value: 21.70, refLow: 6.8000, refHigh: 36.60 },
  "Protein Z-dependent protease inhibitor": { value: 35.75, refLow: 21.80, refHigh: 49.70 },
  "Proteoglycan 4": { value: 55.45, refLow: 16.90, refHigh: 94.00 },
  "Prothrombin": { value: 1151.0, refLow: 761.10, refHigh: 1540.8 },
  "Putrescine": { value: 0.2250, refLow: 0.1200, refHigh: 0.3300 },
  "Pyruvic acid": { value: 77.85, refLow: 38.90, refHigh: 116.80 },
  "Retinol-binding protein 4": { value: 1656.2, refLow: 866.50, refHigh: 2446.0 },
  "SM (OH) C14:1": { value: 6.9500, refLow: 3.5000, refHigh: 10.40 },
  "SM (OH) C16:1": { value: 4.7500, refLow: 2.5000, refHigh: 7.0000 },
  "SM (OH) C22:1": { value: 12.65, refLow: 7.5000, refHigh: 17.80 },
  "SM (OH) C22:2": { value: 10.45, refLow: 5.8000, refHigh: 15.10 },
  "SM (OH) C24:1": { value: 1.7500, refLow: 1.0000, refHigh: 2.5000 },
  "SM C16:0": { value: 124.65, refLow: 78.30, refHigh: 171.00 },
  "SM C16:1": { value: 17.95, refLow: 10.10, refHigh: 25.80 },
  "SM C18:0": { value: 26.30, refLow: 15.20, refHigh: 37.40 },
  "SM C18:1": { value: 12.20, refLow: 6.4000, refHigh: 18.00 },
  "SM C20:2": { value: 0.5300, refLow: 0.2600, refHigh: 0.8000 },
  "Sarcosine": { value: 11.75, refLow: 2.4000, refHigh: 21.10 },
  "Serine": { value: 115.30, refLow: 81.70, refHigh: 148.90 },
  "Serotonin": { value: 0.7000, refLow: 0.2000, refHigh: 1.2000 },
  "Serotransferrin": { value: 17958.3, refLow: 11558.2, refHigh: 24358.4 },
  "Serum albumin": { value: 481921.8, refLow: 342711.6, refHigh: 621132.0 },
  "Serum amyloid A-1 protein": { value: 60.45, refLow: 34.60, refHigh: 86.30 },
  "Serum amyloid A-4 protein": { value: 1346.2, refLow: 593.80, refHigh: 2098.6 },
  "Serum amyloid P-component": { value: 588.60, refLow: 241.00, refHigh: 936.20 },
  "Serum paraoxonase/arylesterase 1": { value: 884.05, refLow: 416.50, refHigh: 1351.6 },
  "Sex hormone-binding globulin": { value: 95.20, refLow: 20.40, refHigh: 170.00 },
  "Spermidine": { value: 0.2100, refLow: 0.1200, refHigh: 0.3000 },
  "Spermine": { value: 0.1850, refLow: 0.1500, refHigh: 0.2200 },
  "Succinic acid": { value: 4.0000, refLow: 2.3000, refHigh: 5.7000 },
  "TMAO": { value: 8.6000, refLow: 1.1000, refHigh: 16.10 },
  "Taurine": { value: 65.90, refLow: 33.10, refHigh: 98.70 },
  "Tenascin": { value: 4.0000, refLow: 2.4000, refHigh: 5.6000 },
  "Tetranectin": { value: 213.45, refLow: 129.20, refHigh: 297.70 },
  "Threonine": { value: 140.10, refLow: 87.40, refHigh: 192.80 },
  "Thrombospondin-1": { value: 54.10, refLow: 7.4000, refHigh: 100.80 },
  "Thyroxine-binding globulin": { value: 282.75, refLow: 158.20, refHigh: 407.30 },
  "Transthyretin": { value: 538.50, refLow: 197.70, refHigh: 879.30 },
  "Trigonelline": { value: 0.8900, refLow: 0.1800, refHigh: 1.6000 },
  "Tryptophan": { value: 61.75, refLow: 42.30, refHigh: 81.20 },
  "Tyramine": { value: 0.00475, refLow: 0, refHigh: 0.00950 },
  "Tyrosine": { value: 63.65, refLow: 38.90, refHigh: 88.40 },
  "Uric acid": { value: 337.50, refLow: 199.30, refHigh: 475.70 },
  "Valine": { value: 240.45, refLow: 162.40, refHigh: 318.50 },
  "Vasorin": { value: 12.25, refLow: 7.3000, refHigh: 17.20 },
  "Vitamin D-binding protein": { value: 2535.9, refLow: 1704.2, refHigh: 3367.7 },
  "Vitamin K-dependent protein S": { value: 292.30, refLow: 173.40, refHigh: 411.20 },
  "Vitamin K-dependent protein Z": { value: 75.80, refLow: 21.90, refHigh: 129.70 },
  "Vitronectin": { value: 3312.1, refLow: 1909.6, refHigh: 4714.5 },
  "Xaa-Pro dipeptidase": { value: 7.0000, refLow: 3.1000, refHigh: 10.90 },
  "Zinc-alpha-2-glycoprotein": { value: 323.25, refLow: 64.00, refHigh: 582.50 },
  "alpha-Aminoadipic acid": { value: 1.2150, refLow: 0.2300, refHigh: 2.2000 },
  "alpha-Ketoglutaric acid": { value: 9.6000, refLow: 6.8000, refHigh: 12.40 },
  "beta-Hydroxybutyric acid": { value: 136.80, refLow: 22.80, refHigh: 250.80 },
  "lysoPC a C14:0": { value: 4.9500, refLow: 2.1000, refHigh: 7.8000 },
  "lysoPC a C16:0": { value: 79.45, refLow: 50.60, refHigh: 108.30 },
  "lysoPC a C16:1": { value: 2.3500, refLow: 1.1000, refHigh: 3.6000 },
  "lysoPC a C17:0": { value: 1.7100, refLow: 0.9200, refHigh: 2.5000 },
  "lysoPC a C18:0": { value: 27.95, refLow: 15.00, refHigh: 40.90 },
  "lysoPC a C18:1": { value: 24.15, refLow: 12.00, refHigh: 36.30 },
  "lysoPC a C18:2": { value: 33.60, refLow: 15.40, refHigh: 51.80 },
  "lysoPC a C20:3": { value: 2.5500, refLow: 1.1000, refHigh: 4.0000 },
  "lysoPC a C20:4": { value: 6.3000, refLow: 2.7000, refHigh: 9.9000 },
  "lysoPC a C24:0": { value: 0.1590, refLow: 0.0880, refHigh: 0.2300 },
  "lysoPC a C26:0": { value: 0.8950, refLow: 0.4900, refHigh: 1.3000 },
  "lysoPC a C26:1": { value: 0.1175, refLow: 0.0650, refHigh: 0.1700 },
  "lysoPC a C28:0": { value: 0.5750, refLow: 0.3300, refHigh: 0.8200 },
  "lysoPC a C28:1": { value: 0.4500, refLow: 0.2300, refHigh: 0.6700 },
  "trans-OH-Proline": { value: 10.55, refLow: 4.6000, refHigh: 16.50 },
  "von Willebrand Factor": { value: 20.80, refLow: 8.0000, refHigh: 33.60 },
};

const DEMO_MARKERS_TYPICAL = {
  "5HIAA": { value: 0.0500, refLow: 0.0420, refHigh: 0.0580 },
  "ADMA": { value: 0.4650, refLow: 0.3000, refHigh: 0.6300 },
  "Acetyl-Ornithine": { value: 0.9600, refLow: 0.3200, refHigh: 1.6000 },
  "Adipocyte plasma membrane-associated protein": { value: 20.45, refLow: 8.9000, refHigh: 32.00 },
  "Afamin": { value: 240.23, refLow: 281.00, refHigh: 727.40 },
  "Alanine": { value: 390.55, refLow: 242.50, refHigh: 538.60 },
  "Alpha-1-acid glycoprotein 1": { value: 5241.0, refLow: 2592.7, refHigh: 7889.4 },
  "Alpha-1-antichymotrypsin": { value: 3177.2, refLow: 2065.3, refHigh: 4289.2 },
  "Alpha-1-antitrypsin": { value: 22714.3, refLow: 13435.6, refHigh: 31993.0 },
  "Alpha-1B-glycoprotein": { value: 1743.6, refLow: 925.10, refHigh: 2562.0 },
  "Alpha-2-HS-glycoprotein": { value: 4920.3, refLow: 3120.4, refHigh: 6720.2 },
  "Alpha-2-antiplasmin": { value: 1045.0, refLow: 772.80, refHigh: 1317.2 },
  "Alpha-2-macroglobulin": { value: 8169.8, refLow: 3953.4, refHigh: 12386.2 },
  "Alpha-amino-N-butyric acid": { value: 17.85, refLow: 8.6000, refHigh: 27.10 },
  "Angiogenin": { value: 6.2500, refLow: 2.5000, refHigh: 10.00 },
  "Angiotensinogen": { value: 361.51, refLow: 494.60, refHigh: 1840.7 },
  "Antithrombin-III": { value: 86003.6, refLow: 70378.6, refHigh: 101628.5 },
  "Apolipoprotein A-I": { value: 47648.8, refLow: 28754.4, refHigh: 66543.1 },
  "Apolipoprotein A-II": { value: 16820.7, refLow: 5913.7, refHigh: 15151.7 },
  "Apolipoprotein A-IV": { value: 1610.8, refLow: 638.80, refHigh: 2582.9 },
  "Apolipoprotein B-100": { value: 326.75, refLow: 143.10, refHigh: 510.40 },
  "Apolipoprotein C-I": { value: 4288.1, refLow: 1408.1, refHigh: 7168.1 },
  "Apolipoprotein C-II": { value: 1940.0, refLow: 713.00, refHigh: 3167.0 },
  "Apolipoprotein C-III": { value: 7161.2, refLow: 2588.1, refHigh: 11734.3 },
  "Apolipoprotein C-IV": { value: 130.20, refLow: 26.70, refHigh: 233.70 },
  "Apolipoprotein D": { value: 2161.2, refLow: 1105.9, refHigh: 3216.5 },
  "Apolipoprotein E": { value: 106.90, refLow: 406.10, refHigh: 1354.1 },
  "Apolipoprotein L1": { value: 755.81, refLow: 222.60, refHigh: 711.60 },
  "Apolipoprotein M": { value: 420.45, refLow: 176.50, refHigh: 664.40 },
  "Arginine": { value: 78.45, refLow: 43.80, refHigh: 113.10 },
  "Asparagine": { value: 40.40, refLow: 26.60, refHigh: 54.20 },
  "Aspartic acid": { value: 12.95, refLow: 6.1000, refHigh: 19.80 },
  "Attractin": { value: 109.10, refLow: 72.80, refHigh: 145.40 },
  "Benzoic acid": { value: 0.2215, refLow: 0.0530, refHigh: 0.3900 },
  "Beta-2-glycoprotein 1": { value: 1732.9, refLow: 358.90, refHigh: 3106.9 },
  "Beta-2-microglobulin": { value: 138.65, refLow: 77.90, refHigh: 199.40 },
  "Beta-Ala-His dipeptidase": { value: 89.85, refLow: 42.80, refHigh: 136.90 },
  "Beta-alanine": { value: 11.15, refLow: 4.4000, refHigh: 17.90 },
  "Betaine": { value: 57.10, refLow: 19.30, refHigh: 94.90 },
  "Biotinidase": { value: 96.95, refLow: 56.60, refHigh: 137.30 },
  "Butyric acid": { value: 1.1250, refLow: 0.5500, refHigh: 1.7000 },
  "C-reactive protein": { value: 0, refLow: 0, refHigh: 108.30 },
  "C0": { value: 38.45, refLow: 22.20, refHigh: 54.70 },
  "C10": { value: 0.1089, refLow: 0.1600, refHigh: 0.7800 },
  "C10:1": { value: 0.2800, refLow: 0.1400, refHigh: 0.4200 },
  "C10:2": { value: 0.0250, refLow: 0.0410, refHigh: 0.0860 },
  "C12": { value: 0.0535, refLow: 0.0620, refHigh: 0.1900 },
  "C12-DC": { value: 0.0140, refLow: 0.00890, refHigh: 0.0190 },
  "C12:1": { value: 0.1800, refLow: 0.1000, refHigh: 0.2600 },
  "C14": { value: 0.0490, refLow: 0.0320, refHigh: 0.0660 },
  "C14:1": { value: 0.1350, refLow: 0.0600, refHigh: 0.2100 },
  "C14:1-OH": { value: 0.0342, refLow: 0.0160, refHigh: 0.0310 },
  "C14:2": { value: 0.0545, refLow: 0.0200, refHigh: 0.0890 },
  "C14:2-OH": { value: 0.0243, refLow: 0.0100, refHigh: 0.0220 },
  "C16": { value: 0.1190, refLow: 0.0680, refHigh: 0.1700 },
  "C16-OH": { value: 0.0189, refLow: 0.00920, refHigh: 0.0180 },
  "C16:1": { value: 0.0450, refLow: 0.0290, refHigh: 0.0610 },
  "C16:1-OH": { value: 0.0147, refLow: 0.00940, refHigh: 0.0200 },
  "C16:2": { value: 0.0164, refLow: 0.00980, refHigh: 0.0230 },
  "C16:2-OH": { value: 0.00540, refLow: 0.00810, refHigh: 0.0170 },
  "C18": { value: 0.0455, refLow: 0.0230, refHigh: 0.0680 },
  "C18:1": { value: 0.1340, refLow: 0.0780, refHigh: 0.1900 },
  "C18:1-OH": { value: 0.0131, refLow: 0.00830, refHigh: 0.0180 },
  "C18:2": { value: 0.0615, refLow: 0.0340, refHigh: 0.0890 },
  "C2": { value: 13.16, refLow: 4.1000, refHigh: 12.40 },
  "C3": { value: 0.3650, refLow: 0.1800, refHigh: 0.5500 },
  "C3-DC (C4-OH)": { value: 0.0540, refLow: 0.0290, refHigh: 0.0790 },
  "C3-OH": { value: 0.0385, refLow: 0.0250, refHigh: 0.0520 },
  "C3:1": { value: 0.0710, refLow: 0.0450, refHigh: 0.0970 },
  "C4": { value: 0.2250, refLow: 0.1100, refHigh: 0.3400 },
  "C4:1": { value: 0.00507, refLow: 0.0150, refHigh: 0.0430 },
  "C4b-binding protein alpha chain": { value: 3301.4, refLow: 1606.7, refHigh: 4996.2 },
  "C5": { value: 0.1325, refLow: 0.0650, refHigh: 0.2000 },
  "C5-M-DC": { value: 0.0350, refLow: 0.0230, refHigh: 0.0470 },
  "C5-OH (C3-DC-M)": { value: 0.0380, refLow: 0.0240, refHigh: 0.0520 },
  "C5:1": { value: 0.0565, refLow: 0.0430, refHigh: 0.0700 },
  "C5:1-DC": { value: 0.0220, refLow: 0.0130, refHigh: 0.0310 },
  "C6 (C4:1-DC)": { value: 0.1536, refLow: 0.0440, refHigh: 0.1200 },
  "C6:1": { value: 0, refLow: 0.0430, refHigh: 0.5900 },
  "C7-DC": { value: 0.0740, refLow: 0.0380, refHigh: 0.1100 },
  "C8": { value: 0.2950, refLow: 0.1700, refHigh: 0.4200 },
  "C9": { value: 0.0565, refLow: 0.0250, refHigh: 0.0880 },
  "CD44 antigen": { value: 50.40, refLow: 22.70, refHigh: 78.10 },
  "CD5 antigen-like": { value: 147.47, refLow: 227.20, refHigh: 1094.5 },
  "Cadherin-5": { value: 36.30, refLow: 18.40, refHigh: 54.20 },
  "Carbonic anhydrase 1": { value: 87.45, refLow: 20.70, refHigh: 154.20 },
  "Carboxypeptidase B2": { value: 95.55, refLow: 60.50, refHigh: 130.60 },
  "Carboxypeptidase N catalytic chain": { value: 160.28, refLow: 57.40, refHigh: 141.60 },
  "Carboxypeptidase N subunit 2": { value: 200.35, refLow: 53.60, refHigh: 347.10 },
  "Carnosine": { value: 0.0475, refLow: 0, refHigh: 0.0950 },
  "Cartilage acidic protein 1": { value: 22.00, refLow: 8.2000, refHigh: 35.80 },
  "Ceruloplasmin": { value: 828.29, refLow: 1058.6, refHigh: 3002.8 },
  "Choline": { value: 11.65, refLow: 6.0000, refHigh: 17.30 },
  "Cholinesterase": { value: 10.80, refLow: 5.7000, refHigh: 15.90 },
  "Citric acid": { value: 107.40, refLow: 62.10, refHigh: 152.70 },
  "Citrulline": { value: 14.10, refLow: 19.40, refHigh: 42.50 },
  "Clusterin": { value: 1315.5, refLow: 111.70, refHigh: 948.10 },
  "Coagulation factor IX": { value: 13.83, refLow: 27.00, refHigh: 63.20 },
  "Coagulation factor V": { value: 59.90, refLow: 37.70, refHigh: 82.10 },
  "Coagulation factor X": { value: 141.65, refLow: 89.70, refHigh: 193.60 },
  "Coagulation factor XI": { value: 52.00, refLow: 33.30, refHigh: 70.70 },
  "Coagulation factor XII": { value: 673.24, refLow: 126.00, refHigh: 587.30 },
  "Coagulation factor XIII A chain": { value: 111.10, refLow: 55.30, refHigh: 166.90 },
  "Coagulation factor XIII B chain": { value: 129.75, refLow: 75.30, refHigh: 184.20 },
  "Complement C1q subcomponent subunit B": { value: 316.20, refLow: 202.10, refHigh: 430.30 },
  "Complement C1r subcomponent": { value: 372.70, refLow: 261.80, refHigh: 483.60 },
  "Complement C1r subcomponent-like protein": { value: 59.80, refLow: 39.10, refHigh: 80.50 },
  "Complement C1s subcomponent": { value: 254.65, refLow: 177.30, refHigh: 332.00 },
  "Complement C2": { value: 114.35, refLow: 65.40, refHigh: 163.30 },
  "Complement C3": { value: 4274.5, refLow: 2484.3, refHigh: 6064.7 },
  "Complement C4-B": { value: 2482.6, refLow: 608.50, refHigh: 2208.6 },
  "Complement C5": { value: 192.85, refLow: 124.00, refHigh: 261.70 },
  "Complement component C6": { value: 227.35, refLow: 112.40, refHigh: 342.30 },
  "Complement component C7": { value: 169.85, refLow: 91.20, refHigh: 248.50 },
  "Complement component C8 alpha chain": { value: 166.15, refLow: 96.10, refHigh: 236.20 },
  "Complement component C8 beta chain": { value: 300.87, refLow: 121.10, refHigh: 268.10 },
  "Complement component C9": { value: 274.20, refLow: 123.20, refHigh: 425.20 },
  "Complement factor B": { value: 1345.2, refLow: 772.70, refHigh: 1917.7 },
  "Complement factor D": { value: 59.75, refLow: 32.30, refHigh: 87.20 },
  "Complement factor H": { value: 1182.7, refLow: 695.70, refHigh: 1669.7 },
  "Complement factor I": { value: 372.40, refLow: 220.30, refHigh: 524.50 },
  "Corticosteroid-binding globulin": { value: 661.45, refLow: 365.40, refHigh: 957.50 },
  "Cotinine": { value: 0, refLow: 0, refHigh: 0.0160 },
  "Creatine": { value: 3.8049, refLow: 8.8000, refHigh: 38.50 },
  "Creatinine": { value: 45.68, refLow: 50.50, refHigh: 122.00 },
  "Cystatin-C": { value: 40.95, refLow: 23.40, refHigh: 58.50 },
  "DOPA": { value: 0.00485, refLow: 0.00180, refHigh: 0.00790 },
  "Diacetylspermine": { value: 0.0480, refLow: 0.0460, refHigh: 0.0500 },
  "Endothelial protein C receptor": { value: 9.1500, refLow: 8.8000, refHigh: 9.5000 },
  "Extracellular matrix protein 1": { value: 69.30, refLow: 39.10, refHigh: 99.50 },
  "Fetuin-B": { value: 145.56, refLow: 31.80, refHigh: 113.50 },
  "Fibrinogen alpha chain": { value: 9428.6, refLow: 10298.2, refHigh: 26539.9 },
  "Fibrinogen beta chain": { value: 2573.0, refLow: 7806.5, refHigh: 19682.0 },
  "Fibrinogen gamma chain": { value: 5678.9, refLow: 8532.7, refHigh: 22809.4 },
  "Fibronectin": { value: 1427.6, refLow: 339.90, refHigh: 2515.3 },
  "Fibulin-1": { value: 195.45, refLow: 107.50, refHigh: 283.40 },
  "Ficolin-2": { value: 58.30, refLow: 24.90, refHigh: 91.70 },
  "Ficolin-3": { value: 229.55, refLow: 119.10, refHigh: 340.00 },
  "Fumaric acid": { value: 1.2150, refLow: 0.5300, refHigh: 1.9000 },
  "Galectin-3-binding protein": { value: 92.17, refLow: 32.20, refHigh: 74.20 },
  "Gamma-aminobutyric acid": { value: 0.3497, refLow: 0.0820, refHigh: 0.3300 },
  "Gelsolin": { value: 598.98, refLow: 268.40, refHigh: 544.70 },
  "Glucose": { value: 4798.6, refLow: 3824.3, refHigh: 5772.8 },
  "Glutamic acid": { value: 5.0773, refLow: 29.60, refHigh: 95.10 },
  "Glutamine": { value: 539.85, refLow: 391.20, refHigh: 688.50 },
  "Glutathione peroxidase 3": { value: 129.60, refLow: 77.10, refHigh: 182.10 },
  "Glycine": { value: 260.15, refLow: 158.50, refHigh: 361.80 },
  "Haptoglobin": { value: 2975.5, refLow: 5184.6, refHigh: 46108.3 },
  "Hemoglobin subunit alpha 1": { value: 1521.0, refLow: 269.90, refHigh: 2772.1 },
  "Hemopexin": { value: 777.33, refLow: 1698.1, refHigh: 11744.4 },
  "Heparin cofactor 2": { value: 755.55, refLow: 409.50, refHigh: 1101.6 },
  "Hippuric acid": { value: 7.9500, refLow: 1.4000, refHigh: 14.50 },
  "Histamine": { value: 0.00475, refLow: 0, refHigh: 0.00950 },
  "Histidine": { value: 39.77, refLow: 55.60, refHigh: 104.50 },
  "Histidine-rich glycoprotein": { value: 1956.1, refLow: 773.30, refHigh: 3138.9 },
  "Homocysteine": { value: 9.7000, refLow: 6.3000, refHigh: 13.10 },
  "Homovanillic acid": { value: 0.0605, refLow: 0.0290, refHigh: 0.0920 },
  "Hydroxyphenylacetic acid": { value: 0.2005, refLow: 0.0810, refHigh: 0.3200 },
  "Ig mu chain C region": { value: 10223.5, refLow: 2887.8, refHigh: 17559.2 },
  "IgGFc-binding protein": { value: 13.15, refLow: 3.1000, refHigh: 23.20 },
  "Indole acetic acid": { value: 1.7500, refLow: 1.0000, refHigh: 2.5000 },
  "Insulin-like growth factor-binding protein 2": { value: 6.5500, refLow: 1.9000, refHigh: 11.20 },
  "Insulin-like growth factor-binding protein 3": { value: 30.10, refLow: 17.30, refHigh: 42.90 },
  "Insulin-like growth factor-binding protein complex acid labile subunit": { value: 133.35, refLow: 72.00, refHigh: 194.70 },
  "Inter-alpha-trypsin inhibitor heavy chain H1": { value: 3150.6, refLow: 1035.5, refHigh: 5265.8 },
  "Inter-alpha-trypsin inhibitor heavy chain H2": { value: 1375.1, refLow: 945.30, refHigh: 1804.9 },
  "Inter-alpha-trypsin inhibitor heavy chain H4": { value: 725.92, refLow: 918.70, refHigh: 2180.4 },
  "Intercellular adhesion molecule 1": { value: 6.7500, refLow: 4.2000, refHigh: 9.3000 },
  "Isobutyric acid": { value: 1.2850, refLow: 0.6700, refHigh: 1.9000 },
  "Isoleucine": { value: 62.20, refLow: 39.90, refHigh: 84.50 },
  "Kallistatin": { value: 95.65, refLow: 54.00, refHigh: 137.30 },
  "Kininogen-1": { value: 1869.4, refLow: 1265.6, refHigh: 2473.3 },
  "Kynurenine": { value: 2.5000, refLow: 1.6000, refHigh: 3.4000 },
  "L-selectin": { value: 46.00, refLow: 24.30, refHigh: 67.70 },
  "Lactic acid": { value: 1484.2, refLow: 692.00, refHigh: 2276.4 },
  "Leucine": { value: 126.70, refLow: 80.30, refHigh: 173.10 },
  "Leucine-rich alpha-2-glycoprotein 1": { value: 438.85, refLow: 198.50, refHigh: 679.20 },
  "Lipopolysaccharide-binding protein": { value: 59.80, refLow: 24.60, refHigh: 95.00 },
  "Lumican": { value: 319.50, refLow: 189.40, refHigh: 449.60 },
  "Lysine": { value: 183.65, refLow: 116.60, refHigh: 250.70 },
  "Lysozyme C": { value: 18.67, refLow: 43.30, refHigh: 113.60 },
  "Mannan-binding lectin serine protease 2": { value: 35.70, refLow: 26.20, refHigh: 45.20 },
  "Mannose-binding protein C": { value: 0, refLow: 26.60, refHigh: 90.50 },
  "Methionine": { value: 24.05, refLow: 16.30, refHigh: 31.80 },
  "Methionine-Sulfoxide": { value: 0.7450, refLow: 0.3900, refHigh: 1.1000 },
  "Methylhistidine": { value: 37.20, refLow: 6.0000, refHigh: 68.40 },
  "Methylmalonic acid": { value: 0.0940, refLow: 0.0380, refHigh: 0.1500 },
  "Nitro-Tyrosine": { value: 0.0218, refLow: 0.00670, refHigh: 0.0370 },
  "Ornithine": { value: 72.90, refLow: 46.60, refHigh: 99.20 },
  "PC aa C32:2": { value: 3.5000, refLow: 1.8000, refHigh: 5.2000 },
  "PC aa C36:0": { value: 8.0000, refLow: 4.5000, refHigh: 11.50 },
  "PC aa C36:6": { value: 1.4850, refLow: 0.5700, refHigh: 2.4000 },
  "PC aa C38:0": { value: 4.7500, refLow: 2.3000, refHigh: 7.2000 },
  "PC aa C38:6": { value: 99.05, refLow: 46.50, refHigh: 151.60 },
  "PC aa C40:1": { value: 0.3458, refLow: 0.4400, refHigh: 0.9700 },
  "PC aa C40:2": { value: 0.6150, refLow: 0.3300, refHigh: 0.9000 },
  "PC aa C40:6": { value: 27.35, refLow: 13.20, refHigh: 41.50 },
  "PC ae C36:0": { value: 1.3800, refLow: 0.6600, refHigh: 2.1000 },
  "PC ae C40:6": { value: 8.6372, refLow: 2.8000, refHigh: 8.3000 },
  "Para-hydroxyhippuric acid": { value: 0.0810, refLow: 0.0220, refHigh: 0.1400 },
  "Peroxiredoxin-2": { value: 32.75, refLow: 8.9000, refHigh: 56.60 },
  "Phenylalanine": { value: 59.75, refLow: 44.20, refHigh: 75.30 },
  "Phenylethylamine": { value: 0.000245, refLow: 0, refHigh: 0.000490 },
  "Phosphatidylinositol-glycan-specific phospholipase D": { value: 13.00, refLow: 36.90, refHigh: 113.10 },
  "Phospholipid transfer protein": { value: 25.96, refLow: 29.20, refHigh: 69.70 },
  "Pigment epithelium-derived factor": { value: 236.40, refLow: 145.10, refHigh: 327.70 },
  "Plasma protease C1 inhibitor": { value: 1562.6, refLow: 1023.8, refHigh: 2101.3 },
  "Plasma serine protease inhibitor": { value: 20.68, refLow: 66.80, refHigh: 176.70 },
  "Plasminogen": { value: 476.80, refLow: 297.30, refHigh: 656.30 },
  "Plastin-2": { value: 34.30, refLow: 21.20, refHigh: 47.40 },
  "Pregnancy zone protein": { value: 398.10, refLow: 41.70, refHigh: 754.50 },
  "Probable G-protein coupled receptor 116": { value: 4.1072, refLow: 1.2000, refHigh: 3.8000 },
  "Proline": { value: 89.01, refLow: 109.20, refHigh: 291.90 },
  "Proline-Betaine": { value: 0, refLow: 1.1000, refHigh: 19.80 },
  "Propionic acid": { value: 1.2050, refLow: 0.7100, refHigh: 1.7000 },
  "Protein AMBP": { value: 1426.7, refLow: 338.10, refHigh: 1323.5 },
  "Protein S100-A9": { value: 21.70, refLow: 6.8000, refHigh: 36.60 },
  "Protein Z-dependent protease inhibitor": { value: 35.75, refLow: 21.80, refHigh: 49.70 },
  "Proteoglycan 4": { value: 11.61, refLow: 16.90, refHigh: 94.00 },
  "Prothrombin": { value: 701.24, refLow: 761.10, refHigh: 1540.8 },
  "Putrescine": { value: 0.2250, refLow: 0.1200, refHigh: 0.3300 },
  "Pyruvic acid": { value: 77.85, refLow: 38.90, refHigh: 116.80 },
  "Retinol-binding protein 4": { value: 1656.2, refLow: 866.50, refHigh: 2446.0 },
  "SM (OH) C14:1": { value: 12.07, refLow: 3.5000, refHigh: 10.40 },
  "SM (OH) C16:1": { value: 2.2048, refLow: 2.5000, refHigh: 7.0000 },
  "SM (OH) C22:1": { value: 12.65, refLow: 7.5000, refHigh: 17.80 },
  "SM (OH) C22:2": { value: 10.45, refLow: 5.8000, refHigh: 15.10 },
  "SM (OH) C24:1": { value: 1.7500, refLow: 1.0000, refHigh: 2.5000 },
  "SM C16:0": { value: 124.65, refLow: 78.30, refHigh: 171.00 },
  "SM C16:1": { value: 27.29, refLow: 10.10, refHigh: 25.80 },
  "SM C18:0": { value: 26.30, refLow: 15.20, refHigh: 37.40 },
  "SM C18:1": { value: 23.01, refLow: 6.4000, refHigh: 18.00 },
  "SM C20:2": { value: 0.5300, refLow: 0.2600, refHigh: 0.8000 },
  "Sarcosine": { value: 0, refLow: 2.4000, refHigh: 21.10 },
  "Serine": { value: 69.43, refLow: 81.70, refHigh: 148.90 },
  "Serotonin": { value: 0.7000, refLow: 0.2000, refHigh: 1.2000 },
  "Serotransferrin": { value: 25389.4, refLow: 11558.2, refHigh: 24358.4 },
  "Serum albumin": { value: 268774.7, refLow: 342711.6, refHigh: 621132.0 },
  "Serum amyloid A-1 protein": { value: 60.45, refLow: 34.60, refHigh: 86.30 },
  "Serum amyloid A-4 protein": { value: 1346.2, refLow: 593.80, refHigh: 2098.6 },
  "Serum amyloid P-component": { value: 588.60, refLow: 241.00, refHigh: 936.20 },
  "Serum paraoxonase/arylesterase 1": { value: 884.05, refLow: 416.50, refHigh: 1351.6 },
  "Sex hormone-binding globulin": { value: 0, refLow: 20.40, refHigh: 170.00 },
  "Spermidine": { value: 0.2100, refLow: 0.1200, refHigh: 0.3000 },
  "Spermine": { value: 0.1850, refLow: 0.1500, refHigh: 0.2200 },
  "Succinic acid": { value: 4.0000, refLow: 2.3000, refHigh: 5.7000 },
  "TMAO": { value: 8.6000, refLow: 1.1000, refHigh: 16.10 },
  "Taurine": { value: 104.31, refLow: 33.10, refHigh: 98.70 },
  "Tenascin": { value: 4.0000, refLow: 2.4000, refHigh: 5.6000 },
  "Tetranectin": { value: 213.45, refLow: 129.20, refHigh: 297.70 },
  "Threonine": { value: 140.10, refLow: 87.40, refHigh: 192.80 },
  "Thrombospondin-1": { value: 54.10, refLow: 7.4000, refHigh: 100.80 },
  "Thyroxine-binding globulin": { value: 282.75, refLow: 158.20, refHigh: 407.30 },
  "Transthyretin": { value: 538.50, refLow: 197.70, refHigh: 879.30 },
  "Trigonelline": { value: 0.8900, refLow: 0.1800, refHigh: 1.6000 },
  "Tryptophan": { value: 38.68, refLow: 42.30, refHigh: 81.20 },
  "Tyramine": { value: 0.00475, refLow: 0, refHigh: 0.00950 },
  "Tyrosine": { value: 63.65, refLow: 38.90, refHigh: 88.40 },
  "Uric acid": { value: 337.50, refLow: 199.30, refHigh: 475.70 },
  "Valine": { value: 240.45, refLow: 162.40, refHigh: 318.50 },
  "Vasorin": { value: 12.25, refLow: 7.3000, refHigh: 17.20 },
  "Vitamin D-binding protein": { value: 2535.9, refLow: 1704.2, refHigh: 3367.7 },
  "Vitamin K-dependent protein S": { value: 292.30, refLow: 173.40, refHigh: 411.20 },
  "Vitamin K-dependent protein Z": { value: 75.80, refLow: 21.90, refHigh: 129.70 },
  "Vitronectin": { value: 3312.1, refLow: 1909.6, refHigh: 4714.5 },
  "Xaa-Pro dipeptidase": { value: 7.0000, refLow: 3.1000, refHigh: 10.90 },
  "Zinc-alpha-2-glycoprotein": { value: 323.25, refLow: 64.00, refHigh: 582.50 },
  "alpha-Aminoadipic acid": { value: 0, refLow: 0.2300, refHigh: 2.2000 },
  "alpha-Ketoglutaric acid": { value: 9.6000, refLow: 6.8000, refHigh: 12.40 },
  "beta-Hydroxybutyric acid": { value: 136.80, refLow: 22.80, refHigh: 250.80 },
  "lysoPC a C14:0": { value: 4.9500, refLow: 2.1000, refHigh: 7.8000 },
  "lysoPC a C16:0": { value: 79.45, refLow: 50.60, refHigh: 108.30 },
  "lysoPC a C16:1": { value: 0.2204, refLow: 1.1000, refHigh: 3.6000 },
  "lysoPC a C17:0": { value: 1.7100, refLow: 0.9200, refHigh: 2.5000 },
  "lysoPC a C18:0": { value: 27.95, refLow: 15.00, refHigh: 40.90 },
  "lysoPC a C18:1": { value: 24.15, refLow: 12.00, refHigh: 36.30 },
  "lysoPC a C18:2": { value: 33.60, refLow: 15.40, refHigh: 51.80 },
  "lysoPC a C20:3": { value: 2.5500, refLow: 1.1000, refHigh: 4.0000 },
  "lysoPC a C20:4": { value: 2.1105, refLow: 2.7000, refHigh: 9.9000 },
  "lysoPC a C24:0": { value: 0.0361, refLow: 0.0880, refHigh: 0.2300 },
  "lysoPC a C26:0": { value: 0.8950, refLow: 0.4900, refHigh: 1.3000 },
  "lysoPC a C26:1": { value: 0.1175, refLow: 0.0650, refHigh: 0.1700 },
  "lysoPC a C28:0": { value: 0.5750, refLow: 0.3300, refHigh: 0.8200 },
  "lysoPC a C28:1": { value: 0.4500, refLow: 0.2300, refHigh: 0.6700 },
  "trans-OH-Proline": { value: 0.0360, refLow: 4.6000, refHigh: 16.50 },
  "von Willebrand Factor": { value: 20.80, refLow: 8.0000, refHigh: 33.60 },
};

const DEMO_MARKERS_UNHEALTHY = {
  "5HIAA": { value: 0.0404, refLow: 0.0420, refHigh: 0.0580 },
  "ADMA": { value: 0.4650, refLow: 0.3000, refHigh: 0.6300 },
  "Acetyl-Ornithine": { value: 0.9600, refLow: 0.3200, refHigh: 1.6000 },
  "Adipocyte plasma membrane-associated protein": { value: 20.45, refLow: 8.9000, refHigh: 32.00 },
  "Afamin": { value: 108.60, refLow: 281.00, refHigh: 727.40 },
  "Alanine": { value: 390.55, refLow: 242.50, refHigh: 538.60 },
  "Alpha-1-acid glycoprotein 1": { value: 5241.0, refLow: 2592.7, refHigh: 7889.4 },
  "Alpha-1-antichymotrypsin": { value: 3177.2, refLow: 2065.3, refHigh: 4289.2 },
  "Alpha-1-antitrypsin": { value: 11577.6, refLow: 13435.6, refHigh: 31993.0 },
  "Alpha-1B-glycoprotein": { value: 2951.9, refLow: 925.10, refHigh: 2562.0 },
  "Alpha-2-HS-glycoprotein": { value: 2749.2, refLow: 3120.4, refHigh: 6720.2 },
  "Alpha-2-antiplasmin": { value: 1045.0, refLow: 772.80, refHigh: 1317.2 },
  "Alpha-2-macroglobulin": { value: 8169.8, refLow: 3953.4, refHigh: 12386.2 },
  "Alpha-amino-N-butyric acid": { value: 17.85, refLow: 8.6000, refHigh: 27.10 },
  "Angiogenin": { value: 6.2500, refLow: 2.5000, refHigh: 10.00 },
  "Angiotensinogen": { value: 242.75, refLow: 494.60, refHigh: 1840.7 },
  "Antithrombin-III": { value: 86003.6, refLow: 70378.6, refHigh: 101628.5 },
  "Apolipoprotein A-I": { value: 84411.5, refLow: 28754.4, refHigh: 66543.1 },
  "Apolipoprotein A-II": { value: 932.14, refLow: 5913.7, refHigh: 15151.7 },
  "Apolipoprotein A-IV": { value: 1610.8, refLow: 638.80, refHigh: 2582.9 },
  "Apolipoprotein B-100": { value: 543.61, refLow: 143.10, refHigh: 510.40 },
  "Apolipoprotein C-I": { value: 0, refLow: 1408.1, refHigh: 7168.1 },
  "Apolipoprotein C-II": { value: 0, refLow: 713.00, refHigh: 3167.0 },
  "Apolipoprotein C-III": { value: 14123.2, refLow: 2588.1, refHigh: 11734.3 },
  "Apolipoprotein C-IV": { value: 246.41, refLow: 26.70, refHigh: 233.70 },
  "Apolipoprotein D": { value: 2161.2, refLow: 1105.9, refHigh: 3216.5 },
  "Apolipoprotein E": { value: 32.92, refLow: 406.10, refHigh: 1354.1 },
  "Apolipoprotein L1": { value: 467.10, refLow: 222.60, refHigh: 711.60 },
  "Apolipoprotein M": { value: 13.10, refLow: 176.50, refHigh: 664.40 },
  "Arginine": { value: 78.45, refLow: 43.80, refHigh: 113.10 },
  "Asparagine": { value: 14.90, refLow: 26.60, refHigh: 54.20 },
  "Aspartic acid": { value: 2.7898, refLow: 6.1000, refHigh: 19.80 },
  "Attractin": { value: 109.10, refLow: 72.80, refHigh: 145.40 },
  "Benzoic acid": { value: 0.2215, refLow: 0.0530, refHigh: 0.3900 },
  "Beta-2-glycoprotein 1": { value: 1732.9, refLow: 358.90, refHigh: 3106.9 },
  "Beta-2-microglobulin": { value: 138.65, refLow: 77.90, refHigh: 199.40 },
  "Beta-Ala-His dipeptidase": { value: 159.02, refLow: 42.80, refHigh: 136.90 },
  "Beta-alanine": { value: 11.15, refLow: 4.4000, refHigh: 17.90 },
  "Betaine": { value: 110.56, refLow: 19.30, refHigh: 94.90 },
  "Biotinidase": { value: 96.95, refLow: 56.60, refHigh: 137.30 },
  "Butyric acid": { value: 2.2161, refLow: 0.5500, refHigh: 1.7000 },
  "C-reactive protein": { value: 54.15, refLow: 0, refHigh: 108.30 },
  "C0": { value: 56.82, refLow: 22.20, refHigh: 54.70 },
  "C10": { value: 0.8955, refLow: 0.1600, refHigh: 0.7800 },
  "C10:1": { value: 0.2800, refLow: 0.1400, refHigh: 0.4200 },
  "C10:2": { value: 0.0635, refLow: 0.0410, refHigh: 0.0860 },
  "C12": { value: 0.2017, refLow: 0.0620, refHigh: 0.1900 },
  "C12-DC": { value: 0.0140, refLow: 0.00890, refHigh: 0.0190 },
  "C12:1": { value: 0.2739, refLow: 0.1000, refHigh: 0.2600 },
  "C14": { value: 0.0176, refLow: 0.0320, refHigh: 0.0660 },
  "C14:1": { value: 0.1350, refLow: 0.0600, refHigh: 0.2100 },
  "C14:1-OH": { value: 0.0379, refLow: 0.0160, refHigh: 0.0310 },
  "C14:2": { value: 0.0545, refLow: 0.0200, refHigh: 0.0890 },
  "C14:2-OH": { value: 0.0160, refLow: 0.0100, refHigh: 0.0220 },
  "C16": { value: 0.1190, refLow: 0.0680, refHigh: 0.1700 },
  "C16-OH": { value: 0.0136, refLow: 0.00920, refHigh: 0.0180 },
  "C16:1": { value: 0.0782, refLow: 0.0290, refHigh: 0.0610 },
  "C16:1-OH": { value: 0.00412, refLow: 0.00940, refHigh: 0.0200 },
  "C16:2": { value: 0.0164, refLow: 0.00980, refHigh: 0.0230 },
  "C16:2-OH": { value: 0.00756, refLow: 0.00810, refHigh: 0.0170 },
  "C18": { value: 0.00547, refLow: 0.0230, refHigh: 0.0680 },
  "C18:1": { value: 0.1340, refLow: 0.0780, refHigh: 0.1900 },
  "C18:1-OH": { value: 0.0131, refLow: 0.00830, refHigh: 0.0180 },
  "C18:2": { value: 0.0615, refLow: 0.0340, refHigh: 0.0890 },
  "C2": { value: 14.44, refLow: 4.1000, refHigh: 12.40 },
  "C3": { value: 0.3650, refLow: 0.1800, refHigh: 0.5500 },
  "C3-DC (C4-OH)": { value: 0.0262, refLow: 0.0290, refHigh: 0.0790 },
  "C3-OH": { value: 0.0385, refLow: 0.0250, refHigh: 0.0520 },
  "C3:1": { value: 0.0710, refLow: 0.0450, refHigh: 0.0970 },
  "C4": { value: 0.0637, refLow: 0.1100, refHigh: 0.3400 },
  "C4:1": { value: 0.0290, refLow: 0.0150, refHigh: 0.0430 },
  "C4b-binding protein alpha chain": { value: 5290.9, refLow: 1606.7, refHigh: 4996.2 },
  "C5": { value: 0.0495, refLow: 0.0650, refHigh: 0.2000 },
  "C5-M-DC": { value: 0.0126, refLow: 0.0230, refHigh: 0.0470 },
  "C5-OH (C3-DC-M)": { value: 0.0380, refLow: 0.0240, refHigh: 0.0520 },
  "C5:1": { value: 0.0788, refLow: 0.0430, refHigh: 0.0700 },
  "C5:1-DC": { value: 0.0118, refLow: 0.0130, refHigh: 0.0310 },
  "C6 (C4:1-DC)": { value: 0.0820, refLow: 0.0440, refHigh: 0.1200 },
  "C6:1": { value: 0.3165, refLow: 0.0430, refHigh: 0.5900 },
  "C7-DC": { value: 0.0344, refLow: 0.0380, refHigh: 0.1100 },
  "C8": { value: 0.1096, refLow: 0.1700, refHigh: 0.4200 },
  "C9": { value: 0.0992, refLow: 0.0250, refHigh: 0.0880 },
  "CD44 antigen": { value: 50.40, refLow: 22.70, refHigh: 78.10 },
  "CD5 antigen-like": { value: 0, refLow: 227.20, refHigh: 1094.5 },
  "Cadherin-5": { value: 63.05, refLow: 18.40, refHigh: 54.20 },
  "Carbonic anhydrase 1": { value: 87.45, refLow: 20.70, refHigh: 154.20 },
  "Carboxypeptidase B2": { value: 95.55, refLow: 60.50, refHigh: 130.60 },
  "Carboxypeptidase N catalytic chain": { value: 99.50, refLow: 57.40, refHigh: 141.60 },
  "Carboxypeptidase N subunit 2": { value: 440.85, refLow: 53.60, refHigh: 347.10 },
  "Carnosine": { value: 0.0475, refLow: 0, refHigh: 0.0950 },
  "Cartilage acidic protein 1": { value: 3.3908, refLow: 8.2000, refHigh: 35.80 },
  "Ceruloplasmin": { value: 573.59, refLow: 1058.6, refHigh: 3002.8 },
  "Choline": { value: 11.65, refLow: 6.0000, refHigh: 17.30 },
  "Cholinesterase": { value: 10.80, refLow: 5.7000, refHigh: 15.90 },
  "Citric acid": { value: 107.40, refLow: 62.10, refHigh: 152.70 },
  "Citrulline": { value: 30.95, refLow: 19.40, refHigh: 42.50 },
  "Clusterin": { value: 529.90, refLow: 111.70, refHigh: 948.10 },
  "Coagulation factor IX": { value: 80.33, refLow: 27.00, refHigh: 63.20 },
  "Coagulation factor V": { value: 30.14, refLow: 37.70, refHigh: 82.10 },
  "Coagulation factor X": { value: 33.84, refLow: 89.70, refHigh: 193.60 },
  "Coagulation factor XI": { value: 25.20, refLow: 33.30, refHigh: 70.70 },
  "Coagulation factor XII": { value: 356.65, refLow: 126.00, refHigh: 587.30 },
  "Coagulation factor XIII A chain": { value: 111.10, refLow: 55.30, refHigh: 166.90 },
  "Coagulation factor XIII B chain": { value: 129.75, refLow: 75.30, refHigh: 184.20 },
  "Complement C1q subcomponent subunit B": { value: 316.20, refLow: 202.10, refHigh: 430.30 },
  "Complement C1r subcomponent": { value: 372.70, refLow: 261.80, refHigh: 483.60 },
  "Complement C1r subcomponent-like protein": { value: 102.05, refLow: 39.10, refHigh: 80.50 },
  "Complement C1s subcomponent": { value: 381.38, refLow: 177.30, refHigh: 332.00 },
  "Complement C2": { value: 184.05, refLow: 65.40, refHigh: 163.30 },
  "Complement C3": { value: 4274.5, refLow: 2484.3, refHigh: 6064.7 },
  "Complement C4-B": { value: 0, refLow: 608.50, refHigh: 2208.6 },
  "Complement C5": { value: 192.85, refLow: 124.00, refHigh: 261.70 },
  "Complement component C6": { value: 99.99, refLow: 112.40, refHigh: 342.30 },
  "Complement component C7": { value: 82.58, refLow: 91.20, refHigh: 248.50 },
  "Complement component C8 alpha chain": { value: 166.15, refLow: 96.10, refHigh: 236.20 },
  "Complement component C8 beta chain": { value: 297.20, refLow: 121.10, refHigh: 268.10 },
  "Complement component C9": { value: 7.9666, refLow: 123.20, refHigh: 425.20 },
  "Complement factor B": { value: 1345.2, refLow: 772.70, refHigh: 1917.7 },
  "Complement factor D": { value: 59.75, refLow: 32.30, refHigh: 87.20 },
  "Complement factor H": { value: 2180.0, refLow: 695.70, refHigh: 1669.7 },
  "Complement factor I": { value: 372.40, refLow: 220.30, refHigh: 524.50 },
  "Corticosteroid-binding globulin": { value: 213.68, refLow: 365.40, refHigh: 957.50 },
  "Cotinine": { value: 0.00800, refLow: 0, refHigh: 0.0160 },
  "Creatine": { value: 40.64, refLow: 8.8000, refHigh: 38.50 },
  "Creatinine": { value: 39.51, refLow: 50.50, refHigh: 122.00 },
  "Cystatin-C": { value: 21.46, refLow: 23.40, refHigh: 58.50 },
  "DOPA": { value: 0.00485, refLow: 0.00180, refHigh: 0.00790 },
  "Diacetylspermine": { value: 0.0480, refLow: 0.0460, refHigh: 0.0500 },
  "Endothelial protein C receptor": { value: 8.4488, refLow: 8.8000, refHigh: 9.5000 },
  "Extracellular matrix protein 1": { value: 69.30, refLow: 39.10, refHigh: 99.50 },
  "Fetuin-B": { value: 72.65, refLow: 31.80, refHigh: 113.50 },
  "Fibrinogen alpha chain": { value: 32950.0, refLow: 10298.2, refHigh: 26539.9 },
  "Fibrinogen beta chain": { value: 2852.7, refLow: 7806.5, refHigh: 19682.0 },
  "Fibrinogen gamma chain": { value: 6880.5, refLow: 8532.7, refHigh: 22809.4 },
  "Fibronectin": { value: 1427.6, refLow: 339.90, refHigh: 2515.3 },
  "Fibulin-1": { value: 195.45, refLow: 107.50, refHigh: 283.40 },
  "Ficolin-2": { value: 58.30, refLow: 24.90, refHigh: 91.70 },
  "Ficolin-3": { value: 355.40, refLow: 119.10, refHigh: 340.00 },
  "Fumaric acid": { value: 1.2150, refLow: 0.5300, refHigh: 1.9000 },
  "Galectin-3-binding protein": { value: 53.20, refLow: 32.20, refHigh: 74.20 },
  "Gamma-aminobutyric acid": { value: 0.4173, refLow: 0.0820, refHigh: 0.3300 },
  "Gelsolin": { value: 406.55, refLow: 268.40, refHigh: 544.70 },
  "Glucose": { value: 3460.1, refLow: 3824.3, refHigh: 5772.8 },
  "Glutamic acid": { value: 62.35, refLow: 29.60, refHigh: 95.10 },
  "Glutamine": { value: 539.85, refLow: 391.20, refHigh: 688.50 },
  "Glutathione peroxidase 3": { value: 129.60, refLow: 77.10, refHigh: 182.10 },
  "Glycine": { value: 405.43, refLow: 158.50, refHigh: 361.80 },
  "Haptoglobin": { value: 25646.5, refLow: 5184.6, refHigh: 46108.3 },
  "Hemoglobin subunit alpha 1": { value: 0, refLow: 269.90, refHigh: 2772.1 },
  "Hemopexin": { value: 0, refLow: 1698.1, refHigh: 11744.4 },
  "Heparin cofactor 2": { value: 186.70, refLow: 409.50, refHigh: 1101.6 },
  "Hippuric acid": { value: 7.9500, refLow: 1.4000, refHigh: 14.50 },
  "Histamine": { value: 0.00475, refLow: 0, refHigh: 0.00950 },
  "Histidine": { value: 30.68, refLow: 55.60, refHigh: 104.50 },
  "Histidine-rich glycoprotein": { value: 1956.1, refLow: 773.30, refHigh: 3138.9 },
  "Homocysteine": { value: 9.7000, refLow: 6.3000, refHigh: 13.10 },
  "Homovanillic acid": { value: 0.0605, refLow: 0.0290, refHigh: 0.0920 },
  "Hydroxyphenylacetic acid": { value: 0.4489, refLow: 0.0810, refHigh: 0.3200 },
  "Ig mu chain C region": { value: 0, refLow: 2887.8, refHigh: 17559.2 },
  "IgGFc-binding protein": { value: 0, refLow: 3.1000, refHigh: 23.20 },
  "Indole acetic acid": { value: 1.7500, refLow: 1.0000, refHigh: 2.5000 },
  "Insulin-like growth factor-binding protein 2": { value: 15.51, refLow: 1.9000, refHigh: 11.20 },
  "Insulin-like growth factor-binding protein 3": { value: 30.10, refLow: 17.30, refHigh: 42.90 },
  "Insulin-like growth factor-binding protein complex acid labile subunit": { value: 40.50, refLow: 72.00, refHigh: 194.70 },
  "Inter-alpha-trypsin inhibitor heavy chain H1": { value: 0, refLow: 1035.5, refHigh: 5265.8 },
  "Inter-alpha-trypsin inhibitor heavy chain H2": { value: 1375.1, refLow: 945.30, refHigh: 1804.9 },
  "Inter-alpha-trypsin inhibitor heavy chain H4": { value: 1549.6, refLow: 918.70, refHigh: 2180.4 },
  "Intercellular adhesion molecule 1": { value: 6.7500, refLow: 4.2000, refHigh: 9.3000 },
  "Isobutyric acid": { value: 2.2347, refLow: 0.6700, refHigh: 1.9000 },
  "Isoleucine": { value: 29.23, refLow: 39.90, refHigh: 84.50 },
  "Kallistatin": { value: 160.73, refLow: 54.00, refHigh: 137.30 },
  "Kininogen-1": { value: 2824.1, refLow: 1265.6, refHigh: 2473.3 },
  "Kynurenine": { value: 3.6083, refLow: 1.6000, refHigh: 3.4000 },
  "L-selectin": { value: 46.00, refLow: 24.30, refHigh: 67.70 },
  "Lactic acid": { value: 86.39, refLow: 692.00, refHigh: 2276.4 },
  "Leucine": { value: 62.36, refLow: 80.30, refHigh: 173.10 },
  "Leucine-rich alpha-2-glycoprotein 1": { value: 438.85, refLow: 198.50, refHigh: 679.20 },
  "Lipopolysaccharide-binding protein": { value: 117.85, refLow: 24.60, refHigh: 95.00 },
  "Lumican": { value: 110.28, refLow: 189.40, refHigh: 449.60 },
  "Lysine": { value: 257.82, refLow: 116.60, refHigh: 250.70 },
  "Lysozyme C": { value: 78.45, refLow: 43.30, refHigh: 113.60 },
  "Mannan-binding lectin serine protease 2": { value: 24.77, refLow: 26.20, refHigh: 45.20 },
  "Mannose-binding protein C": { value: 58.55, refLow: 26.60, refHigh: 90.50 },
  "Methionine": { value: 37.99, refLow: 16.30, refHigh: 31.80 },
  "Methionine-Sulfoxide": { value: 0.0791, refLow: 0.3900, refHigh: 1.1000 },
  "Methylhistidine": { value: 37.20, refLow: 6.0000, refHigh: 68.40 },
  "Methylmalonic acid": { value: 0.0940, refLow: 0.0380, refHigh: 0.1500 },
  "Nitro-Tyrosine": { value: 0.0218, refLow: 0.00670, refHigh: 0.0370 },
  "Ornithine": { value: 72.90, refLow: 46.60, refHigh: 99.20 },
  "PC aa C32:2": { value: 3.5000, refLow: 1.8000, refHigh: 5.2000 },
  "PC aa C36:0": { value: 8.0000, refLow: 4.5000, refHigh: 11.50 },
  "PC aa C36:6": { value: 1.4850, refLow: 0.5700, refHigh: 2.4000 },
  "PC aa C38:0": { value: 0.3586, refLow: 2.3000, refHigh: 7.2000 },
  "PC aa C38:6": { value: 99.05, refLow: 46.50, refHigh: 151.60 },
  "PC aa C40:1": { value: 0.4022, refLow: 0.4400, refHigh: 0.9700 },
  "PC aa C40:2": { value: 0.6150, refLow: 0.3300, refHigh: 0.9000 },
  "PC aa C40:6": { value: 51.01, refLow: 13.20, refHigh: 41.50 },
  "PC ae C36:0": { value: 1.3800, refLow: 0.6600, refHigh: 2.1000 },
  "PC ae C40:6": { value: 5.5500, refLow: 2.8000, refHigh: 8.3000 },
  "Para-hydroxyhippuric acid": { value: 0.0810, refLow: 0.0220, refHigh: 0.1400 },
  "Peroxiredoxin-2": { value: 0, refLow: 8.9000, refHigh: 56.60 },
  "Phenylalanine": { value: 59.75, refLow: 44.20, refHigh: 75.30 },
  "Phenylethylamine": { value: 0.000582, refLow: 0, refHigh: 0.000490 },
  "Phosphatidylinositol-glycan-specific phospholipase D": { value: 4.9632, refLow: 36.90, refHigh: 113.10 },
  "Phospholipid transfer protein": { value: 49.45, refLow: 29.20, refHigh: 69.70 },
  "Pigment epithelium-derived factor": { value: 236.40, refLow: 145.10, refHigh: 327.70 },
  "Plasma protease C1 inhibitor": { value: 1562.6, refLow: 1023.8, refHigh: 2101.3 },
  "Plasma serine protease inhibitor": { value: 121.75, refLow: 66.80, refHigh: 176.70 },
  "Plasminogen": { value: 476.80, refLow: 297.30, refHigh: 656.30 },
  "Plastin-2": { value: 12.50, refLow: 21.20, refHigh: 47.40 },
  "Pregnancy zone protein": { value: 0, refLow: 41.70, refHigh: 754.50 },
  "Probable G-protein coupled receptor 116": { value: 2.5000, refLow: 1.2000, refHigh: 3.8000 },
  "Proline": { value: 200.55, refLow: 109.20, refHigh: 291.90 },
  "Proline-Betaine": { value: 10.45, refLow: 1.1000, refHigh: 19.80 },
  "Propionic acid": { value: 0.2532, refLow: 0.7100, refHigh: 1.7000 },
  "Protein AMBP": { value: 830.80, refLow: 338.10, refHigh: 1323.5 },
  "Protein S100-A9": { value: 41.67, refLow: 6.8000, refHigh: 36.60 },
  "Protein Z-dependent protease inhibitor": { value: 35.75, refLow: 21.80, refHigh: 49.70 },
  "Proteoglycan 4": { value: 109.68, refLow: 16.90, refHigh: 94.00 },
  "Prothrombin": { value: 1151.0, refLow: 761.10, refHigh: 1540.8 },
  "Putrescine": { value: 0.3545, refLow: 0.1200, refHigh: 0.3300 },
  "Pyruvic acid": { value: 154.37, refLow: 38.90, refHigh: 116.80 },
  "Retinol-binding protein 4": { value: 705.30, refLow: 866.50, refHigh: 2446.0 },
  "SM (OH) C14:1": { value: 6.9500, refLow: 3.5000, refHigh: 10.40 },
  "SM (OH) C16:1": { value: 4.7500, refLow: 2.5000, refHigh: 7.0000 },
  "SM (OH) C22:1": { value: 12.65, refLow: 7.5000, refHigh: 17.80 },
  "SM (OH) C22:2": { value: 15.97, refLow: 5.8000, refHigh: 15.10 },
  "SM (OH) C24:1": { value: 1.7500, refLow: 1.0000, refHigh: 2.5000 },
  "SM C16:0": { value: 124.65, refLow: 78.30, refHigh: 171.00 },
  "SM C16:1": { value: 17.95, refLow: 10.10, refHigh: 25.80 },
  "SM C18:0": { value: 26.30, refLow: 15.20, refHigh: 37.40 },
  "SM C18:1": { value: 12.20, refLow: 6.4000, refHigh: 18.00 },
  "SM C20:2": { value: 0.2273, refLow: 0.2600, refHigh: 0.8000 },
  "Sarcosine": { value: 11.75, refLow: 2.4000, refHigh: 21.10 },
  "Serine": { value: 115.30, refLow: 81.70, refHigh: 148.90 },
  "Serotonin": { value: 0.7000, refLow: 0.2000, refHigh: 1.2000 },
  "Serotransferrin": { value: 17958.3, refLow: 11558.2, refHigh: 24358.4 },
  "Serum albumin": { value: 481921.8, refLow: 342711.6, refHigh: 621132.0 },
  "Serum amyloid A-1 protein": { value: 60.45, refLow: 34.60, refHigh: 86.30 },
  "Serum amyloid A-4 protein": { value: 1346.2, refLow: 593.80, refHigh: 2098.6 },
  "Serum amyloid P-component": { value: 1292.1, refLow: 241.00, refHigh: 936.20 },
  "Serum paraoxonase/arylesterase 1": { value: 313.67, refLow: 416.50, refHigh: 1351.6 },
  "Sex hormone-binding globulin": { value: 220.98, refLow: 20.40, refHigh: 170.00 },
  "Spermidine": { value: 0.3813, refLow: 0.1200, refHigh: 0.3000 },
  "Spermine": { value: 0.2456, refLow: 0.1500, refHigh: 0.2200 },
  "Succinic acid": { value: 1.1260, refLow: 2.3000, refHigh: 5.7000 },
  "TMAO": { value: 8.6000, refLow: 1.1000, refHigh: 16.10 },
  "Taurine": { value: 65.90, refLow: 33.10, refHigh: 98.70 },
  "Tenascin": { value: 4.0000, refLow: 2.4000, refHigh: 5.6000 },
  "Tetranectin": { value: 371.78, refLow: 129.20, refHigh: 297.70 },
  "Threonine": { value: 30.24, refLow: 87.40, refHigh: 192.80 },
  "Thrombospondin-1": { value: 109.34, refLow: 7.4000, refHigh: 100.80 },
  "Thyroxine-binding globulin": { value: 56.79, refLow: 158.20, refHigh: 407.30 },
  "Transthyretin": { value: 538.50, refLow: 197.70, refHigh: 879.30 },
  "Trigonelline": { value: 0.8900, refLow: 0.1800, refHigh: 1.6000 },
  "Tryptophan": { value: 61.75, refLow: 42.30, refHigh: 81.20 },
  "Tyramine": { value: 0.00475, refLow: 0, refHigh: 0.00950 },
  "Tyrosine": { value: 63.65, refLow: 38.90, refHigh: 88.40 },
  "Uric acid": { value: 337.50, refLow: 199.30, refHigh: 475.70 },
  "Valine": { value: 359.29, refLow: 162.40, refHigh: 318.50 },
  "Vasorin": { value: 19.68, refLow: 7.3000, refHigh: 17.20 },
  "Vitamin D-binding protein": { value: 2535.9, refLow: 1704.2, refHigh: 3367.7 },
  "Vitamin K-dependent protein S": { value: 292.30, refLow: 173.40, refHigh: 411.20 },
  "Vitamin K-dependent protein Z": { value: 136.78, refLow: 21.90, refHigh: 129.70 },
  "Vitronectin": { value: 3312.1, refLow: 1909.6, refHigh: 4714.5 },
  "Xaa-Pro dipeptidase": { value: 0, refLow: 3.1000, refHigh: 10.90 },
  "Zinc-alpha-2-glycoprotein": { value: 0, refLow: 64.00, refHigh: 582.50 },
  "alpha-Aminoadipic acid": { value: 0.1141, refLow: 0.2300, refHigh: 2.2000 },
  "alpha-Ketoglutaric acid": { value: 4.9183, refLow: 6.8000, refHigh: 12.40 },
  "beta-Hydroxybutyric acid": { value: 136.80, refLow: 22.80, refHigh: 250.80 },
  "lysoPC a C14:0": { value: 4.9500, refLow: 2.1000, refHigh: 7.8000 },
  "lysoPC a C16:0": { value: 44.57, refLow: 50.60, refHigh: 108.30 },
  "lysoPC a C16:1": { value: 2.3500, refLow: 1.1000, refHigh: 3.6000 },
  "lysoPC a C17:0": { value: 1.7100, refLow: 0.9200, refHigh: 2.5000 },
  "lysoPC a C18:0": { value: 43.24, refLow: 15.00, refHigh: 40.90 },
  "lysoPC a C18:1": { value: 43.80, refLow: 12.00, refHigh: 36.30 },
  "lysoPC a C18:2": { value: 1.3191, refLow: 15.40, refHigh: 51.80 },
  "lysoPC a C20:3": { value: 0.5468, refLow: 1.1000, refHigh: 4.0000 },
  "lysoPC a C20:4": { value: 0, refLow: 2.7000, refHigh: 9.9000 },
  "lysoPC a C24:0": { value: 0.0774, refLow: 0.0880, refHigh: 0.2300 },
  "lysoPC a C26:0": { value: 0.8950, refLow: 0.4900, refHigh: 1.3000 },
  "lysoPC a C26:1": { value: 0.1175, refLow: 0.0650, refHigh: 0.1700 },
  "lysoPC a C28:0": { value: 0.8449, refLow: 0.3300, refHigh: 0.8200 },
  "lysoPC a C28:1": { value: 0.4500, refLow: 0.2300, refHigh: 0.6700 },
  "trans-OH-Proline": { value: 10.55, refLow: 4.6000, refHigh: 16.50 },
  "von Willebrand Factor": { value: 20.80, refLow: 8.0000, refHigh: 33.60 },
};

// Legacy alias — kept so any references resolve (points to healthy)
const DEMO_MARKERS = DEMO_MARKERS_HEALTHY;

const DEMO_IDS = ["DEMO-healthy", "DEMO-typical", "DEMO-unhealthy"];
const DEMO_CLIENT_ID = "DEMO-healthy"; // default selection

function makePersona(id, markers) {
  return { id, markers: Object.fromEntries(Object.entries(markers).map(([n, v]) => [n, { value: v.value, refLow: v.refLow, refHigh: v.refHigh }])) };
}
const DEMO_HEALTHY   = makePersona("DEMO-healthy",   DEMO_MARKERS_HEALTHY);
const DEMO_TYPICAL   = makePersona("DEMO-typical",   DEMO_MARKERS_TYPICAL);
const DEMO_UNHEALTHY = makePersona("DEMO-unhealthy", DEMO_MARKERS_UNHEALTHY);
const DEMO_CLIENT = DEMO_HEALTHY; // legacy alias

const DEMO_PERSONAS = [
  { id: "DEMO-healthy",   label: "✦ Biscuit — Optimal Health",  sub: "All 286 biomarkers in the green zone",           client: DEMO_HEALTHY },
  { id: "DEMO-typical",   label: "✦ Waffles — Typical Adult",  sub: "~25% of biomarkers outside reference range",     client: DEMO_TYPICAL },
  { id: "DEMO-unhealthy", label: "✦ Noodle — At Risk",         sub: "~50% of biomarkers outside reference range",     client: DEMO_UNHEALTHY },
];

// ─── Scoring ──────────────────────────────────────────────────────────────────
function calcZone(v, lo, hi, gp = 0.05) {
  const rng = hi - lo, gL = lo + gp * rng, gH = hi - gp * rng;
  const yL = lo - gp * rng, yH = hi + gp * rng;
  if (v >= gL && v <= gH) return "green";
  if (v >= yL && v <= yH) return "yellow";
  return "red";
}


function procZone(score) {
  if (score === null) return null;
  if (score >= 91) return "green";
  if (score >= 70) return "yellow";
  return "red";
}

function scoreBM(v, lo, hi, cutoff = 0.5, gp = 0.05, curve = "linear") {
  const rng = hi - lo; if (rng <= 0) return null;
  const gL = lo + gp * rng, gH = hi - gp * rng;
  if (v >= gL && v <= gH) return 100;
  const dist = v > gH ? (v - gH) / rng : (gL - v) / rng;
  const t = Math.max(0, Math.min(1, dist / cutoff));
  let s = curve === "linear" ? 100 * (1 - t)
    : curve === "sqrt" ? 100 * (1 - Math.sqrt(t))
    : Math.max(0, 100 * (1 - 1 / (1 + Math.exp(-8 * (t - 0.5)))) * 2);
  return Math.max(0, Math.min(100, s));
}


// Colour for process/system scores using the defined zone thresholds
function procColour(s) {
  if (s == null) return C.textFaint;
  if (s >= 91) return C.teal;
  if (s >= 70) return C.fair;
  return C.critical;
}

function wavg(pairs) {
  const tw = pairs.reduce((s, [, w]) => s + w, 0);
  return tw ? pairs.reduce((s, [v, w]) => s + v * w, 0) / tw : 0;
}

// effectiveWeight: if the biomarker has an explicit entry and its colour/level
// conditions are met, apply the manual weight (overrides global colour multiplier).
// If no explicit entry exists, fall back to the global colour multiplier.
function effectiveWeight(entry, hasEntry, zone, status, yellowW, redW) {
  if (!hasEntry) {
    const zm = zone === "yellow" ? yellowW : zone === "red" ? redW : 1.0;
    return zm;
  }
  const w = typeof entry === "object" ? entry.weight : entry;
  const color = typeof entry === "object" ? (entry.color ?? "both") : "both";
  const level = typeof entry === "object" ? (entry.level ?? "both") : "both";
  const colorMatch = color === "both"
    || (color === "red"    && zone === "red")
    || (color === "yellow" && zone === "yellow");
  const levelMatch = level === "both"
    || (level === "high" && status === "HIGH")
    || (level === "low"  && status === "LOW");
  if (colorMatch && levelMatch) return w; // manual override applies
  // Conditions not met — fall back to global colour multiplier
  const zm = zone === "yellow" ? yellowW : zone === "red" ? redW : 1.0;
  return zm;
}

function computeSystem(sys, markers, bioW, procW, cutoff, gp, curve, yellowW, redW) {
  const procResults = Object.entries(sys.processes).map(([proc, bms]) => {
    const scored = bms.map(name => {
      const key = ALIASES[name] ?? name;
      const m = markers[key] ?? markers[name];
      if (!m) return { name, missing: true, weight: (bioW[name]?.weight ?? 1), entry: bioW[name] ?? { ...DEFAULT_BIO_ENTRY } };
      const s = scoreBM(m.value, m.refLow, m.refHigh, cutoff, gp, curve);
      const zone = calcZone(m.value, m.refLow, m.refHigh, gp);
      const rng = m.refHigh - m.refLow, gL = m.refLow + gp * rng, gH = m.refHigh - gp * rng;
      const hasEntry = name in bioW;
      const entry  = bioW[name] ?? DEFAULT_BIO_ENTRY;
      const manualW = typeof entry === "object" ? entry.weight : entry;
      const status  = m.value > gH ? "HIGH" : m.value < gL ? "LOW" : "NORMAL";
      const effW = effectiveWeight(entry, hasEntry, zone, status, yellowW, redW);
      return {
        name, value: m.value, refLow: m.refLow, refHigh: m.refHigh,
        score: s, zone, weight: manualW, effWeight: effW, missing: false,
        status, entry,
      };
    });
    const valid = scored.filter(b => !b.missing);
    const score = valid.length ? wavg(valid.map(b => [b.score, b.effWeight])) : null;
    return { process: proc, score, biomarkers: scored };
  });
  const valid = procResults.filter(p => p.score !== null);
  const sysScore = valid.length ? wavg(valid.map(p => {
    const hasProcEntry = p.process in procW;
    const pe = procW[p.process] ?? DEFAULT_PROC_ENTRY;
    const pw     = typeof pe === "object" ? (pe.weight ?? 1) : pe;
    const pcolor = typeof pe === "object" ? (pe.color  ?? "red") : "red";
    const pzone  = procZone(p.score);
    const colorMatch = pcolor === "both"
      || (pcolor === "red"    && pzone === "red")
      || (pcolor === "yellow" && pzone === "yellow")
      || (pcolor === "green"  && pzone === "green");
    const effPw = hasProcEntry && colorMatch ? pw : 1;
    return [p.score, effPw];
  })) : null;
  return { procResults, sysScore };
}

// ─── CSV parsing ──────────────────────────────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split("\n"), headers = lines[0].split(",").map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = line.split(",");
    return Object.fromEntries(headers.map((h, i) => [h, vals[i]?.trim() ?? ""]));
  });
}
function buildClients(rows) {
  const pts = {};
  for (const row of rows) {
    const pid = row["my_id"]; if (!pid) continue;
    if (!pts[pid]) pts[pid] = { id: pid, markers: {} };
    const name = row["measure_name"]?.trim();
    const conc = parseFloat(row["lab_concentration"]);
    const lo = parseFloat(row["lower_reference_range"]);
    const hi = parseFloat(row["upper_reference_range"]);
    if (name && !isNaN(conc) && !isNaN(lo) && !isNaN(hi))
      pts[pid].markers[name] = { value: conc, refLow: lo, refHigh: hi };
  }
  return pts;
}

// ─── Stats helpers ────────────────────────────────────────────────────────────
function stats(arr) {
  const a = arr.filter(x => x != null).sort((a, b) => a - b);
  if (!a.length) return null;
  const n = a.length, mean = a.reduce((s, v) => s + v, 0) / n;
  const median = n % 2 === 0 ? (a[n / 2 - 1] + a[n / 2]) / 2 : a[Math.floor(n / 2)];
  const sd = Math.sqrt(a.reduce((s, v) => s + (v - mean) ** 2, 0) / n);
  return { n, mean, median, sd, min: a[0], max: a[n - 1] };
}

// ─── Atoms ────────────────────────────────────────────────────────────────────
function ArcGauge({ score, size = 64, label }) {
  const col = procColour(score), r = size * 0.37, cx = size / 2, cy = size / 2, circ = 2 * Math.PI * r;
  const dash = ((score ?? 0) / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.iceLight} strokeWidth={size * 0.09} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={score != null ? col : C.iceMid}
          strokeWidth={size * 0.09} strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: "stroke-dasharray 0.5s ease" }} />
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
          fill={score != null ? col : C.textFaint} fontSize={size * 0.23} fontWeight="700" fontFamily={T.body}>
          {score != null ? Math.round(score) : "—"}
        </text>
      </svg>
      {label && <div style={{ fontSize: 10, color: C.textFaint, letterSpacing: "0.12em", textTransform: "uppercase" }}>{label}</div>}
    </div>
  );
}


function ScoreBar({ score, h = 4, colour }) {
  const col = colour ?? procColour(score ?? 0);
  return <div style={{ height: h, background: C.iceLight, borderRadius: h, overflow: "hidden" }}>
    <div style={{ height: "100%", width: `${score ?? 0}%`, background: col, borderRadius: h, transition: "width 0.4s" }} />
  </div>;
}

function ZoneDot({ zone }) {
  const col = zone === "green" ? C.teal : zone === "yellow" ? C.fair : C.critical;
  return <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: col, flexShrink: 0 }} />;
}

function RangeBar({ value, refLow, refHigh, greenPct = 0.05 }) {
  const rng = refHigh - refLow, gL = refLow + greenPct * rng, gH = refHigh - greenPct * rng;
  const margin = rng * 0.8, dMin = Math.max(0, refLow - margin), dMax = refHigh + margin, dRng = dMax - dMin;
  const pct = v => Math.max(0, Math.min(100, ((v - dMin) / dRng) * 100));
  const vp = pct(value), glp = pct(gL), ghp = pct(gH), rlp = pct(refLow), rhp = pct(refHigh);
  const zone = calcZone(value, refLow, refHigh, greenPct);
  const dotCol = zone === "green" ? C.teal : zone === "yellow" ? C.fair : C.critical;
  const status = value < gL ? "Low" : value > gH ? "High" : "Normal";
  return (
    <div style={{ position: "relative", height: 28, marginTop: 6 }}>
      <div style={{ position: "absolute", top: 9, left: 0, right: 0, height: 6, background: C.iceLight, borderRadius: 3 }} />
      <div style={{ position: "absolute", top: 9, left: `${glp}%`, width: `${ghp - glp}%`, height: 6, background: `${C.teal}40`, borderRadius: 3 }} />
      {[rlp, rhp].map((p, i) => <div key={i} style={{ position: "absolute", top: 7, left: `${p}%`, width: 1, height: 10, background: C.steel, opacity: 0.5 }} />)}
      <div style={{ position: "absolute", top: 6, left: `${vp}%`, transform: "translateX(-50%)",
        width: 12, height: 12, borderRadius: "50%", background: dotCol, border: "2px solid white",
        boxShadow: `0 1px 4px ${dotCol}66`, transition: "left 0.3s" }} />
      <div style={{ position: "absolute", top: 21, left: `${vp}%`, transform: "translateX(-50%)",
        fontSize: 9, color: dotCol, fontWeight: 700, whiteSpace: "nowrap" }}>{status}</div>
    </div>
  );
}

function ScoringCurve({ refLow, refHigh, value, cutoff, greenPct, curve }) {
  const rng = refHigh - refLow, margin = rng * 1.0;
  const xMin = Math.max(0, refLow - margin), xMax = refHigh + margin;
  const W = 290, H = 86, pad = { l: 22, r: 6, t: 8, b: 16 };
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
  const sv = (x, y) => [pad.l + ((x - xMin) / (xMax - xMin)) * iW, pad.t + (1 - y / 100) * iH];
  const pts = Array.from({ length: 120 }, (_, i) => { const x = xMin + (i / 119) * (xMax - xMin); return [x, scoreBM(x, refLow, refHigh, cutoff, greenPct, curve)]; });
  const pathD = pts.map(([x, y], i) => { const [sx, sy] = sv(x, y); return `${i === 0 ? "M" : "L"}${sx.toFixed(1)},${sy.toFixed(1)}`; }).join(" ");
  const cs = scoreBM(value, refLow, refHigh, cutoff, greenPct, curve);
  const [cx, cy] = sv(Math.max(xMin, Math.min(xMax, value)), cs);
  const gL = refLow + greenPct * rng, gH = refHigh - greenPct * rng;
  const [glx] = sv(gL, 0), [ghx] = sv(gH, 0), [rlx] = sv(refLow, 0), [rhx] = sv(refHigh, 0);
  const zone = calcZone(value, refLow, refHigh, greenPct);
  const dotCol = zone === "green" ? C.teal : zone === "yellow" ? C.fair : C.critical;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      <rect x={glx} y={pad.t} width={ghx - glx} height={iH} fill={`${C.teal}22`} rx="2" />
      <rect x={rlx} y={pad.t} width={glx - rlx} height={iH} fill={`${C.fair}14`} />
      <rect x={ghx} y={pad.t} width={rhx - ghx} height={iH} fill={`${C.fair}14`} />
      {[0, 50, 100].map(v => { const [, sy] = sv(xMin, v); return (
        <g key={v}><line x1={pad.l} x2={W - pad.r} y1={sy} y2={sy} stroke={C.iceLight} strokeWidth="0.8" />
          <text x={pad.l - 3} y={sy + 3} fontSize="7" fill={C.textFaint} textAnchor="end">{v}</text></g>
      ); })}
      {[[rlx, C.steel, true], [rhx, C.steel, true], [glx, C.teal, false], [ghx, C.teal, false]].map(([x, col, dash], i) => (
        <line key={i} x1={x} y1={pad.t} x2={x} y2={pad.t + iH} stroke={col}
          strokeWidth="0.8" strokeDasharray={dash ? "3,2" : undefined} opacity="0.6" />
      ))}
      <path d={pathD} fill="none" stroke={C.steel} strokeWidth="1.8" />
      <circle cx={cx} cy={cy} r="5" fill={dotCol} stroke="white" strokeWidth="1.5" />
    </svg>
  );
}

function Tooltip({ text, children }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
      onMouseEnter={e => { setVisible(true); setPos({ x: e.clientX, y: e.clientY }); }}
      onMouseMove={e => setPos({ x: e.clientX, y: e.clientY })}
      onMouseLeave={() => setVisible(false)}>
      {children}
      {visible && (
        <div style={{
          position: "fixed", left: pos.x + 12, top: pos.y - 8, zIndex: 999,
          background: C.navy, color: C.iceLight, fontSize: 11, lineHeight: 1.5,
          padding: "7px 11px", borderRadius: 7, maxWidth: 240, pointerEvents: "none",
          boxShadow: "0 4px 16px rgba(24,55,75,0.35)", whiteSpace: "pre-wrap",
        }}>{text}</div>
      )}
    </span>
  );
}

function InfoIcon({ tooltip }) {
  return (
    <Tooltip text={tooltip}>
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 14, height: 14, borderRadius: "50%", background: C.iceMid,
        color: C.navy, fontSize: 9, fontWeight: 700, cursor: "default",
        marginLeft: 5, flexShrink: 0, userSelect: "none" }}>?</span>
    </Tooltip>
  );
}

function Slider({ label, value, min, max, step, onChange, color, fmt, tooltip }) {
  const c = color || C.steel;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, alignItems: "center" }}>
        <span style={{ fontSize: 12, color: C.textSecond, display: "flex", alignItems: "center" }}>
          {label}
          {tooltip && <InfoIcon tooltip={tooltip} />}
        </span>
        <span style={{ fontSize: 12, color: c, fontWeight: 700, fontFamily: T.mono }}>{fmt ? fmt(value) : value.toFixed(2)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", accentColor: c, cursor: "pointer" }} />
    </div>
  );
}

// ─── Default profile factory ──────────────────────────────────────────────────
const DEFAULT_PARAMS = { cutoff: 0.5, greenPct: 0.05, curve: "linear", yellowWeight: 2.0, redWeight: 4.0 };

function makeProfile(id, name, params) {
  return { id, name, bioWeights: makeDefaultBioWeights(), procWeights: makeDefaultProcWeights(), ...DEFAULT_PARAMS, ...(params || {}) };
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [clients,         setClients]         = useState({ "DEMO-healthy": DEMO_HEALTHY, "DEMO-typical": DEMO_TYPICAL, "DEMO-unhealthy": DEMO_UNHEALTHY });
  const [clientId,        setClientId]        = useState(DEMO_CLIENT_ID);
  const [demoLoaded,      setDemoLoaded]      = useState(false);
  const [activeView,      setActiveView]      = useState("aggregate");
  const [systemId,        setSystemId]        = useState("bfvh");
  const [activeProc,      setActiveProc]      = useState(null);
  const [tab,             setTab]             = useState("weights-proc");
  const [uploadErr,       setUploadErr]       = useState("");
  const [dragOver,        setDragOver]        = useState(false);
  const [col1Open,        setCol1Open]        = useState(true);
  const [col2Open,        setCol2Open]        = useState(true);
  const [concOverrides,   setConcOverrides]   = useState({});      // { [clientId]: { [markerName]: value } }
  const [editConc,        setEditConc]        = useState(false);   // unlock toggle
  const [concWarnModal,   setConcWarnModal]   = useState(false);   // warning popup
  const fileRef = useRef();

  const [profiles,        setProfiles]        = useState([makeProfile("default", "Default")]);
  const [activeProfileId, setActiveProfileId] = useState("default");
  const [compareIds,      setCompareIds]      = useState([]);
  const [saveModal,       setSaveModal]       = useState(false);
  const [profileModal,    setProfileModal]    = useState(false);
  const [newName,         setNewName]         = useState("");
  const [editingId,       setEditingId]       = useState(null);
  const [editName,        setEditName]        = useState("");

  const [showTutorial,    setShowTutorial]    = useState(true);
  const [tutorialStep,    setTutorialStep]    = useState(0);
  const [tutorialDone,    setTutorialDone]    = useState({
    procWeightChanged: false, bioWeightChanged: false, curveChanged: false,
    profileSaved: false, profilesSelected: false,
  });
  const [spotlightRect,   setSpotlightRect]   = useState(null);
  const [defaultDirtyModal, setDefaultDirtyModal] = useState(false); // prompt to save before leaving Default
  const [pendingView,      setPendingView]      = useState(null);    // view to switch to after save/discard

  // Scoring params live inside the active profile
  const setParam = useCallback((key, val) => {
    setProfiles(prev => prev.map(p => p.id === activeProfileId ? { ...p, [key]: val } : p));
    if (key === "curve") setTutorialDone(prev => ({ ...prev, curveChanged: true }));
  }, [activeProfileId]);

  // Measure the spotlight target element whenever step or layout changes
  useEffect(() => {
    if (!showTutorial) { setSpotlightRect(null); return; }
    const STEP_TARGETS = [
      "upload-dropzone",     // 0  upload
      null,                  // 1  aggregate explain
      "view-toggle",         // 2  go to client report
      "first-proc-card",     // 3  adjust proc weight
      "tab-bio-weights",     // 4  click bio weights tab
      "first-bio-card",      // 5  adjust bio weight
      "tab-curves",          // 6  click curves tab
      "curve-shape-btns",    // 7  change curve shape
      "save-profile-btn",    // 8  click save profile
      "save-modal-box",      // 9  name and save
      "view-toggle",         // 10 go to aggregate
      "profile-pills",       // 11 select profiles
      "client-tab-second",   // 12 switch to tutorial profile tab
      "client-scores-table", // 13 score deltas explanation
      "manage-profiles-btn", // 14 open manage profiles
      null,                  // 15 clean up info
      null,                  // 16 complete
    ];
    const targetId = STEP_TARGETS[tutorialStep];
    if (!targetId) { setSpotlightRect(null); return; }

    const measure = () => {
      const el = document.querySelector(`[data-tutorial="${targetId}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        setSpotlightRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      } else {
        setSpotlightRect(null);
      }
    };

    measure();
    // Re-measure on scroll / resize
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    const ro = new ResizeObserver(measure);
    const el = document.querySelector(`[data-tutorial="${targetId}"]`);
    if (el) ro.observe(el);
    return () => {
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
      ro.disconnect();
    };
  }, [showTutorial, tutorialStep]);

  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0];
  const { bioWeights, procWeights, cutoff, greenPct, curve, yellowWeight, redWeight } = activeProfile;

  // True when Default profile has been modified from its factory values
  const isDefaultDirty = activeProfileId === "default" && (() => {
    if (cutoff !== DEFAULT_PARAMS.cutoff || greenPct !== DEFAULT_PARAMS.greenPct ||
        curve !== DEFAULT_PARAMS.curve || yellowWeight !== DEFAULT_PARAMS.yellowWeight ||
        redWeight !== DEFAULT_PARAMS.redWeight) return true;
    const isNonDefaultBio  = Object.values(bioWeights).some(e =>
      (e?.weight ?? 1) !== 1 || (e?.color ?? "red") !== "red" || (e?.level ?? "high") !== "high");
    const isNonDefaultProc = Object.values(procWeights).some(e =>
      (e?.weight ?? 1) !== 1 || (e?.color ?? "red") !== "red");
    if (isNonDefaultBio || isNonDefaultProc) return true;
    return false;
  })();
  const setCutoff      = useCallback(v => setParam("cutoff",      v), [setParam]);
  const setGreenPct    = useCallback(v => setParam("greenPct",    v), [setParam]);
  const setCurve       = useCallback(v => setParam("curve",       v), [setParam]);
  const setYellowWeight= useCallback(v => setParam("yellowWeight",v), [setParam]);
  const setRedWeight   = useCallback(v => setParam("redWeight",   v), [setParam]);

  const setBioWeights  = useCallback(fn => {
    setProfiles(prev => prev.map(p => p.id === activeProfileId ? { ...p, bioWeights: fn(p.bioWeights) } : p));
    setTutorialDone(prev => ({ ...prev, bioWeightChanged: true }));
  }, [activeProfileId]);
  const setProcWeights = useCallback(fn => {
    setProfiles(prev => prev.map(p => p.id === activeProfileId ? { ...p, procWeights: fn(p.procWeights) } : p));
    setTutorialDone(prev => ({ ...prev, procWeightChanged: true }));
  }, [activeProfileId]);
  const resetWeights   = useCallback(() => {
    if (!window.confirm("Reset all weights and concentration overrides for this profile and client? This cannot be undone.")) return;
    setProfiles(prev => prev.map(p => p.id === activeProfileId
      ? { ...p, bioWeights: makeDefaultBioWeights(), procWeights: makeDefaultProcWeights(), ...DEFAULT_PARAMS }
      : p));
    setConcOverrides(prev => { const n = { ...prev }; delete n[clientId]; return n; });
    setEditConc(false);
  }, [activeProfileId, clientId]);

  const saveProfile = useCallback(() => {
    const id = `p_${Date.now()}`, name = newName.trim() || `Profile ${profiles.length + 1}`;
    setProfiles(prev => {
      const updated = [...prev, { id, name, bioWeights: { ...bioWeights }, procWeights: { ...procWeights }, cutoff, greenPct, curve, yellowWeight, redWeight }];
      // If saving from Default, reset Default back to factory values
      return updated.map(p => p.id === "default"
        ? { ...p, bioWeights: makeDefaultBioWeights(), procWeights: makeDefaultProcWeights(), ...DEFAULT_PARAMS }
        : p);
    });
    setNewName(""); setSaveModal(false);
    setActiveProfileId(id);
    setTutorialDone(prev => ({ ...prev, profileSaved: true }));
    setTutorialStep(prev => prev === 9 ? 10 : prev);
    // If we got here via the dirty-default prompt, now navigate to the pending view
    if (pendingView) {
      setActiveView(pendingView);
      if (pendingView === "aggregate") setTutorialStep(prev => prev === 10 ? 11 : prev);
      setPendingView(null);
    }
  }, [newName, profiles.length, bioWeights, procWeights, cutoff, greenPct, curve, yellowWeight, redWeight, pendingView]);

  const duplicateProfile = useCallback(id => {
    const src = profiles.find(p => p.id === id); if (!src) return;
    const newId = `p_${Date.now()}`;
    const dup = { ...src, id: newId, name: src.name + " (copy)",
      bioWeights: { ...src.bioWeights }, procWeights: { ...src.procWeights } };
    setProfiles(prev => [...prev, dup]);
    setActiveProfileId(newId);
  }, [profiles]);

  const deleteProfile = useCallback(id => {
    if (id === "default" || profiles.length <= 1) return;
    setProfiles(prev => prev.filter(p => p.id !== id));
    setCompareIds(prev => prev.filter(x => x !== id));
    if (activeProfileId === id) setActiveProfileId(profiles.find(p => p.id !== id)?.id || "default");
  }, [profiles, activeProfileId]);

  const renameProfile = useCallback((id, name) => {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, name: name.trim() || p.name } : p));
  }, []);

  const exportProfile = useCallback((p) => {
    const rows = [];
    const header = ["MYCO_ID","CATEGORY","HEALTH_AREA_TYPE","HEALTH_AREA_ID","HEALTH_AREA_NAME","MEASURE_ID","ITEM_NAME","COLOR","LEVEL","VALUE","REFERENCES"];
    // Biomarker weights — all explicitly set entries
    SYSTEMS.forEach(sys => {
      Object.entries(sys.processes).forEach(([proc, bms]) => {
        bms.forEach(bmName => {
          const e = p.bioWeights[bmName];
          if (!e) return;
          rows.push([
            "",                    // MYCO_ID — leave blank
            "biomarker_weight",
            "",                    // HEALTH_AREA_TYPE
            "",                    // HEALTH_AREA_ID
            sys.name,              // HEALTH_AREA_NAME
            "",                    // MEASURE_ID — leave blank
            bmName,                // ITEM_NAME
            e.color ?? "red",
            e.level ?? "high",
            e.weight,
            e.ref ?? "",
          ]);
        });
      });
    });
    // Process weights — all explicitly set entries
    SYSTEMS.forEach(sys => {
      Object.keys(sys.processes).forEach(proc => {
        const e = p.procWeights[proc];
        if (!e) return;
        rows.push([
          "",
          "process_weight",
          "", "",
          sys.name,
          "",
          proc,
          e.color ?? "red",
          "",                      // LEVEL — blank for processes
          e.weight,
          e.ref ?? "",
        ]);
      });
    });
    if (rows.length === 0) { alert("No non-default weights to export for this profile."); return; }
    const csv = [header, ...rows].map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = p.name.replace(/[\s]+/g, "_") + "_weights.csv"; a.click();
    URL.revokeObjectURL(url);
  }, []);

  const loadDemo = useCallback((personaId = "DEMO-healthy") => {
    setClientId(personaId);
    setDemoLoaded(true);
    setUploadErr("");
    setActiveView("aggregate");
    setTutorialStep(prev => prev === 0 ? 1 : prev);
  }, []);

  const handleFile = useCallback(file => {
    if (!file) return;
    const r = new FileReader();
    r.onload = e => {
      try {
        const d = buildClients(parseCSV(e.target.result));
        if (!Object.keys(d).length) throw new Error("No valid rows.");
        setClients(prev => ({ "DEMO-healthy": DEMO_HEALTHY, "DEMO-typical": DEMO_TYPICAL, "DEMO-unhealthy": DEMO_UNHEALTHY, ...prev, ...d }));
        setClientId(Object.keys(d)[0]);
        setUploadErr("");
        // Tutorial: advance past "upload" step when data loads
        setTutorialStep(prev => prev === 0 ? 1 : prev);
      } catch (err) { setUploadErr("Parse error: " + err.message); }
    };
    r.readAsText(file);
  }, []);

  const system  = SYSTEMS.find(s => s.id === systemId) || SYSTEMS[0];
  const markers = useMemo(() => {
    if (!clientId || !clients[clientId]) return {};
    const base = clients[clientId].markers;
    const overrides = concOverrides[clientId] ?? {};
    if (!Object.keys(overrides).length) return base;
    const merged = { ...base };
    Object.entries(overrides).forEach(([name, val]) => {
      if (merged[name]) merged[name] = { ...merged[name], value: val };
    });
    return merged;
  }, [clientId, clients, concOverrides]);
  const selProc = activeProc || Object.keys(system.processes)[0];

  const { procResults, sysScore } = useMemo(() => {
    if (!Object.keys(markers).length) return { procResults: [], sysScore: null };
    return computeSystem(system, markers, bioWeights, procWeights, cutoff, greenPct, curve, yellowWeight, redWeight);
  }, [system, markers, bioWeights, procWeights, cutoff, greenPct, curve, yellowWeight, redWeight]);

  const allSysScores = useMemo(() => SYSTEMS.map(s => ({
    id: s.id, name: s.name,
    score: Object.keys(markers).length
      ? computeSystem(s, markers, bioWeights, procWeights, cutoff, greenPct, curve, yellowWeight, redWeight).sysScore
      : null
  })), [markers, bioWeights, procWeights, cutoff, greenPct, curve, yellowWeight, redWeight]);

  const aggregateData = useMemo(() => {
    const pids = Object.keys(clients); if (!pids.length) return null;
    // Preserve compareIds selection order so first-selected = baseline
    const show = compareIds.length
      ? compareIds.map(id => profiles.find(p => p.id === id)).filter(Boolean)
      : [activeProfile];
    return show.map(prof => ({
      profile: prof,
      clients: pids.map(pid => {
        const m = clients[pid].markers;
        const syss = SYSTEMS.map(s => {
          const res = computeSystem(s, m, prof.bioWeights, prof.procWeights,
            prof.cutoff ?? DEFAULT_PARAMS.cutoff,
            prof.greenPct ?? DEFAULT_PARAMS.greenPct,
            prof.curve ?? DEFAULT_PARAMS.curve,
            prof.yellowWeight ?? DEFAULT_PARAMS.yellowWeight,
            prof.redWeight ?? DEFAULT_PARAMS.redWeight);
          return { id: s.id, name: s.name, score: res.sysScore };
        });
        return { pid, systems: syss };
      })
    }));
  }, [clients, profiles, compareIds, activeProfile]);

  const activeProcResult = procResults.find(p => p.process === selProc);

  const oorFlags = useMemo(() => {
    const f = [];
    procResults.forEach(pr => {
      const sys = SYSTEMS.find(s => Object.keys(s.processes).includes(pr.process));
      pr.biomarkers.forEach(bm => {
        if (!bm.missing && bm.zone !== "green")
          f.push({ ...bm, process: pr.process, system: sys?.name ?? "", systemId: sys?.id ?? "" });
      });
    });
    return f.sort((a, b) => a.score - b.score);
  }, [procResults]);

  const adjustmentCount = useMemo(() => {
    const bioAdj = Object.entries(bioWeights).filter(([, e]) =>
      (e?.weight ?? 1) !== 1 || (e?.color ?? "red") !== "red" || (e?.level ?? "high") !== "high").length;
    const procAdj = Object.entries(procWeights).filter(([, e]) =>
      (e?.weight ?? 1) !== 1 || (e?.color ?? "red") !== "red").length;
    return bioAdj + procAdj;
  }, [bioWeights, procWeights]);

  const TABS = [
    { key: "weights-proc",  label: "Process Weights" },
    { key: "weights-bio",   label: "Biomarker Weights" },
    { key: "curves",        label: "Biomarker Curves" },
    { key: "flags",         label: `Biomarker Flags${oorFlags.length ? ` (${oorFlags.length})` : ""}` },
    { key: "adjustments",   label: `Active Adjustments${adjustmentCount ? ` (${adjustmentCount})` : ""}` },
  ];

  const hasData = demoLoaded || Object.keys(clients).some(k => !DEMO_IDS.includes(k));
  const card = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, boxShadow: "0 1px 4px rgba(24,55,75,0.04)" };

  return (
    <div style={{ minHeight: "100vh", background: C.white, fontFamily: T.body, color: C.textPrimary, display: "flex", flexDirection: "column" }}>

      {/* ── Top bar ── */}
      <div style={{ background: C.navy, height: 50, display: "flex", alignItems: "center",
        padding: "0 22px", gap: 14, flexShrink: 0, zIndex: 20, boxShadow: "0 2px 10px rgba(24,55,75,0.2)" }}>
        <span style={{ fontSize: 20, color: C.teal, fontFamily: T.display, fontStyle: "italic" }}>my</span>
        <div style={{ width: 1, height: 20, background: "#ffffff22" }} />
        <span style={{ fontSize: 10, color: C.iceLight, letterSpacing: "0.18em", textTransform: "uppercase" }}>Scoring Workbench</span>
        <div data-tutorial="view-toggle" style={{ display: "flex", background: "#1a3e55", borderRadius: 6, padding: 2, marginLeft: 8 }}>
          {[["client", "Client Report"], ["aggregate", "Aggregate Statistics"]].map(([v, l]) => (
            <button key={v} onClick={() => {
              // If Default profile has unsaved changes and user is heading to Aggregate, intercept
              if (v === "aggregate" && isDefaultDirty) {
                setPendingView("aggregate");
                setDefaultDirtyModal(true);
                return;
              }
              setActiveView(v);
              // Tutorial: step 2 waits for user to click Client Report; step 5 waits for Aggregate
              if (v === "client")    setTutorialStep(prev => prev === 2 ? 3 : prev);
              if (v === "aggregate") setTutorialStep(prev => prev === 10 ? 11 : prev);
            }} style={{ padding: "4px 12px", fontSize: 11,
              borderRadius: 5, border: "none", cursor: "pointer", fontFamily: T.body,
              background: activeView === v ? C.teal : "transparent",
              color: activeView === v ? C.navy : C.iceMid,
              fontWeight: activeView === v ? 700 : 400, transition: "all 0.15s" }}>{l}</button>
          ))}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <select data-tutorial="profile-selector" value={activeProfileId} onChange={e => setActiveProfileId(e.target.value)}
            style={{ background: "#1e4560", border: `1px solid #2d607e`, color: C.iceLight,
              padding: "4px 8px", borderRadius: 6, fontSize: 11, cursor: "pointer", maxWidth: 150 }}>
            {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button data-tutorial="save-profile-btn" onClick={() => { setSaveModal(true); setTutorialStep(prev => prev === 8 ? 9 : prev); }} style={{ background: "transparent", border: `1px solid #2d607e`, color: C.iceMid, padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>Save Profile</button>
          <button data-tutorial="manage-profiles-btn" onClick={() => { setEditingId(null); setProfileModal(true); setTutorialStep(prev => prev === 14 ? 15 : prev); }} style={{ background: "transparent", border: `1px solid #2d607e`, color: C.iceMid, padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>Manage Profiles</button>
          <button onClick={resetWeights} style={{ background: "transparent", border: `1px solid #2d607e`, color: C.iceMid, padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>↺ Reset</button>
          <button onClick={() => { setTutorialStep(0); setShowTutorial(true); }} title="Show tutorial"
            style={{ background: "transparent", border: `1px solid #2d607e`, color: C.iceMid, padding: "4px 9px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 700 }}>?</button>
          {hasData && <select value={clientId} onChange={e => setClientId(e.target.value)}
            style={{ background: "#1e4560", border: `1px solid #2d607e`, color: C.iceLight, padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>
            {Object.keys(clients).map(pid => {
              const persona = DEMO_PERSONAS.find(p => p.id === pid);
              const label = persona ? persona.label.replace("✦ ", "") : pid;
              return <option key={pid} value={pid}>{label}</option>;
            })}
          </select>}
          <button onClick={() => fileRef.current?.click()} style={{ background: C.teal, border: "none", color: C.navy, padding: "5px 14px", borderRadius: 6, fontSize: 11, cursor: "pointer", fontWeight: 700 }}>
            {hasData ? "+ Data" : "Upload Data"}
          </button>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
        </div>
      </div>

      {/* ── Concentration edit warning modal ── */}
      {concWarnModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(24,55,75,0.6)", zIndex: 600,
          display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setConcWarnModal(false)}>
          <div style={{ background: C.surface, borderRadius: 14, width: 420, padding: 0,
            boxShadow: "0 12px 48px rgba(24,55,75,0.35)", overflow: "hidden" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ background: C.navy, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <span style={{ fontFamily: T.display, fontSize: 15, color: C.iceLight }}>Edit Concentrations</span>
            </div>
            <div style={{ padding: "20px 24px 24px" }}>
              <p style={{ fontSize: 13, color: C.textSecond, lineHeight: 1.7, marginBottom: 20 }}>
                You are about to unlock concentration editing. This lets you test how different
                values affect scoring, but <strong>these are not real measurements</strong> — they
                are for manual testing only and will not be included in any export.
              </p>
              <p style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.6, marginBottom: 24 }}>
                Modified concentrations persist per client and are cleared when you use the ↺ Reset button.
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => setConcWarnModal(false)}
                  style={{ padding: "8px 18px", borderRadius: 7, border: `1px solid ${C.border}`,
                    background: "transparent", color: C.textMuted, fontSize: 12, cursor: "pointer" }}>
                  Cancel
                </button>
                <button onClick={() => { setEditConc(true); setConcWarnModal(false); }}
                  style={{ padding: "8px 18px", borderRadius: 7, border: "none",
                    background: C.navy, color: C.iceLight, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                  Unlock editing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ── Profile Manager modal ── */}
      {profileModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(24,55,75,0.55)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setProfileModal(false)}>
          <div style={{ background: C.surface, borderRadius: 14, padding: 0, width: 720, maxHeight: "82vh", boxShadow: "0 12px 48px rgba(24,55,75,0.3)", display: "flex", flexDirection: "column", overflow: "hidden" }} onClick={e => e.stopPropagation()}>
            {/* header */}
            <div style={{ background: C.navy, padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontFamily: T.display, fontSize: 17, color: C.iceLight }}>Manage Profiles</div>
              <button onClick={() => setProfileModal(false)} style={{ background: "none", border: "none", color: C.iceMid, fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: "6px 24px 10px", background: `${C.navy}10`, borderBottom: `1px solid ${C.border}`, fontSize: 11, color: C.textMuted }}>
              Each profile stores its own biomarker weights, process weights, and scoring parameters. Duplicate a profile to create a variant, then adjust its parameters to compare in the Aggregate view.
            </div>
            {/* profile list */}
            <div style={{ overflowY: "auto", flex: 1, padding: "14px 24px" }}>
              {profiles.map((p, pi) => {
                const isActive = p.id === activeProfileId;
                const isEditing = editingId === p.id;
                const col = PROF_COLORS[pi % PROF_COLORS.length];
                return (
                  <div key={p.id} style={{ border: `1px solid ${isActive ? col : C.border}`, borderRadius: 10, marginBottom: 12,
                    background: isActive ? `${col}08` : C.white, overflow: "hidden" }}>
                    {/* profile header row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: `1px solid ${C.border}` }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: col, flexShrink: 0, display: "inline-block" }} />
                      {isEditing ? (
                        <input autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                          onBlur={() => { renameProfile(p.id, editName); setEditingId(null); }}
                          onKeyDown={e => { if (e.key === "Enter") { renameProfile(p.id, editName); setEditingId(null); } if (e.key === "Escape") setEditingId(null); }}
                          style={{ flex: 1, fontSize: 13, fontWeight: 600, border: `1px solid ${C.steel}`, borderRadius: 5, padding: "3px 8px", outline: "none", color: C.navy }} />
                      ) : (
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.navy }}>{p.name}</span>
                      )}
                      {isActive && <span style={{ fontSize: 10, color: col, fontWeight: 700, background: `${col}18`, padding: "2px 8px", borderRadius: 10 }}>Active</span>}
                      <button onClick={() => { setActiveProfileId(p.id); setProfileModal(false); }}
                        style={{ fontSize: 11, padding: "4px 10px", border: `1px solid ${C.border}`, borderRadius: 6, cursor: "pointer", background: "transparent", color: C.textSecond }}>Switch</button>
                      <button onClick={() => { setEditingId(p.id); setEditName(p.name); }}
                        style={{ fontSize: 11, padding: "4px 10px", border: `1px solid ${C.border}`, borderRadius: 6, cursor: "pointer", background: "transparent", color: C.textSecond }}>Rename</button>
                      <button onClick={() => duplicateProfile(p.id)}
                        style={{ fontSize: 11, padding: "4px 10px", border: `1px solid ${C.border}`, borderRadius: 6, cursor: "pointer", background: "transparent", color: C.textSecond }}>Duplicate</button>
                      <button onClick={() => exportProfile(p)}
                        style={{ fontSize: 11, padding: "4px 10px", border: `1px solid ${C.teal}66`, borderRadius: 6, cursor: "pointer", background: "transparent", color: C.teal }}>⬇ Export</button>
                      {p.id !== "default" && profiles.length > 1 && (
                        <button onClick={() => deleteProfile(p.id)}
                          style={{ fontSize: 11, padding: "4px 10px", border: `1px solid ${C.critical}44`, borderRadius: 6, cursor: "pointer", background: "transparent", color: C.critical }}>Delete</button>
                      )}
                    </div>
                    {/* param summary grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 0 }}>
                      {[
                        ["Cutoff", `${((p.cutoff ?? 0.5) * 100).toFixed(0)}%`],
                        ["Yellow ×", `${(p.yellowWeight ?? 2).toFixed(1)}×`],
                        ["Red ×", `${(p.redWeight ?? 4).toFixed(1)}×`],
                        ["Green margin", `${((p.greenPct ?? 0.05) * 100).toFixed(0)}%`],
                        ["Curve", p.curve ?? "linear"],
                      ].map(([label, val]) => (
                        <div key={label} style={{ padding: "10px 14px", borderRight: `1px solid ${C.border}` }}>
                          <div style={{ fontSize: 9, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>{label}</div>
                          <div style={{ fontSize: 13, fontFamily: T.mono, fontWeight: 700, color: C.navyMid }}>{val}</div>
                        </div>
                      ))}
                    </div>
                    {/* weight summary */}
                    <div style={{ padding: "8px 16px 10px", display: "flex", gap: 20, borderTop: `1px solid ${C.border}` }}>
                      {(() => {
                        const bwVals = Object.values(p.bioWeights);
                        const pwVals = Object.values(p.procWeights);
                        const nonDefaultBio  = bwVals.filter(e => (e?.weight ?? 1) !== 1).length;
                        const nonDefaultProc = pwVals.filter(e => (e?.weight ?? 1) !== 1).length;
                        return (
                          <>
                            <span style={{ fontSize: 11, color: C.textMuted }}>
                              <span style={{ fontWeight: 600, color: nonDefaultBio > 0 ? C.steel : C.textFaint }}>{nonDefaultBio}</span>
                              <span style={{ color: C.textFaint }}> biomarker weight{nonDefaultBio !== 1 ? "s" : ""} adjusted</span>
                            </span>
                            <span style={{ fontSize: 11, color: C.textMuted }}>
                              <span style={{ fontWeight: 600, color: nonDefaultProc > 0 ? C.steel : C.textFaint }}>{nonDefaultProc}</span>
                              <span style={{ color: C.textFaint }}> process weight{nonDefaultProc !== 1 ? "s" : ""} adjusted</span>
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* footer */}
            <div style={{ padding: "12px 24px", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button onClick={() => { setSaveModal(true); setProfileModal(false); }}
                style={{ padding: "7px 16px", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer", background: C.teal, color: C.navy, fontWeight: 700 }}>+ Save Current as New Profile</button>
              <button onClick={() => setProfileModal(false)}
                style={{ padding: "7px 16px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, cursor: "pointer", background: "transparent", color: C.textMuted }}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Interactive Tutorial ── */}
      {showTutorial && (() => {
        // advance: "auto" = fired by action hook in code; "next" = manual Next; "action" = Next appears when doneKey set; "done" = final dismiss
        const STEPS = [
          // 0
          { title: "Step 1 of 17 · Upload Data",
            body: "Start by uploading client lab data. Drop a CSV file onto the box, or click it to browse. No data handy? Click \"Load Demo Data\" below the upload box — it loads 286 synthetic biomarkers, all perfectly in range, so you can explore the full tool right away.",
            cta: "📂 Upload a CSV — or click Load Demo Data to explore immediately",
            spotlight: "upload-dropzone", advance: "auto" },
          // 1
          { title: "Step 2 of 17 · Aggregate Statistics",
            body: "You're now on the Aggregate view — this is where you'll compare scoring profiles side-by-side across all clients. We'll return here at the end.",
            spotlight: null, advance: "next" },
          // 2
          { title: "Step 3 of 17 · Go to Client Report",
            body: "Switch to the Client Report to explore individual client scores and start adjusting weights.",
            cta: "👆 Click 'Client Report' in the toggle above",
            spotlight: "view-toggle", advance: "auto" },
          // 3
          { title: "Step 4 of 17 · Process Weights",
            body: "Each process card has a weight slider. Try adjusting the weight of the first process — it changes how much that process contributes to the overall system score.",
            cta: "🎚 Move the weight slider on the first process card",
            spotlight: "first-proc-card", advance: "action", doneKey: "procWeightChanged" },
          // 4
          { title: "Step 5 of 17 · Open Biomarker Weights",
            body: "Now open the Biomarker Weights tab. This shows individual biomarker scores, their zone (green / yellow / red), and lets you adjust per-biomarker weights.",
            cta: "👆 Click the 'Biomarker Weights' tab",
            spotlight: "tab-bio-weights", advance: "auto" },
          // 5
          { title: "Step 6 of 17 · Adjust a Biomarker Weight",
            body: "Each biomarker card has a manual weight slider. Try moving the slider on the first card — notice how the effective weight changes.",
            cta: "🎚 Move the weight slider on the first biomarker card",
            spotlight: "first-bio-card", advance: "action", doneKey: "bioWeightChanged" },
          // 6
          { title: "Step 7 of 17 · Open Biomarker Curves",
            body: "Click the Biomarker Curves tab. This shows the scoring curve for each biomarker and lets you change how scores decay as values move out of range.",
            cta: "👆 Click the 'Biomarker Curves' tab",
            spotlight: "tab-curves", advance: "auto" },
          // 7
          { title: "Step 8 of 17 · Change Curve Shape",
            body: "The curve shape controls how quickly a score drops as a biomarker moves further out of range. Try switching from Linear to Sqrt or Sigmoid.",
            cta: "👆 Click a different curve shape button",
            spotlight: "curve-shape-btns", advance: "action", doneKey: "curveChanged" },
          // 8
          { title: "Step 9 of 17 · Save a Profile",
            body: "Save all your adjustments as a named profile. Click Save Profile in the top bar.",
            cta: "👆 Click 'Save Profile'",
            spotlight: "save-profile-btn", advance: "auto" },
          // 9
          { title: "Step 10 of 17 · Name Your Profile",
            body: "Give your profile a name — try 'Tutorial'. Then click Save to create an independent snapshot of your weights and parameters.",
            cta: "✏️ Type a name (e.g. 'Tutorial') and click Save",
            spotlight: "save-modal-box", advance: "action", doneKey: "profileSaved" },
          // 10
          { title: "Step 11 of 17 · Back to Aggregate",
            body: "Switch back to Aggregate Statistics. From here you can compare how different profiles score the same clients.",
            cta: "👆 Click 'Aggregate Statistics'",
            spotlight: "view-toggle", advance: "auto" },
          // 11
          { title: "Step 12 of 17 · Select Profiles to Compare",
            body: "Click two profile pills to compare them. The first pill you click becomes the baseline — deltas are shown relative to it.",
            cta: "👆 Click two profile pills",
            spotlight: "profile-pills", advance: "action", doneKey: "profilesSelected" },
          // 12
          { title: "Step 13 of 17 · Switch Profile Tab",
            body: "Switch to your Tutorial profile using the tab above to see how our new adjustments compare against the baseline.",
            cta: "👆 Switch the active profile using the tab",
            spotlight: "client-tab-second", advance: "auto" },
          // 13 (new)
          { title: "Step 14 of 17 · Score Deltas",
            body: "The ▲▼ delta indicators show how each system score changed relative to the baseline profile you selected first. Green deltas mean the score improved; red means it dropped.",
            spotlight: "client-scores-table", advance: "next" },
          // 14
          { title: "Step 15 of 17 · Manage Profiles",
            body: "Open the Profile Manager to rename, duplicate, or delete profiles.",
            cta: "👆 Click 'Manage Profiles' in the top bar",
            spotlight: "manage-profiles-btn", advance: "auto" },
          // 15
          { title: "Step 16 of 17 · Clean Up",
            body: "You can delete the Tutorial profile here or keep it to experiment further. Each profile is fully independent — weights and parameters on one profile never affect another. When you're happy with a profile, hit ⬇ Export to download its non-default weights as a CSV, ready for the science team to review and annotate with PubMed references.",
            spotlight: null, advance: "next" },
          // 16
          { title: "Step 17 of 17 · You're Ready! 🎉",
            body: "You've completed the walkthrough. You know how to upload data, adjust process and biomarker weights, change the scoring curve, save profiles, and compare results in Aggregate Statistics. Happy scoring!",
            spotlight: null, advance: "done" },
        ];

        const step = STEPS[Math.min(tutorialStep, STEPS.length - 1)];
        const totalSteps = STEPS.length;
        const isDone   = step.advance === "done";
        const isNext   = step.advance === "next";
        const isAction = step.advance === "action";
        const actionComplete = isAction && !!tutorialDone[step.doneKey];
        const canAdvance = isNext || isDone || actionComplete;
        const canGoBack  = tutorialStep > 0;

        // ── Tooltip positioning relative to spotlight rect ──────────────
        const PAD = 14;
        const CARD_W = 310;

        let cardStyle = { position: "fixed", zIndex: 9999, width: CARD_W };
        if (spotlightRect) {
          const { top, left, width, height } = spotlightRect;
          const spBottom = top + height;
          const spRight  = left + width;
          const winH = window.innerHeight, winW = window.innerWidth;

          if (left >= CARD_W + PAD + 8) {
            // Left — preferred
            cardStyle.right = winW - left + PAD;
            cardStyle.top   = Math.max(8, Math.min(top, winH - 240));
          } else if (spBottom + 200 < winH) {
            // Below
            cardStyle.top  = spBottom + PAD;
            cardStyle.left = Math.min(Math.max(left, 8), winW - CARD_W - 8);
          } else if (spRight + CARD_W + PAD < winW) {
            // Right
            cardStyle.left = spRight + PAD;
            cardStyle.top  = Math.max(8, Math.min(top, winH - 240));
          } else {
            // Top
            cardStyle.bottom = winH - top + PAD;
            cardStyle.left   = Math.min(Math.max(left, 8), winW - CARD_W - 8);
          }
        } else {
          cardStyle.top = "50%"; cardStyle.left = "50%";
          cardStyle.transform = "translate(-50%, -50%)";
        }

        // ── Overlay ──────────────────────────────────────────────────────
        const GLOW = 8;
        const overlayEl = spotlightRect ? (
          <div style={{ position: "fixed", inset: 0, zIndex: 9990, pointerEvents: "none" }}>
            <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
              <defs>
                <mask id="tut-mask">
                  <rect width="100%" height="100%" fill="white" />
                  <rect x={spotlightRect.left - GLOW} y={spotlightRect.top - GLOW}
                    width={spotlightRect.width + GLOW * 2} height={spotlightRect.height + GLOW * 2}
                    rx="10" ry="10" fill="black" />
                </mask>
              </defs>
              <rect width="100%" height="100%" fill="rgba(24,55,75,0.55)" mask="url(#tut-mask)" />
            </svg>
            <div style={{
              position: "absolute",
              top: spotlightRect.top - GLOW, left: spotlightRect.left - GLOW,
              width: spotlightRect.width + GLOW * 2, height: spotlightRect.height + GLOW * 2,
              borderRadius: 10, pointerEvents: "none",
              boxShadow: `0 0 0 2px ${C.teal}, 0 0 18px 3px ${C.teal}44`,
            }} />
          </div>
        ) : (
          <div style={{ position: "fixed", inset: 0, zIndex: 9990, background: "rgba(24,55,75,0.50)", pointerEvents: "none" }} />
        );

        return (
          <>
            {overlayEl}

            {/* ── Tooltip card ── */}
            <div style={{ ...cardStyle,
              background: C.surface, borderRadius: 14,
              boxShadow: "0 10px 48px rgba(24,55,75,0.30), 0 0 0 1.5px rgba(140,207,207,0.5)",
              overflow: "hidden", fontFamily: T.body }}>

              {/* Progress bar */}
              <div style={{ height: 3, background: C.iceLight }}>
                <div style={{ height: "100%", background: C.teal, transition: "width 0.35s ease",
                  width: `${(tutorialStep / (totalSteps - 1)) * 100}%` }} />
              </div>

              {/* Header */}
              <div style={{ background: C.navy, padding: "11px 15px 9px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontSize: 11, color: C.teal, fontWeight: 700, letterSpacing: "0.05em" }}>{step.title}</div>
                <button onClick={() => setShowTutorial(false)}
                  style={{ background: "none", border: "none", color: `${C.iceLight}80`, fontSize: 16, cursor: "pointer", lineHeight: 1, padding: "0 0 0 10px", flexShrink: 0 }}>×</button>
              </div>

              {/* Body */}
              <div style={{ padding: "13px 15px 10px" }}>
                <p style={{ fontSize: 12.5, color: C.textPrimary, lineHeight: 1.65, margin: "0 0 10px" }}>{step.body}</p>
                {step.cta && !actionComplete && (
                  <div style={{ background: `${C.teal}14`, border: `1px solid ${C.teal}50`, borderRadius: 8,
                    padding: "8px 11px", fontSize: 11.5, color: C.navyMid, fontWeight: 600, lineHeight: 1.4 }}>
                    {step.cta}
                  </div>
                )}
                {actionComplete && (
                  <div style={{ background: `${C.green}18`, border: `1px solid ${C.green}50`, borderRadius: 8,
                    padding: "8px 11px", fontSize: 11.5, color: C.green, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                    ✓ Done! Click Next to continue.
                  </div>
                )}
              </div>

              {/* Dots + footer */}
              <div style={{ padding: "6px 15px 13px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {/* progress dots */}
                <div style={{ display: "flex", gap: 3, flexWrap: "wrap", maxWidth: 160 }}>
                  {STEPS.map((_, i) => (
                    <span key={i} style={{ width: i === tutorialStep ? 12 : 4, height: 4, borderRadius: 2,
                      background: i === tutorialStep ? C.teal : (i < tutorialStep ? `${C.teal}55` : C.iceLight),
                      display: "inline-block", transition: "all 0.2s", flexShrink: 0 }} />
                  ))}
                </div>
                {/* buttons */}
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                  <button onClick={() => setShowTutorial(false)}
                    style={{ fontSize: 10, color: C.textFaint, background: "none", border: "none", cursor: "pointer", padding: "2px 4px" }}>
                    Skip
                  </button>
                  {canGoBack && (
                    <button onClick={() => setTutorialStep(t => t - 1)}
                      style={{ padding: "5px 12px", border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 11,
                        cursor: "pointer", background: "transparent", color: C.textMuted }}>
                      ← Back
                    </button>
                  )}
                  {canAdvance && !isDone && (
                    <button onClick={() => setTutorialStep(t => t + 1)}
                      style={{ padding: "5px 13px", border: "none", borderRadius: 7, fontSize: 11,
                        cursor: "pointer", background: C.teal, color: C.navy, fontWeight: 700 }}>
                      Next →
                    </button>
                  )}
                  {isDone && (
                    <button onClick={() => setShowTutorial(false)}
                      style={{ padding: "5px 13px", border: "none", borderRadius: 7, fontSize: 11,
                        cursor: "pointer", background: C.teal, color: C.navy, fontWeight: 700 }}>
                      Let's go! →
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        );
      })()}


      {/* ── Default-dirty prompt modal ── */}
      {defaultDirtyModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(24,55,75,0.55)", zIndex: 200,
          display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setDefaultDirtyModal(false)}>
          <div style={{ background: C.surface, borderRadius: 12, padding: 28, width: 340,
            boxShadow: "0 8px 32px rgba(24,55,75,0.28)" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontFamily: T.display, color: C.navy, marginBottom: 10 }}>Save your changes?</div>
            <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.6, marginBottom: 20 }}>
              You've adjusted the Default profile. The Default profile always resets to its original values when you leave it — save your changes as a new profile to keep them.
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => {
                // Discard: reset Default back to factory, then navigate
                setProfiles(prev => prev.map(p => p.id === "default"
                  ? { ...p, bioWeights: makeDefaultBioWeights(), procWeights: makeDefaultProcWeights(), ...DEFAULT_PARAMS }
                  : p));
                setDefaultDirtyModal(false);
                setActiveView(pendingView || "aggregate");
                if ((pendingView || "aggregate") === "aggregate") setTutorialStep(prev => prev === 10 ? 11 : prev);
              }} style={{ padding: "7px 14px", border: `1px solid ${C.border}`, borderRadius: 6,
                fontSize: 12, cursor: "pointer", background: "transparent", color: C.textMuted }}>
                Discard & Continue
              </button>
              <button onClick={() => {
                setDefaultDirtyModal(false);
                setSaveModal(true);
              }} style={{ padding: "7px 16px", border: "none", borderRadius: 6,
                fontSize: 12, cursor: "pointer", background: C.teal, color: C.navy, fontWeight: 700 }}>
                Save as New Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Save modal ── */}
      {saveModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(24,55,75,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setSaveModal(false)}>
          <div data-tutorial="save-modal-box" style={{ background: C.surface, borderRadius: 12, padding: 28, width: 320, boxShadow: "0 8px 32px rgba(24,55,75,0.25)" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontFamily: T.display, color: C.navy, marginBottom: 12 }}>Save Weight Profile</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}>Saves an independent snapshot of the current weights and scoring parameters. You'll stay on your current profile — the saved copy is fully separate.</div>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Profile name…"
              style={{ width: "100%", padding: "8px 12px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, color: C.textPrimary, outline: "none", boxSizing: "border-box", marginBottom: 14 }} />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setSaveModal(false)} style={{ padding: "7px 16px", border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, cursor: "pointer", background: "transparent", color: C.textMuted }}>Cancel</button>
              <button onClick={saveProfile} style={{ padding: "7px 16px", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer", background: C.teal, color: C.navy, fontWeight: 700 }}>Save</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flex: 1, height: "calc(100vh - 50px)", overflow: "hidden" }}>

        {/* ── Column 1: Systems + global params ── */}
        <div style={{ width: col1Open ? 210 : 28, flexShrink: 0, background: C.surface, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", transition: "width 0.2s ease", overflow: "hidden" }}>
          {/* collapse tab */}
          <button onClick={() => setCol1Open(o => !o)}
            title={col1Open ? "Collapse systems panel" : "Expand systems panel"}
            style={{ display: "flex", alignItems: "center", justifyContent: col1Open ? "flex-end" : "center",
              gap: 6, padding: "8px 10px", border: "none", borderBottom: `1px solid ${C.border}`,
              background: "transparent", cursor: "pointer", flexShrink: 0, color: C.textFaint,
              fontSize: 10, letterSpacing: "0.1em" }}>
            {col1Open && <span style={{ textTransform: "uppercase", letterSpacing: "0.15em", fontSize: 9, color: C.textFaint, fontWeight: 600 }}>Systems</span>}
            <span style={{ fontSize: 14, lineHeight: 1 }}>{col1Open ? "‹" : "›"}</span>
          </button>

          {col1Open && <>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {SYSTEMS.map(sys => {
                const s = allSysScores.find(x => x.id === sys.id)?.score;
                const active = systemId === sys.id && activeView === "client";
                return (
                  <button key={sys.id} onClick={() => { setSystemId(sys.id); setActiveProc(null); setActiveView("client"); }}
                    style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 14px",
                      border: "none", cursor: "pointer", transition: "all 0.12s",
                      background: active ? `${C.teal}18` : "transparent",
                      borderLeft: `3px solid ${active ? C.teal : "transparent"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                      <span style={{ fontSize: 12, color: active ? C.navy : C.textSecond, fontWeight: active ? 700 : 400, lineHeight: 1.3, flex: 1 }}>{sys.name}</span>
                      {s != null
                        ? <span style={{ fontSize: 12, color: procColour(s), fontWeight: 700, fontFamily: T.mono, flexShrink: 0 }}>{Math.round(s)}</span>
                        : <span style={{ fontSize: 10, color: C.textFaint, fontStyle: "italic", flexShrink: 0 }}>No data</span>}
                    </div>
                    {s != null && <div style={{ marginTop: 4 }}><ScoreBar score={s} h={2} /></div>}
                  </button>
                );
              })}
            </div>

            {/* ── Profile params note ── */}
            <div style={{ padding: "12px 15px", borderTop: `1px solid ${C.border}`, background: `${C.iceLight}40`, flexShrink: 0 }}>
              <div style={{ fontSize: 9, letterSpacing: "0.2em", color: C.textFaint, textTransform: "uppercase", fontWeight: 600, marginBottom: 7 }}>Profile Parameters</div>
              <div style={{ fontSize: 9, color: C.textFaint, lineHeight: 1.7 }}>
                <span style={{ color: C.teal }}>■</span> Green: 1× (base)<br />
                <span style={{ color: C.fair }}>■</span> Yellow: {yellowWeight.toFixed(1)}×<br />
                <span style={{ color: C.critical }}>■</span> Red: {redWeight.toFixed(1)}×<br />
                <span style={{ color: C.navyMid }}>■</span> Cutoff: {(cutoff*100).toFixed(0)}%
              </div>
              <div style={{ marginTop: 8, fontSize: 9, color: C.textFaint, lineHeight: 1.5 }}>
                Adjust weights in <strong style={{ color: C.steel }}>Biomarker Weights</strong> tab · cutoff &amp; curve in <strong style={{ color: C.steel }}>Curves</strong> tab.
              </div>
            </div>
          </>}
        </div>

        {/* ── Column 2: Processes ── */}
        <div style={{ width: col2Open ? 196 : 28, flexShrink: 0, background: `${C.iceLight}30`, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", transition: "width 0.2s ease", overflow: "hidden" }}>
          {/* collapse tab */}
          <button onClick={() => setCol2Open(o => !o)}
            title={col2Open ? "Collapse processes panel" : "Expand processes panel"}
            style={{ display: "flex", alignItems: "center", justifyContent: col2Open ? "flex-end" : "center",
              gap: 6, padding: "8px 10px", border: "none", borderBottom: `1px solid ${C.border}`,
              background: "transparent", cursor: "pointer", flexShrink: 0, color: C.textFaint, fontSize: 10 }}>
            {col2Open && <span style={{ textTransform: "uppercase", letterSpacing: "0.15em", fontSize: 9, color: C.textFaint, fontWeight: 600 }}>Processes</span>}
            <span style={{ fontSize: 14, lineHeight: 1 }}>{col2Open ? "‹" : "›"}</span>
          </button>

          {col2Open && <div style={{ overflowY: "auto", flex: 1 }}>
            <div style={{ fontSize: 11, color: C.textSecond, fontWeight: 600, padding: "10px 14px 8px", lineHeight: 1.3 }}>{system.name}</div>
            {procResults.length === 0 && Object.keys(system.processes).map(proc => (
              <div key={proc} style={{ padding: "8px 14px", borderLeft: "3px solid transparent", color: C.textFaint, fontSize: 11, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ flex: 1 }}>{proc}</span>
                <span style={{ fontSize: 10, color: C.textFaint, fontStyle: "italic", marginLeft: 6 }}>No data</span>
              </div>
            ))}
            {[...procResults].sort((a, b) => (a.score ?? Infinity) - (b.score ?? Infinity)).map(pr => {
              const active = selProc === pr.process;
              return (
                <button key={pr.process} onClick={() => { setActiveProc(pr.process); setActiveView("client"); }}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "11px 16px",
                    border: "none", cursor: "pointer", transition: "all 0.12s",
                    background: active ? `${C.teal}22` : "transparent",
                    borderLeft: `3px solid ${active ? C.teal : "transparent"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
                    <span style={{ fontSize: 11, color: active ? C.navy : C.textSecond, fontWeight: active ? 600 : 400, lineHeight: 1.3, flex: 1 }}>{pr.process}</span>
                    {pr.score != null && <span style={{ fontSize: 11, color: procColour(pr.score), fontWeight: 700, fontFamily: T.mono, flexShrink: 0 }}>{Math.round(pr.score)}</span>}
                  </div>
                  {pr.score == null && <div style={{ fontSize: 9, color: C.textFaint, marginTop: 2, fontStyle: "italic" }}>No data</div>}
                </button>
              );
            })}
          </div>}
        </div>

        {/* ── Main area ── */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", minWidth: 0 }}>
          {!hasData ? (
            <UploadPrompt fileRef={fileRef} dragOver={dragOver} setDragOver={setDragOver} handleFile={handleFile} uploadErr={uploadErr} loadDemo={loadDemo} personas={DEMO_PERSONAS} />
          ) : activeView === "aggregate" ? (
            <AggregateView aggregateData={aggregateData} profiles={profiles} compareIds={compareIds} setCompareIds={setCompareIds} card={card} tutorialStep={tutorialStep} setTutorialStep={setTutorialStep} tutorialDone={tutorialDone} setTutorialDone={setTutorialDone} showTutorial={showTutorial} setShowTutorial={setShowTutorial} />
          ) : (
            <>
              {/* Header: system name + breadcrumb + dual gauges */}
              <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "12px 22px", display: "flex", alignItems: "center", gap: 20, flexShrink: 0 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: C.textFaint, marginBottom: 1 }}>{system.name}</div>
                  <div style={{ fontSize: 16, fontFamily: T.display, color: C.navy, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{selProc}</div>
                </div>
                {/* Dual gauges side by side — no box, no decimal */}
                <div style={{ display: "flex", gap: 18, alignItems: "center", flexShrink: 0 }}>
                  <ArcGauge score={sysScore} size={60} label="System" />
                  {activeProcResult?.score != null && (
                    <>
                      <div style={{ width: 1, height: 50, background: C.border }} />
                      <ArcGauge score={activeProcResult.score} size={60} label="Process" />
                    </>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, background: C.surface, flexShrink: 0 }}>
                {TABS.map(({ key, label }) => {
                  const tutId = key === "weights-bio" ? "tab-bio-weights" : key === "curves" ? "tab-curves" : null;
                  return (
                    <button key={key}
                      {...(tutId ? { "data-tutorial": tutId } : {})}
                      onClick={() => {
                        setTab(key);
                        if (key === "weights-bio") setTutorialStep(prev => prev === 4 ? 5 : prev);
                        if (key === "curves")       setTutorialStep(prev => prev === 6 ? 7 : prev);
                      }}
                      style={{ padding: "9px 16px", fontSize: 12,
                        color: tab === key ? C.steel : C.textFaint, background: "none", border: "none",
                        borderBottom: `2px solid ${tab === key ? C.steel : "transparent"}`,
                        cursor: "pointer", fontWeight: tab === key ? 600 : 400, transition: "all 0.15s" }}>
                      {label}
                    </button>
                  );
                })}
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "28px 28px" }}>
                {tab === "weights-proc" && <ProcWeightsTab system={system} procResults={procResults} procWeights={procWeights} setProcWeights={setProcWeights} sysScore={sysScore} selProc={selProc} setActiveProc={setActiveProc} setTab={setTab} card={card} />}
                {tab === "weights-bio"  && <BioWeightsTab activeProcResult={activeProcResult} selProc={selProc} bioWeights={bioWeights} setBioWeights={setBioWeights} greenPct={greenPct} yellowWeight={yellowWeight} setYellowWeight={setYellowWeight} redWeight={redWeight} setRedWeight={setRedWeight} card={card} editConc={editConc} setEditConc={setEditConc} setConcWarnModal={setConcWarnModal} concOverrides={concOverrides[clientId] ?? {}} setConcOverrides={v => setConcOverrides(prev => ({ ...prev, [clientId]: v }))} clientMarkers={clients[clientId]?.markers ?? {}} />}
                {tab === "curves"       && <CurvesTab activeProcResult={activeProcResult} selProc={selProc} cutoff={cutoff} setCutoff={setCutoff} greenPct={greenPct} setGreenPct={setGreenPct} curve={curve} setCurve={setCurve} card={card} />}
                {tab === "flags"        && <FlagsTab oorFlags={oorFlags} setActiveProc={setActiveProc} setTab={setTab} card={card} bioWeights={bioWeights} cutoff={cutoff} greenPct={greenPct} curve={curve} />}
                {tab === "adjustments"  && <AdjustmentsTab bioWeights={bioWeights} procWeights={procWeights} setBioWeights={setBioWeights} setProcWeights={setProcWeights} setActiveProc={setActiveProc} setTab={setTab} card={card} />}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Upload ───────────────────────────────────────────────────────────────────
function UploadPrompt({ fileRef, dragOver, setDragOver, handleFile, uploadErr, loadDemo, personas }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 24 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 26, fontFamily: T.display, color: C.navy, marginBottom: 8 }}>Biomarker Scoring Workbench</div>
        <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.8, maxWidth: 440 }}>Upload client lab data to score biomarkers across all seven health systems.</div>
      </div>
      <div data-tutorial="upload-dropzone" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, width: "100%", maxWidth: 520 }}>
        <div onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          style={{ border: `1.5px dashed ${dragOver ? C.teal : C.iceMid}`, borderRadius: 12, padding: "28px 48px",
            textAlign: "center", cursor: "pointer", background: dragOver ? `${C.teal}0A` : C.white, transition: "all 0.2s", width: "100%" }}>
          <div style={{ fontSize: 26, color: C.teal, marginBottom: 8 }}>↑</div>
          <div style={{ fontSize: 13, color: C.textSecond, fontWeight: 600, marginBottom: 4 }}>Drop CSV or click to upload</div>
          <div style={{ fontSize: 11, color: C.textFaint }}>Columns: my_id · measure_name · lab_concentration · lower/upper_reference_range</div>
          {uploadErr && <div style={{ marginTop: 8, fontSize: 11, color: C.critical }}>{uploadErr}</div>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
          <div style={{ flex: 1, height: 1, background: C.border }} />
          <span style={{ fontSize: 11, color: C.textFaint }}>or explore with demo data</span>
          <div style={{ flex: 1, height: 1, background: C.border }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, width: "100%" }}>
          {personas.map(p => (
            <button key={p.id} onClick={() => loadDemo(p.id)}
              style={{ padding: "14px 12px", borderRadius: 10, border: `1.5px solid ${C.teal}44`,
                background: C.white, cursor: "pointer", fontFamily: T.body, textAlign: "left",
                transition: "all 0.15s", display: "flex", flexDirection: "column", gap: 5 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.background = `${C.teal}0D`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${C.teal}44`; e.currentTarget.style.background = C.white; }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.navy, lineHeight: 1.3 }}>{p.label}</div>
              <div style={{ fontSize: 10, color: C.textFaint, lineHeight: 1.4 }}>{p.sub}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Process Weights ──────────────────────────────────────────────────────────
function ProcWeightsTab({ system, procResults, procWeights, setProcWeights, sysScore, selProc, setActiveProc, setTab, card }) {
  const procCount = Object.keys(system.processes).length;
  return (
    <div>
      {/* System summary box — mirrors the biomarker weights header */}
      <div style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18,
        background: `${C.iceLight}`, borderLeft: `4px solid ${sysScore != null ? procColour(sysScore) : C.border}` }}>
        <div>
          <div style={{ fontSize: 15, fontFamily: T.display, color: C.navy }}>{system.name}</div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>
            {procCount} process{procCount !== 1 ? "es" : ""} · {procResults.filter(p => p.score != null).length} with data
          </div>
        </div>
        {sysScore != null && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 28, color: procColour(sysScore), fontWeight: 800, lineHeight: 1, fontFamily: T.mono }}>
              {Math.round(sysScore)}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 18 }}>
        {[...procResults].sort((a, b) => (a.score ?? Infinity) - (b.score ?? Infinity)).map((pr, prIdx) => {
          const w = procWeights[pr.process] ?? { ...DEFAULT_PROC_ENTRY };
          const active = selProc === pr.process;
          return (
            <div key={pr.process} {...(prIdx === 0 ? { "data-tutorial": "first-proc-card" } : {})} style={{ ...card, borderLeft: `3px solid ${active ? C.teal : C.border}`, cursor: "pointer" }}
              onClick={() => { setActiveProc(pr.process); setTab("weights-bio"); }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ flex: 1, paddingRight: 10 }}>
                  <div style={{ fontSize: 13, color: C.textPrimary, fontWeight: 600, lineHeight: 1.3, marginBottom: 3 }}>{pr.process}</div>
                  <div style={{ fontSize: 10, color: C.textFaint }}>{pr.biomarkers.filter(b => !b.missing).length} biomarkers</div>
                </div>
                {pr.score != null && <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 26, color: procColour(pr.score), fontWeight: 700, lineHeight: 1 }}>{Math.round(pr.score)}</div>
                </div>}
                {pr.score == null && <div style={{ fontSize: 10, color: C.textFaint, fontStyle: "italic" }}>No data</div>}
              </div>
              <div onClick={e => e.stopPropagation()}>
                <Slider label="Weight" value={w.weight ?? 1} min={1} max={10} step={1}
                  onChange={v => setProcWeights(prev => ({ ...prev, [pr.process]: { ...(prev[pr.process] ?? {}), weight: v } }))}
                  color={C.steel} fmt={v => `${v}×`} />
                {/* Color selector */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <span style={{ fontSize: 10, color: C.textFaint, minWidth: 38 }}>Apply on</span>
                  {["red","yellow","both"].map(opt => {
                    const col = opt === "red" ? C.critical : opt === "yellow" ? C.fair : C.textMuted;
                    const sel = (w.color ?? "red") === opt;
                    return (
                      <button key={opt} onClick={() => setProcWeights(prev => ({ ...prev, [pr.process]: { ...(prev[pr.process] ?? {}), color: opt } }))}
                        style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, border: `1px solid ${sel ? col : C.border}`,
                          background: sel ? `${col}18` : "transparent", color: sel ? col : C.textFaint,
                          cursor: "pointer", fontWeight: sel ? 700 : 400 }}>{opt}</button>
                    );
                  })}
                </div>
                {/* PubMed ref */}
                <div style={{ marginTop: 6 }}>
                  <input value={w.ref ?? ""} onChange={e => setProcWeights(prev => ({ ...prev, [pr.process]: { ...(prev[pr.process] ?? {}), ref: e.target.value } }))}
                    placeholder="PubMed ID (e.g. 21475195; 23614584)"
                    style={{ width: "100%", fontSize: 10, padding: "3px 8px", border: `1px solid ${C.border}`, borderRadius: 5,
                      color: C.textMuted, background: "transparent", outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Biomarker Weights ────────────────────────────────────────────────────────
function BioWeightsTab({ activeProcResult, selProc, bioWeights, setBioWeights, greenPct, yellowWeight, setYellowWeight, redWeight, setRedWeight, card, editConc, setEditConc, setConcWarnModal, concOverrides, setConcOverrides, clientMarkers }) {
  if (!activeProcResult) return <div style={{ fontSize: 12, color: C.textFaint, fontStyle: "italic" }}>Select a process from the left panel.</div>;
  return (
    <div>
      <div style={{ ...card, marginBottom: 14,
        background: `${C.iceLight}`, borderLeft: `4px solid ${activeProcResult?.score != null ? procColour(activeProcResult.score) : C.border}` }}>
        {/* Top row: name + score */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 15, fontFamily: T.display, color: C.navy }}>{selProc}</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 3 }}>
              {activeProcResult.biomarkers.filter(b => !b.missing).length} markers · green zone ±{(greenPct * 100).toFixed(0)}% inside ref
            </div>
          </div>
          {activeProcResult.score != null &&
            <div style={{ fontSize: 26, color: procColour(activeProcResult.score), fontWeight: 700 }}>{Math.round(activeProcResult.score)}</div>}
        </div>
        {/* Subtext + global weights */}
        <div style={{ paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, color: C.textFaint, marginBottom: 8 }}>
            Manual weight overrides global zone multiplier when color+level conditions match.
            Global fallback: <span style={{ color: C.fair }}>yellow {yellowWeight.toFixed(1)}×</span>,{" "}
            <span style={{ color: C.critical }}>red {redWeight.toFixed(1)}×</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>Global weights</span>
            {[
              { label: "Yellow", col: C.fair,     val: yellowWeight, set: setYellowWeight, min: 1.0, max: 5.0,  def: DEFAULT_PARAMS.yellowWeight },
              { label: "Red",    col: C.critical, val: redWeight,    set: setRedWeight,    min: 1.0, max: 10.0, def: DEFAULT_PARAMS.redWeight },
            ].map(({ label, col, val, set, min, max, def }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color: col, fontWeight: 600 }}>{label}</span>
                <div style={{ display: "flex", alignItems: "center", border: `1px solid ${C.border}`, borderRadius: 6, overflow: "hidden" }}>
                  <button onClick={() => set(parseFloat(Math.max(min, val - 1).toFixed(1)))}
                    style={{ padding: "3px 9px", background: "transparent", border: "none", cursor: "pointer",
                      color: C.textMuted, fontSize: 14, lineHeight: 1 }}>−</button>
                  <span style={{ fontSize: 12, fontWeight: 700, color: col, fontFamily: T.mono,
                    padding: "3px 6px", minWidth: 36, textAlign: "center",
                    borderLeft: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}` }}>
                    {val.toFixed(1)}×
                  </span>
                  <button onClick={() => set(parseFloat(Math.min(max, val + 1).toFixed(1)))}
                    style={{ padding: "3px 9px", background: "transparent", border: "none", cursor: "pointer",
                      color: C.textMuted, fontSize: 14, lineHeight: 1 }}>+</button>
                </div>
                {val !== def && (
                  <button onClick={() => set(def)}
                    style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, border: `1px solid ${C.border}`,
                      background: "transparent", color: C.textFaint, cursor: "pointer" }}>↺</button>
                )}
              </div>
            ))}
            <Tooltip text={"Global multipliers applied to out-of-range biomarkers when no manual weight override is active.\n\nYellow (default 2×): applied to biomarkers just outside the reference range.\nRed (default 4×): applied to biomarkers well outside the reference range.\n\nHigher values give flagged markers stronger influence on the process score."}>
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 14, height: 14, borderRadius: "50%", background: C.iceMid,
                color: C.navy, fontSize: 9, fontWeight: 700, cursor: "default", userSelect: "none" }}>?</span>
            </Tooltip>
          </div>
        </div>
      </div>
      {/* Edit concentrations button — standalone below header card */}
      <div style={{ marginBottom: 22 }}>
        <button
          onClick={() => { if (editConc) { setEditConc(false); } else { setConcWarnModal(true); } }}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 6,
            fontSize: 11, cursor: "pointer", fontWeight: 600,
            border: `1px solid ${editConc ? C.fair : C.border}`,
            background: editConc ? `${C.fair}18` : "transparent",
            color: editConc ? C.fair : C.textFaint }}>
          {editConc ? "🔓 Editing concentrations" : "🔒 Edit concentrations"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(330px,1fr))", gap: 18 }}>
        {(editConc
          ? activeProcResult.biomarkers
          : [...activeProcResult.biomarkers].sort((a, b) => {
              if (a.missing && b.missing) return 0;
              if (a.missing) return 1;
              if (b.missing) return -1;
              return a.score - b.score;
            })
        ).map((bm, bmIdx) => {
          const isFirstVisible = bmIdx === 0 && !bm.missing;
          if (bm.missing) return (
            <div key={bm.name} style={{ ...card, opacity: 0.4, padding: 12 }}>
              <div style={{ fontSize: 11, color: C.textMuted }}>{bm.name}</div>
              <div style={{ fontSize: 10, color: C.textFaint, marginTop: 2 }}>Not in CSV</div>
            </div>
          );
          const zoneCol = bm.zone === "green" ? C.teal : bm.zone === "yellow" ? C.fair : C.critical;
          const rng = bm.refHigh - bm.refLow;
          const pctOut = bm.zone === "red" ? (bm.status === "HIGH" ? (bm.value - bm.refHigh) / rng : (bm.refLow - bm.value) / rng) * 100 : 0;
          const origValue = clientMarkers[bm.name]?.value ?? bm.value;
          const isOverridden = concOverrides[bm.name] !== undefined;
          return (
            <div key={bm.name} {...(isFirstVisible ? { "data-tutorial": "first-bio-card" } : {})} style={{ ...card, borderLeft: `3px solid ${zoneCol}`, padding: 13,
              background: isOverridden ? `${C.fair}08` : card.background }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ flex: 1, paddingRight: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: C.textPrimary, fontWeight: 600 }}>{bm.name}</span>
                    {isOverridden && <span title="Concentration edited" style={{ fontSize: 11, color: C.fair, lineHeight: 1 }}>✎</span>}
                  </div>
                  <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap" }}>
                    <ZoneDot zone={bm.zone} />
                    <span style={{ fontSize: 11, color: zoneCol, fontWeight: 600, textTransform: "uppercase" }}>{bm.zone}</span>
                    {pctOut > 0 && <span style={{ fontSize: 10, color: C.critical, fontFamily: T.mono }}>{bm.status === "HIGH" ? "+" : "-"}{pctOut.toFixed(1)}% out</span>}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 22, color: zoneCol, fontWeight: 700, lineHeight: 1 }}>{Math.round(bm.score)}</div>
                  <div style={{ fontSize: 9, color: C.textFaint }}>
                    eff. <span style={{ fontWeight: 700, color: zoneCol }}>{bm.effWeight.toFixed(1)}×</span>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 6 }}>
                <span style={{ fontFamily: T.mono, color: isOverridden ? C.fair : C.textSecond }}>{bm.value.toFixed(1)}</span>
                {isOverridden && <span style={{ fontFamily: T.mono, color: C.textFaint }}> (orig {origValue.toFixed(1)})</span>}
                {" · ref "}<span style={{ fontFamily: T.mono, color: C.textSecond }}>{bm.refLow.toFixed(1)}–{bm.refHigh.toFixed(1)}</span>
              </div>
              <RangeBar value={bm.value} refLow={bm.refLow} refHigh={bm.refHigh} greenPct={greenPct} />
              {editConc && (() => {
                const bmRng = bm.refHigh - bm.refLow;
                const gL = bm.refLow + greenPct * bmRng, gH = bm.refHigh - greenPct * bmRng;
                // Representative midpoint values for each zone
                const zonePresets = [
                  { label: "Red Low",    col: C.critical, value: parseFloat(Math.max(0, bm.refLow - bmRng * 0.5).toFixed(1)) },
                  { label: "Yellow Low", col: C.fair,     value: parseFloat(((bm.refLow + gL) / 2).toFixed(1)) },
                  { label: "Normal",     col: C.teal,     value: parseFloat(((bm.refLow + bm.refHigh) / 2).toFixed(1)) },
                  { label: "Yellow High",col: C.fair,     value: parseFloat(((gH + bm.refHigh) / 2).toFixed(1)) },
                  { label: "Red High",   col: C.critical, value: parseFloat((bm.refHigh + bmRng * 0.5).toFixed(1)) },
                ];
                const setConc = v => setConcOverrides({ ...concOverrides, [bm.name]: parseFloat(parseFloat(v).toFixed(1)) });
                return (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${C.border}` }}
                    onClick={e => e.stopPropagation()}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 9, color: C.fair, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>Manual concentration</span>
                      {isOverridden && (
                        <button onClick={() => { const next = { ...concOverrides }; delete next[bm.name]; setConcOverrides(next); }}
                          style={{ fontSize: 9, padding: "1px 6px", borderRadius: 4, border: `1px solid ${C.border}`,
                            background: "transparent", color: C.textFaint, cursor: "pointer" }}>↺ restore</button>
                      )}
                    </div>
                    {/* Zone preset buttons */}
                    <div style={{ display: "flex", gap: 3, marginBottom: 7, flexWrap: "wrap" }}>
                      {zonePresets.map(({ label, col, value: pv }) => {
                        const active = bm.value === pv;
                        return (
                          <button key={label} onClick={() => setConc(pv)}
                            style={{ flex: 1, minWidth: 0, fontSize: 9, padding: "4px 2px", borderRadius: 4,
                              border: `1px solid ${active ? col : C.border}`,
                              background: active ? `${col}22` : "transparent",
                              color: active ? col : C.textFaint,
                              cursor: "pointer", fontWeight: active ? 700 : 400,
                              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {label}
                          </button>
                        );
                      })}
                    </div>
                    {/* Manual number input */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 10, color: C.textFaint, flexShrink: 0 }}>Or enter value:</span>
                      <input
                        type="number" min={0} step={0.1}
                        value={bm.value}
                        onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v >= 0) setConc(v); }}
                        style={{ width: 72, fontSize: 11, padding: "3px 7px", border: `1px solid ${C.fair}66`,
                          borderRadius: 5, color: C.textPrimary, background: "transparent",
                          outline: "none", fontFamily: T.mono }} />
                    </div>
                  </div>
                );
              })()}
              <div style={{ marginTop: 10 }} onClick={e => e.stopPropagation()}>
                <Slider label="Manual weight" value={bm.entry?.weight ?? 1} min={1} max={10} step={1}
                  onChange={v => setBioWeights(prev => ({ ...prev, [bm.name]: { ...(prev[bm.name] ?? {}), weight: v } }))}
                  color={C.teal} fmt={v => `${v}×`} />
                {/* Color + Level selectors */}
                <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, color: C.textFaint, minWidth: 60 }}>Apply on</span>
                    {["red","yellow","both"].map(opt => {
                      const col = opt === "red" ? C.critical : opt === "yellow" ? C.fair : C.textMuted;
                      const sel = (bm.entry?.color ?? "red") === opt;
                      return (
                        <button key={opt} onClick={() => setBioWeights(prev => ({ ...prev, [bm.name]: { ...(prev[bm.name] ?? {}), color: opt } }))}
                          style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, border: `1px solid ${sel ? col : C.border}`,
                            background: sel ? `${col}18` : "transparent", color: sel ? col : C.textFaint,
                            cursor: "pointer", fontWeight: sel ? 700 : 400 }}>{opt}</button>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 11, color: C.textFaint, minWidth: 60 }}>When</span>
                    {["high","low","both"].map(opt => {
                      const col = opt === "high" ? C.critical : opt === "low" ? C.steel : C.textMuted;
                      const sel = (bm.entry?.level ?? "high") === opt;
                      return (
                        <button key={opt} onClick={() => setBioWeights(prev => ({ ...prev, [bm.name]: { ...(prev[bm.name] ?? {}), level: opt } }))}
                          style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, border: `1px solid ${sel ? col : C.border}`,
                            background: sel ? `${col}18` : "transparent", color: sel ? col : C.textFaint,
                            cursor: "pointer", fontWeight: sel ? 700 : 400 }}>{opt}</button>
                      );
                    })}
                  </div>
                </div>
                {/* PubMed ref */}
                <div style={{ marginTop: 6 }}>
                  <input value={bm.entry?.ref ?? ""} onChange={e => setBioWeights(prev => ({ ...prev, [bm.name]: { ...(prev[bm.name] ?? {}), ref: e.target.value } }))}
                    placeholder="PubMed ID (e.g. 21475195; 23614584)"
                    style={{ width: "100%", fontSize: 10, padding: "3px 8px", border: `1px solid ${C.border}`, borderRadius: 5,
                      color: C.textMuted, background: "transparent", outline: "none", boxSizing: "border-box" }} />
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Biomarker Curves ─────────────────────────────────────────────────────────
function CurvesTab({ activeProcResult, selProc, cutoff, setCutoff, greenPct, setGreenPct, curve, setCurve, card }) {
  if (!activeProcResult) return <div style={{ fontSize: 12, color: C.textFaint, fontStyle: "italic" }}>Select a process from the left panel.</div>;
  const valid = activeProcResult.biomarkers.filter(b => !b.missing);
  return (
    <div>
      {/* Curve params: cutoff + green margin + curve shape */}
      <div style={{ ...card, marginBottom: 20, display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ fontSize: 11, color: C.textMuted, alignSelf: "center", minWidth: 120 }}>
          <div style={{ fontSize: 12, color: C.textSecond, fontWeight: 600, marginBottom: 2 }}>Curve Parameters</div>
          <div style={{ fontSize: 10, lineHeight: 1.6 }}>Applied globally to all systems.</div>
        </div>
        <div style={{ flex: 1, minWidth: 160, display: "flex", flexDirection: "column", gap: 8 }}>
          <Slider label="Cutoff" value={cutoff} min={0.1} max={1.0} step={0.05}
            onChange={setCutoff} color={C.navyMid} fmt={v => `${(v * 100).toFixed(0)}%`}
            tooltip={"Distance from the reference boundary (as a fraction of the range width) at which score reaches 0.\n\nAt 50%: a marker 50% outside the boundary scores 0."} />
          <Slider label="Green margin" value={greenPct} min={0.01} max={0.2} step={0.01}
            onChange={setGreenPct} color={C.teal} fmt={v => `${(v * 100).toFixed(0)}%`}
            tooltip={"Width of the 'perfect' zone centred on the reference range, as a % of the range width.\n\nAt 5%: biomarkers within 5% of the ref boundaries score 100. Larger values mean a wider green zone and slower score decay."} />
        </div>
        <div style={{ minWidth: 160 }}>
          <div style={{ fontSize: 11, color: C.textSecond, marginBottom: 6 }}>Curve shape</div>
          <div data-tutorial="curve-shape-btns" style={{ display: "flex", gap: 4 }}>
            {["linear", "sqrt", "sigmoid"].map(cv => (
              <button key={cv} onClick={() => setCurve(cv)} style={{ flex: 1, padding: "5px 0", fontSize: 10,
                border: `1px solid ${curve === cv ? C.steel : C.border}`, borderRadius: 5, cursor: "pointer",
                background: curve === cv ? C.steel : "transparent", color: curve === cv ? "white" : C.textMuted }}>
                {cv}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 9, color: C.textFaint, marginTop: 8, lineHeight: 1.7 }}>
            <span style={{ color: C.teal }}>■</span> Green ±{(greenPct * 100).toFixed(0)}% inside ref<br />
            <span style={{ color: C.fair }}>■</span> Yellow ±{(greenPct * 100).toFixed(0)}% outside ref<br />
            <span style={{ color: C.critical }}>■</span> Red: beyond yellow
          </div>
        </div>
      </div>

      <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 14, lineHeight: 1.7 }}>
        Scoring curves for <strong style={{ color: C.textSecond }}>{selProc}</strong>.
        Teal band = green zone · grey bands = yellow · dot = client value.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(330px,1fr))", gap: 18 }}>
        {valid.map(bm => {
          const zoneCol = bm.zone === "green" ? C.teal : bm.zone === "yellow" ? C.fair : C.critical;
          return (
            <div key={bm.name} style={{ ...card, borderTop: `3px solid ${zoneCol}`, padding: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 12, color: C.textPrimary, fontWeight: 600 }}>{bm.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                    <ZoneDot zone={bm.zone} />
                    <span style={{ fontSize: 10, color: zoneCol, fontWeight: 600 }}>{bm.zone}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 17, color: zoneCol, fontWeight: 700 }}>{Math.round(bm.score)}</div>
                </div>
              </div>
              <ScoringCurve refLow={bm.refLow} refHigh={bm.refHigh} value={bm.value} cutoff={cutoff} greenPct={greenPct} curve={curve} />
              <div style={{ fontSize: 9, color: C.textFaint, marginTop: 5, fontFamily: T.mono }}>{bm.value.toFixed(3)} · ref {bm.refLow.toFixed(2)}–{bm.refHigh.toFixed(2)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Biomarker Flags ──────────────────────────────────────────────────────────
function FlagsTab({ oorFlags, setActiveProc, setTab, card, bioWeights, cutoff, greenPct, curve }) {
  const red = oorFlags.filter(f => f.zone === "red"), yellow = oorFlags.filter(f => f.zone === "yellow");
  if (!oorFlags.length) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60%", gap: 10, textAlign: "center" }}>
      <div style={{ fontSize: 28, color: C.teal }}>✓</div>
      <div style={{ fontSize: 14, color: C.textSecond, fontWeight: 600 }}>All markers within green zone</div>
    </div>
  );
  return (
    <div>
      {red.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.critical }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: C.critical }}>{red.length} Red Flag{red.length !== 1 ? "s" : ""}</span>
            <span style={{ fontSize: 11, color: C.textMuted }}>— outside reference + yellow zone</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
            {red.map(bm => <FlagCard key={`${bm.process}-${bm.name}`} bm={bm} bioWeights={bioWeights} cutoff={cutoff} greenPct={greenPct} curve={curve} card={card} />)}
          </div>
        </div>
      )}
      {yellow.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.fair }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: C.fair }}>{yellow.length} Yellow Flag{yellow.length !== 1 ? "s" : ""}</span>
            <span style={{ fontSize: 11, color: C.textMuted }}>— within yellow boundary</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
            {yellow.map(bm => <FlagCard key={`${bm.process}-${bm.name}`} bm={bm} bioWeights={bioWeights} cutoff={cutoff} greenPct={greenPct} curve={curve} card={card} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Active Adjustments Tab ───────────────────────────────────────────────────
function AdjustmentsTab({ bioWeights, procWeights, setBioWeights, setProcWeights, setActiveProc, setTab, card }) {
  // Gather non-default biomarker adjustments, grouped by system → process
  const bioAdj = [];
  SYSTEMS.forEach(sys => {
    Object.entries(sys.processes).forEach(([proc, markers]) => {
      markers.forEach(name => {
        const e = bioWeights[name];
        if (e) bioAdj.push({ sys: sys.name, sysId: sys.id, proc, name, entry: e });
      });
    });
  });

  // Gather non-default process adjustments
  const procAdj = [];
  SYSTEMS.forEach(sys => {
    Object.keys(sys.processes).forEach(proc => {
      const e = procWeights[proc];
      if (e) procAdj.push({ sys: sys.name, sysId: sys.id, proc, entry: e });
    });
  });

  const total = bioAdj.length + procAdj.length;

  const pillStyle = (active, col) => ({
    padding: "2px 7px", borderRadius: 4, fontSize: 10, fontWeight: 600,
    background: active ? col + "22" : C.iceLight,
    color: active ? col : C.textFaint,
    border: `1px solid ${active ? col + "55" : C.border}`,
  });

  const colorMap = { red: C.critical, yellow: C.fair, both: C.steel };
  const levelMap = { high: C.critical, low: C.atRisk, both: C.steel };

  if (total === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 10, padding: "60px 0", color: C.textFaint }}>
        <div style={{ fontSize: 28 }}>✓</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.textMuted }}>No adjustments applied</div>
        <div style={{ fontSize: 11, color: C.textFaint, textAlign: "center", maxWidth: 280, lineHeight: 1.6 }}>
          All biomarker and process weights are at their defaults. Adjust weights in the Process Weights or Biomarker Weights tabs to see them listed here.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {procAdj.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, letterSpacing: "0.06em",
            textTransform: "uppercase", marginBottom: 12 }}>
            Process Weights ({procAdj.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {procAdj.map(({ sys, proc, entry }) => (
              <div key={proc} style={{ ...card, padding: "10px 14px", cursor: "pointer",
                borderLeft: `3px solid ${C.steel}` }}
                onClick={() => { setActiveProc(proc); setTab("weights-proc"); }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.textPrimary }}>{proc}</div>
                    <div style={{ fontSize: 10, color: C.textFaint, marginTop: 2 }}>{sys}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.navy,
                      background: C.iceLight, borderRadius: 4, padding: "2px 7px",
                      border: `1px solid ${C.border}` }}>
                      ×{entry.weight}
                    </span>
                    {["red","yellow","both"].map(c => (
                      <span key={c} style={pillStyle(entry.color === c, colorMap[c])}>{c}</span>
                    ))}
                    <button onClick={ev => { ev.stopPropagation(); setProcWeights(prev => { const n = { ...prev }; delete n[proc]; return n; }); }}
                      style={{ background: "none", border: "none", color: C.textFaint, cursor: "pointer",
                        fontSize: 15, lineHeight: 1, padding: "0 0 0 4px" }} title="Reset to default">×</button>
                  </div>
                </div>
                {entry.ref && (
                  <div style={{ fontSize: 10, color: C.textFaint, marginTop: 5 }}>
                    PubMed: {entry.ref}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {bioAdj.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, letterSpacing: "0.06em",
            textTransform: "uppercase", marginBottom: 12 }}>
            Biomarker Weights ({bioAdj.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {bioAdj.map(({ sys, proc, name, entry }) => (
              <div key={name} style={{ ...card, padding: "10px 14px", cursor: "pointer",
                borderLeft: `3px solid ${C.teal}` }}
                onClick={() => { setActiveProc(proc); setTab("weights-bio"); }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.textPrimary }}>{name}</div>
                    <div style={{ fontSize: 10, color: C.textFaint, marginTop: 2 }}>{proc} · {sys}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.navy,
                      background: C.iceLight, borderRadius: 4, padding: "2px 7px",
                      border: `1px solid ${C.border}` }}>
                      ×{entry.weight}
                    </span>
                    {["red","yellow","both"].map(c => (
                      <span key={c} style={pillStyle(entry.color === c, colorMap[c])}>{c}</span>
                    ))}
                    {["high","low","both"].map(l => (
                      <span key={l} style={pillStyle(entry.level === l, levelMap[l])}>{l}</span>
                    ))}
                    <button onClick={ev => { ev.stopPropagation(); setBioWeights(prev => { const n = { ...prev }; delete n[name]; return n; }); }}
                      style={{ background: "none", border: "none", color: C.textFaint, cursor: "pointer",
                        fontSize: 15, lineHeight: 1, padding: "0 0 0 4px" }} title="Reset to default">×</button>
                  </div>
                </div>
                {entry.ref && (
                  <div style={{ fontSize: 10, color: C.textFaint, marginTop: 5 }}>
                    PubMed: {entry.ref}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BiomarkerDetailModal({ bm, bioWeights, cutoff, greenPct, curve, onClose }) {
  const colourCol = bm.zone === "green" ? C.teal : bm.zone === "yellow" ? C.fair : C.critical;
  const colourLabel = bm.zone === "green" ? "Green" : bm.zone === "yellow" ? "Yellow" : "Red";

  // All processes this biomarker belongs to (across all systems)
  const memberships = [];
  SYSTEMS.forEach(sys => {
    Object.entries(sys.processes).forEach(([proc, markers]) => {
      if (markers.includes(bm.name) || markers.includes(Object.keys(ALIASES).find(k => ALIASES[k] === bm.name))) {
        const entry = bioWeights[bm.name] ?? { ...DEFAULT_BIO_ENTRY };
        memberships.push({ sys: sys.name, proc, entry });
      }
    });
  });

  const pillStyle = (active, col) => ({
    padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600,
    background: active ? col + "22" : C.iceLight,
    color: active ? col : C.textFaint,
    border: `1px solid ${active ? col + "55" : C.border}`,
  });
  const colorMap = { red: C.critical, yellow: C.fair, both: C.steel, green: C.teal };
  const levelMap = { high: C.critical, low: C.atRisk, both: C.steel };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(24,55,75,0.55)", zIndex: 500,
      display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ background: C.surface, borderRadius: 14, width: 440, maxHeight: "88vh",
        overflowY: "auto", boxShadow: "0 12px 48px rgba(24,55,75,0.3)",
        display: "flex", flexDirection: "column" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ background: C.navy, padding: "14px 18px", borderRadius: "14px 14px 0 0",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 15, fontFamily: T.display, color: C.iceLight, lineHeight: 1.3 }}>{bm.name}</div>
            <div style={{ fontSize: 10, color: C.teal, marginTop: 4 }}>
              {memberships.map(m => m.proc).join(" · ")}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.iceMid,
            fontSize: 20, cursor: "pointer", lineHeight: 1, padding: "0 0 0 12px", flexShrink: 0 }}>×</button>
        </div>

        <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Score + colour row */}
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1, background: C.iceLight, borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Score</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: colourCol, fontFamily: T.mono, lineHeight: 1 }}>
                {Math.round(bm.score)}
              </div>
            </div>
            <div style={{ flex: 1, background: C.iceLight, borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Colour</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: colourCol, lineHeight: 1.2 }}>{colourLabel}</div>
              <div style={{ fontSize: 10, color: C.textFaint, marginTop: 4 }}>
                {bm.status === "HIGH" ? "Above range" : bm.status === "LOW" ? "Below range" : "Within range"}
              </div>
            </div>
            <div style={{ flex: 1, background: C.iceLight, borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Concentration</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.textPrimary, fontFamily: T.mono, lineHeight: 1.2 }}>
                {bm.value.toFixed(1)}
              </div>
              <div style={{ fontSize: 10, color: C.textFaint, marginTop: 4 }}>
                ref {bm.refLow.toFixed(1)}–{bm.refHigh.toFixed(1)}
              </div>
            </div>
          </div>

          {/* Scoring curve visual */}
          <div>
            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8, fontWeight: 600 }}>Score curve</div>
            <ScoringCurve refLow={bm.refLow} refHigh={bm.refHigh} value={bm.value}
              cutoff={cutoff} greenPct={greenPct} curve={curve} />
            <div style={{ fontSize: 9, color: C.textFaint, marginTop: 4 }}>
              Teal band = green zone · grey bands = yellow · dot = measured value
            </div>
          </div>

          {/* System + process memberships */}
          <div>
            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8, fontWeight: 600 }}>Health systems</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {memberships.map(({ sys, proc }, i) => (
                <div key={i} style={{ fontSize: 11, color: C.textSecond, background: C.iceLight,
                  borderRadius: 7, padding: "7px 11px" }}>
                  <span style={{ color: C.textMuted }}>{sys}</span>
                  <span style={{ color: C.iceMid }}> › </span>
                  <span style={{ fontWeight: 600 }}>{proc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weight settings per process */}
          <div>
            <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8, fontWeight: 600 }}>Weight settings</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {memberships.map(({ proc, entry }, i) => (
                <div key={i} style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, color: C.textFaint, marginBottom: 7 }}>{proc}</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.navy,
                      background: C.iceLight, borderRadius: 4, padding: "2px 8px",
                      border: `1px solid ${C.border}` }}>×{entry.weight}</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      {["red","yellow","both"].map(c => (
                        <span key={c} style={pillStyle(entry.color === c, colorMap[c])}>{c}</span>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      {["high","low","both"].map(l => (
                        <span key={l} style={pillStyle(entry.level === l, levelMap[l])}>{l}</span>
                      ))}
                    </div>
                  </div>
                  {entry.ref && (
                    <div style={{ fontSize: 10, color: C.textFaint, marginTop: 6 }}>PubMed: {entry.ref}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function FlagCard({ bm, bioWeights, cutoff, greenPct, curve, card }) {
  const [showModal, setShowModal] = useState(false);
  const colourCol = bm.zone === "green" ? C.teal : bm.zone === "yellow" ? C.fair : C.critical;
  return (
    <>
      <div style={{ ...card, padding: 12, borderLeft: `3px solid ${colourCol}`, cursor: "pointer" }}
        onClick={() => setShowModal(true)}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          <div>
            <div style={{ fontSize: 12, color: C.textPrimary, fontWeight: 600 }}>{bm.name}</div>
            <div style={{ fontSize: 10, color: C.textFaint, marginTop: 1 }}>{bm.process}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 17, color: colourCol, fontWeight: 700 }}>{Math.round(bm.score)}</div>
            <ZoneDot zone={bm.zone} />
          </div>
        </div>
        <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 5 }}>
          <span style={{ fontFamily: T.mono, color: C.textSecond }}>{bm.value.toFixed(1)}</span>
          {" · ref "}<span style={{ fontFamily: T.mono, color: C.textSecond }}>{bm.refLow.toFixed(1)}–{bm.refHigh.toFixed(1)}</span>
          {" "}<span style={{ color: bm.status === "HIGH" ? C.critical : C.atRisk, fontWeight: 600 }}>({bm.status})</span>
        </div>
        <ScoreBar score={bm.score} h={3} colour={colourCol} />
      </div>
      {showModal && (
        <BiomarkerDetailModal bm={bm} bioWeights={bioWeights} cutoff={cutoff}
          greenPct={greenPct} curve={curve} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}

// ─── Aggregate Statistics ─────────────────────────────────────────────────────
function ScoreDot({ score }) {
  return score != null ? (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span style={{ fontFamily: T.mono, fontWeight: 700, fontSize: 13, color: procColour(score) }}>{Math.round(score)}</span>
    </span>
  ) : <span style={{ color: C.textFaint }}>—</span>;
}

// Colour-coded cell background by score
function gradeBg(score) {
  if (score == null) return "transparent";
  return `${procColour(score)}18`;
}

// Profile colour palette for multi-profile comparison
const PROF_COLORS = [C.steel, C.teal, C.fair, C.atRisk, "#8B6FAB"];

function AggregateView({ aggregateData, profiles, compareIds, setCompareIds, card, tutorialStep, setTutorialStep, tutorialDone, setTutorialDone, showTutorial, setShowTutorial }) {
  const [clientTab, setClientTab] = useState(0);

  if (!aggregateData || !aggregateData.length) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
      <div style={{ textAlign: "center", color: C.textMuted, fontSize: 13 }}>Upload client data to view aggregate statistics.</div>
    </div>
  );
  const toggleCompare = id => {
    setCompareIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      if (next.length >= 2) setTutorialDone(td => ({ ...td, profilesSelected: true }));
      return next;
    });
  };
  const isComparing = aggregateData.length > 1;

  // Build a unified stats table: rows = systems, col groups = profiles
  // Each cell: mean / median / SD / range
  const STAT_COLS = ["Mean", "Median", "SD", "Range"];

  function sysStatsForProfile(profData, sysId) {
    const scores = profData.clients.map(r => r.systems.find(s => s.id === sysId)?.score).filter(x => x != null);
    return stats(scores);
  }

  return (
    <div style={{ padding: "20px 24px" }}>

      {/* Profile selector */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8 }}>
          {isComparing
            ? <>Comparing <strong>{aggregateData.length}</strong> profiles. <strong style={{ color: PROF_COLORS[0] }}>{aggregateData[0].profile.name}</strong> is the baseline — deltas are calculated relative to it. First selected profile = baseline.</>
            : "Select profiles to compare side-by-side. The first selected profile becomes the baseline for delta calculations."}
        </div>
        <div data-tutorial="profile-pills" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {profiles.map((p) => {
            const active = compareIds.includes(p.id);
            const compareIdx = compareIds.indexOf(p.id);
            const col = active ? PROF_COLORS[compareIdx % PROF_COLORS.length] : C.textFaint;
            return (
              <button key={p.id} onClick={() => toggleCompare(p.id)} style={{ padding: "5px 14px", fontSize: 11, borderRadius: 20, cursor: "pointer",
                border: `1.5px solid ${active ? col : C.border}`,
                background: active ? `${col}18` : "transparent",
                color: active ? col : C.textMuted, fontWeight: active ? 700 : 400,
                transition: "all 0.15s", display: "flex", alignItems: "center", gap: 5 }}>
                {active && <span style={{ width: 8, height: 8, borderRadius: "50%", background: col, display: "inline-block" }} />}
                {p.name}
              </button>
            );
          })}
          {compareIds.length > 0 && (
            <button onClick={() => setCompareIds([])} style={{ padding: "5px 14px", fontSize: 11, borderRadius: 20,
              border: `1px solid ${C.border}`, cursor: "pointer", background: "transparent", color: C.textMuted }}>Clear</button>
          )}
        </div>
      </div>

      {/* ── Section 1: Per-client heatmap ── */}
      <div data-tutorial="client-scores-table" style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 4, fontFamily: T.display }}>Client Scores</div>
        <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 12 }}>
          Each cell shows the system score for that client.
          {isComparing && clientTab === 0 && (
            <span> Viewing <strong style={{ color: PROF_COLORS[0] }}>{aggregateData[0].profile.name}</strong> (baseline). Switch tabs to see other profiles with deltas vs. this baseline.</span>
          )}
          {isComparing && clientTab > 0 && (
            <span> Viewing <strong style={{ color: PROF_COLORS[clientTab] }}>{aggregateData[clientTab].profile.name}</strong>. ▲▼ deltas are vs. baseline <strong style={{ color: PROF_COLORS[0] }}>{aggregateData[0].profile.name}</strong>.</span>
          )}
        </div>

        {/* Profile tabs for client table */}
        {isComparing && (
          <div style={{ display: "flex", gap: 0, marginBottom: 0, borderBottom: `1px solid ${C.border}` }}>
            {aggregateData.map(({ profile }, pi) => {
              const col = PROF_COLORS[pi % PROF_COLORS.length];
              return (
                <button key={profile.id}
                  {...(pi === 1 ? { "data-tutorial": "client-tab-second" } : {})}
                  onClick={() => { setClientTab(pi); if (pi === 1) setTutorialStep(prev => prev === 12 ? 13 : prev); }}
                  style={{ padding: "7px 16px", fontSize: 11, border: "none", cursor: "pointer",
                    background: clientTab === pi ? C.surface : "transparent",
                    color: clientTab === pi ? col : C.textMuted,
                    fontWeight: clientTab === pi ? 700 : 400,
                    borderBottom: `2px solid ${clientTab === pi ? col : "transparent"}`,
                    transition: "all 0.15s" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: col, display: "inline-block" }} />
                    {profile.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Client × System heatmap table */}
        {(() => {
          const { clients: rows } = aggregateData[isComparing ? clientTab : 0];
          return (
            <div style={{ ...card, padding: 0, overflow: "auto", borderTopLeftRadius: isComparing ? 0 : undefined, borderTopRightRadius: isComparing ? 0 : undefined }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 700 }}>
                <thead>
                  <tr style={{ background: C.navy }}>
                    <th style={{ padding: "10px 16px", textAlign: "left", color: C.iceLight, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>Client</th>
                    {SYSTEMS.map(s => (
                      <th key={s.id} style={{ padding: "10px 10px", textAlign: "center", color: C.iceLight, fontSize: 11, fontWeight: 600 }}>
                        <div style={{ maxWidth: 90, margin: "0 auto", lineHeight: 1.3 }}>{s.name}</div>
                      </th>
                    ))}

                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, ri) => {
                    const baseRow = isComparing && clientTab > 0 ? aggregateData[0].clients.find(r => r.pid === row.pid) : null;
                    return (
                      <tr key={row.pid} style={{ borderTop: `1px solid ${C.border}` }}>
                        <td style={{ padding: "8px 16px", fontFamily: T.mono, fontSize: 11, color: C.textSecond, whiteSpace: "nowrap", background: ri % 2 === 0 ? "transparent" : `${C.iceLight}20` }}>{row.pid}</td>
                        {row.systems.map(s => {
                          const baseScore = baseRow?.systems.find(bs => bs.id === s.id)?.score ?? null;
                          const d = s.score != null && baseScore != null ? s.score - baseScore : null;
                          return (
                            <td key={s.id} style={{ padding: "6px 8px", textAlign: "center", background: gradeBg(s.score) }}>
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                                <ScoreDot score={s.score} />
                                {d != null && Math.abs(d) > 0.05 && (
                                  <span style={{ fontSize: 9, fontFamily: T.mono, fontWeight: 700, lineHeight: 1,
                                    color: d > 0 ? C.green : C.critical }}>
                                    {d > 0 ? "▲" : "▼"}{Math.abs(d).toFixed(1)}
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>

      {/* ── Section 2: Summary stats table ── */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 4, fontFamily: T.display }}>Population Summary</div>
        <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 14 }}>
          {isComparing
            ? <>Systems as rows, profiles as column groups. Δ Mean is vs. baseline <strong style={{ color: PROF_COLORS[0] }}>{aggregateData[0].profile.name}</strong>.</>
            : "Summary statistics per system across all clients."}
        </div>

        <div style={{ ...card, padding: 0, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              {/* Profile group headers — only shown when comparing */}
              {isComparing && (
                <tr style={{ background: `${C.navy}08`, borderBottom: `1px solid ${C.border}` }}>
                  <th style={{ padding: "8px 16px", textAlign: "left", width: 180 }} />
                  {aggregateData.map(({ profile }, pi) => {
                    const col = PROF_COLORS[pi % PROF_COLORS.length];
                    return (
                      <th key={profile.id} colSpan={pi > 0 ? STAT_COLS.length + 1 : STAT_COLS.length}
                        style={{ padding: "8px 10px", textAlign: "center", borderLeft: `2px solid ${col}`, color: col, fontSize: 11, fontWeight: 700 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: col, display: "inline-block" }} />
                          {profile.name}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              )}
              {/* Stat column headers */}
              <tr style={{ background: C.navy }}>
                <th style={{ padding: "9px 16px", textAlign: "left", color: C.iceLight, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>System</th>
                {aggregateData.map(({ profile }, pi) => {
                  const col = PROF_COLORS[pi % PROF_COLORS.length];
                  return [
                    ...STAT_COLS.map(stat => (
                      <th key={`${profile.id}-${stat}`} style={{ padding: "9px 10px", textAlign: "center", color: C.iceLight,
                        fontSize: 10, fontWeight: 600, whiteSpace: "nowrap",
                        borderLeft: stat === "Mean" ? `2px solid ${col}40` : undefined }}>
                        {stat}
                      </th>
                    )),
                    ...(pi > 0 ? [
                      <th key={`${profile.id}-delta`} style={{ padding: "9px 8px", textAlign: "center",
                        color: `${C.teal}cc`, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>Δ Mean</th>
                    ] : [])
                  ];
                })}
              </tr>
            </thead>
            <tbody>
              {SYSTEMS.map((sys, si) => {
                const allStats = aggregateData.map(pd => sysStatsForProfile(pd, sys.id));
                const baseStats = allStats[0];
                const procC = procColour(baseStats?.mean);
                return (
                  <tr key={sys.id} style={{ borderTop: `1px solid ${C.border}`, background: si % 2 === 0 ? "transparent" : `${C.iceLight}20` }}>
                    <td style={{ padding: "9px 16px", fontSize: 11, color: C.textPrimary, fontWeight: 600, whiteSpace: "nowrap",
                      borderLeft: `3px solid ${baseStats ? procC : C.border}` }}>
                      {sys.name}
                    </td>
                    {aggregateData.map(({ profile }, pi) => {
                      const st = allStats[pi];
                      const col = PROF_COLORS[pi % PROF_COLORS.length];
                      const deltaMean = pi > 0 && st && baseStats ? st.mean - baseStats.mean : null;
                      return [
                        <td key={`${profile.id}-mean`} style={{ padding: "9px 10px", textAlign: "center",
                          borderLeft: `2px solid ${col}30`,
                          background: st ? gradeBg(st.mean) : "transparent" }}>
                          {st ? <span style={{ fontFamily: T.mono, fontWeight: 700, color: procColour(st.mean), fontSize: 13 }}>{st.mean.toFixed(1)}</span> : <span style={{ color: C.textFaint }}>—</span>}
                        </td>,
                        <td key={`${profile.id}-median`} style={{ padding: "9px 10px", textAlign: "center" }}>
                          {st ? <span style={{ fontFamily: T.mono, color: procColour(st.median), fontSize: 12 }}>{st.median.toFixed(1)}</span> : <span style={{ color: C.textFaint }}>—</span>}
                        </td>,
                        <td key={`${profile.id}-sd`} style={{ padding: "9px 10px", textAlign: "center" }}>
                          {st ? <span style={{ fontFamily: T.mono, color: C.textMuted, fontSize: 12 }}>{st.sd.toFixed(1)}</span> : <span style={{ color: C.textFaint }}>—</span>}
                        </td>,
                        <td key={`${profile.id}-range`} style={{ padding: "9px 10px", textAlign: "center" }}>
                          {st ? <span style={{ fontFamily: T.mono, color: C.textMuted, fontSize: 11 }}>{Math.round(st.min)}–{Math.round(st.max)}</span> : <span style={{ color: C.textFaint }}>—</span>}
                        </td>,
                        ...(pi > 0 ? [
                          <td key={`${profile.id}-delta`} style={{ padding: "9px 8px", textAlign: "center" }}>
                            {deltaMean != null ? (
                              <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700,
                                color: deltaMean > 0 ? C.green : deltaMean < 0 ? C.critical : C.textFaint }}>
                                {deltaMean > 0 ? "+" : ""}{deltaMean.toFixed(1)}
                              </span>
                            ) : <span style={{ color: C.textFaint }}>—</span>}
                          </td>
                        ] : [])
                      ];
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}