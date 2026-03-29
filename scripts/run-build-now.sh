#!/bin/bash
# Quick runner — triggers the full nightly build pipeline NOW with Sonnet
# Usage: bash scripts/run-build-now.sh

export MODEL="sonnet"
echo "Starting build with Sonnet model..."
echo "This will: research keywords → build 5-8 tools → QA → commit → push"
echo "Check logs/nightly-build.log for progress"
echo ""

bash scripts/nightly-build.sh 2>&1 | tee logs/nightly-build-manual.log

echo ""
echo "Done! Check logs/nightly-build-manual.log for full output"
