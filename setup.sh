#!/usr/bin/env bash
# setup.sh — one-shot project bootstrap
set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   COMPAS Bias Visualization — Setup              ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── 1. Python environment ────────────────────────────────────────────────
echo "▸ Creating Python virtual environment …"
python3 -m venv venv
source venv/bin/activate

echo "▸ Installing Python dependencies …"
pip install -q --upgrade pip
pip install -q -r requirements.txt
echo "  ✓ Python deps installed"

# ── 2. Download COMPAS data ──────────────────────────────────────────────
mkdir -p data public/data

REPO_URL="https://github.com/propublica/compas-analysis.git"
COMPAS_FILE="data/compas-scores-two-years.csv"

if [ -f "$COMPAS_FILE" ]; then
  echo "▸ COMPAS dataset already present — skipping download."
else
  echo "▸ Cloning ProPublica compas-analysis repo …"
  if command -v git &> /dev/null; then
    # Shallow clone (no history) into a temp dir, then copy just the CSV
    git clone --depth 1 --quiet "$REPO_URL" /tmp/compas-analysis-src
    cp /tmp/compas-analysis-src/compas-scores-two-years.csv "$COMPAS_FILE"
    rm -rf /tmp/compas-analysis-src
    echo "  ✓ Dataset ready ($(wc -l < "$COMPAS_FILE") rows)"
  else
    echo "  ERROR: git not found. Install git and retry, or manually copy"
    echo "  compas-scores-two-years.csv from $REPO_URL into data/"
    exit 1
  fi
fi

# ── 3. Run data processing ───────────────────────────────────────────────
echo ""
echo "▸ Running data processing pipeline …"
python scripts/data_processing.py

echo ""
echo "▸ JSON files generated:"
ls -lh public/data/*.json 2>/dev/null | awk '{print "  " $NF " (" $5 ")"}'

# ── 4. Frontend deps ─────────────────────────────────────────────────────
echo ""
echo "▸ Installing Node.js dependencies …"
if command -v npm &> /dev/null; then
  npm install --silent
  echo "  ✓ npm deps installed"
else
  echo "  WARNING: npm not found. Install Node.js ≥18 then run: npm install"
fi

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   Setup complete!                                ║"
echo "║                                                  ║"
echo "║   Start the dev server:                          ║"
echo "║     npm run dev                                  ║"
echo "║                                                  ║"
echo "║   Then open: http://localhost:5173               ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
