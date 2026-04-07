# COMPAS Bias — The Proxy Variable Problem

An interactive scrollytelling visualization showing how "race-neutral" features
in the COMPAS recidivism algorithm statistically encode race via **proxy variables**.

---

## Narrative Flow

```
Hero ──► Act 1 ──────────────► Act 2 ──────────────────► Act 3 ──────────────────────► Act 4 ──────────────────► Act 5
         The Algorithm          Hidden Proxies              Remove a Variable             Same Crime,               The Fairness
         Feature list grid,     D3 force-graph showing     Interactive ablation:         Different Score           Dilemma
         highlight which        Pearson correlations        toggle features, watch        Matched case pairs        Draggable triangle:
         features are proxies   between features & race     FPR/FNR gaps change          showing score disparities  impossibility theorem
```

---

## Quick Start

```bash
# One-shot setup (creates venv, downloads data, runs pipeline, installs npm deps)
bash setup.sh

# Start dev server
npm run dev
# → http://localhost:5173
```

## Manual Steps

### 1. Python Data Pipeline

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download COMPAS dataset (ProPublica, 2016)
wget https://raw.githubusercontent.com/propublica/compas-analysis/master/compas-scores-two-years.csv \
     -O data/compas-scores-two-years.csv

# Run the pipeline — generates 5 JSON files in public/data/
python scripts/data_processing.py
```

**Output files:**

| File | Used by | Description |
|------|---------|-------------|
| `public/data/proxy_correlations.json` | Act 2 | Nodes + edges for force graph |
| `public/data/feature_importance.json` | Act 2/3 | Permutation importance scores |
| `public/data/ablation_results.json` | Act 3 | Pre-computed metrics per scenario |
| `public/data/comparison_cases.json` | Act 4 | Matched defendant pairs |
| `public/data/fairness_tradeoffs.json` | Act 5 | Metrics across 17 thresholds |

### 2. Frontend

```bash
npm install
npm run dev      # development (HMR)
npm run build    # production bundle → dist/
npm run preview  # preview production build
```

---

## Project Structure

```
compas-bias-viz/
├── data/                          # Raw dataset (git-ignored)
│   └── compas-scores-two-years.csv
├── public/
│   └── data/                      # Processed JSON (served statically)
├── scripts/
│   └── data_processing.py         # Full 6-step pipeline
├── src/
│   ├── components/
│   │   ├── Act1_Introduction.jsx  # Feature grid with proxy highlight
│   │   ├── Act2_CorrelationNetwork.jsx  # D3 force graph
│   │   ├── Act3_FeatureAblation.jsx     # Ablation experiment UI
│   │   ├── Act4_CaseComparison.jsx      # Matched case cards
│   │   └── Act5_FairnessDilemma.jsx     # Draggable fairness triangle
│   ├── context/
│   │   └── DataContext.jsx        # Global data loader via React Context
│   ├── hooks/
│   │   └── useScrollama.js        # Scrollama wrapper hook
│   ├── utils/
│   │   └── dataLoader.js          # Fetch helpers + interpolation
│   ├── App.jsx                    # Main container + progress indicator
│   ├── main.jsx                   # React entry point
│   └── index.css                  # Tailwind + custom CSS
├── setup.sh                       # One-shot bootstrap script
├── package.json
├── vite.config.js
├── tailwind.config.js
└── requirements.txt
```

---

## Data Source & Ethics

**Dataset:** ProPublica COMPAS Analysis (2016)
**URL:** https://github.com/propublica/compas-analysis
**License:** Apache 2.0

The COMPAS data contains real criminal justice records from Broward County, FL.
This project uses it solely for educational analysis of algorithmic fairness.

**Key references:**
- Angwin et al., "Machine Bias" — ProPublica (2016)
- Chouldechova, "Fair prediction with disparate impact" — Big Data (2017)
- Kleinberg et al., "Human decisions and machine predictions" — QJE (2018)

---

## Technical Notes

- **Why pre-computed ablation?** Training ML models in-browser is impractical; all
  scenario metrics are computed by the Python script and stored as a lookup table.
- **Force graph performance:** D3 simulations are CPU-intensive. The graph pauses
  after 300 ticks via `alphaDecay`. Drag to re-energize.
- **Fairness interpolation:** Act 5 uses linear interpolation between two threshold
  records to give smooth real-time feedback as the user drags the dot.
