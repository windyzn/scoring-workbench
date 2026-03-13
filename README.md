# Molecular You — Biomarker Scoring Workbench

An internal tool for scientists to score and explore client biomarker lab data across seven health systems.

## What it does

- Loads client biomarker data via CSV upload or built-in demo personas
- Scores each biomarker (0–100) based on distance from reference range
- Aggregates scores up through processes and health systems
- Lets scientists apply manual weights per biomarker or process, conditional on colour (red/yellow) and direction (high/low)
- Supports multiple scoring profiles for side-by-side comparison
- Exports non-default weight configurations as CSV

## Tech stack

- React 18 + Vite
- Single-file SPA (`src/App.jsx`) — no backend, no database
- Deployed via GitHub Actions → GitHub Pages

## Local development

```bash
npm install
npm run dev
```

## Deployment

Pushes to `main` automatically deploy to GitHub Pages via the workflow in `.github/workflows/deploy.yml`.

Live URL: https://windyzn.github.io/scoring-workbench/

## Documentation

See `scoring_documentation.md` for the full specification of the scoring model, including biomarker colour classification, distance-based decay, weight override logic, and worked examples.
