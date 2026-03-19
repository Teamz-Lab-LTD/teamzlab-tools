#!/bin/bash
# Wrapper that calls the Python schema builder
cd "$(dirname "$0")"
python3 build-static-schema.py
