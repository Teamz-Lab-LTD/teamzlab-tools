#!/usr/bin/env python3
"""Scan every tool and emit webview-incompat.json.

The Toolz mobile app fetches the resulting file at runtime and opens any
listed tool in the system browser instead of the in-app WebView. This keeps
the app from trying to run things the mobile WebView cannot support:
WebGPU pipelines, 60MB+ Transformers.js models, and ffmpeg.wasm transcodes
that OOM on mid-range phones.

Detection is intentionally conservative — markers must appear in the tool's
own index.html or a file it directly references. We do not follow CDN URLs
or walk node_modules.

Input:  tools.json  (list of tools with url paths)
Output: webview-incompat.json at repo root
"""
from __future__ import annotations

import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOOLS_JSON = ROOT / "tools.json"
OUT = ROOT / "webview-incompat.json"

# Capability markers. Each entry: (tag, compiled regex).
# Tags are what the app consumes; keep them stable.
ALWAYS_MARKERS = [
    ("webgpu", re.compile(r"navigator\.gpu\b|requestAdapter\s*\(|@webgpu/|wgsl", re.I)),
    ("ffmpeg-wasm", re.compile(r"@ffmpeg/ffmpeg|ffmpeg-core\.js|createFFmpeg\s*\(|FFmpeg\.load\s*\(", re.I)),
    ("transformers-js", re.compile(r"@xenova/transformers|@huggingface/transformers|transformers\.min\.js|huggingface\.co/.+?/resolve", re.I)),
    ("onnx-heavy", re.compile(r"onnxruntime-web.+?\.onnx|ort\.InferenceSession\.create", re.I)),
]

# Heavier-than-average but runnable on flagships. Redirected only on low-RAM devices.
HEAVY_MARKERS = [
    ("mediapipe", re.compile(r"@mediapipe/tasks-vision|@mediapipe/tasks-audio|FilesetResolver", re.I)),
    ("tfjs", re.compile(r"@tensorflow/tfjs|tf\.loadGraphModel\s*\(|tf\.loadLayersModel\s*\(", re.I)),
    ("opencv-js", re.compile(r"opencv\.js|cv\.imread\s*\(", re.I)),
]

HEAVY_ASSET_ALWAYS_BYTES = 40 * 1024 * 1024   # sibling model/wasm >= 40MB → always redirect
HEAVY_ASSET_HEAVY_BYTES = 12 * 1024 * 1024    # >= 12MB but <40MB → redirect on low-RAM
HEAVY_ASSET_EXTS = {".bin", ".onnx", ".wasm", ".pt", ".gguf", ".tflite"}

ALWAYS_TAGS = {"webgpu", "ffmpeg-wasm", "transformers-js", "onnx-heavy", "heavy-asset"}
HEAVY_TAGS = {"mediapipe", "tfjs", "opencv-js", "medium-asset"}

# Files we scan within a tool directory.
SCAN_EXTS = {".html", ".js", ".mjs"}
MAX_SCAN_BYTES = 2 * 1024 * 1024  # skip anything over 2MB — bundles get noisy


def scan_file(path: Path) -> set[str]:
    try:
        if path.stat().st_size > MAX_SCAN_BYTES:
            return set()
        text = path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return set()
    hits: set[str] = set()
    for tag, rx in ALWAYS_MARKERS:
        if rx.search(text):
            hits.add(tag)
    for tag, rx in HEAVY_MARKERS:
        if rx.search(text):
            hits.add(tag)
    return hits


def scan_tool(tool_dir: Path) -> set[str]:
    reasons: set[str] = set()
    if not tool_dir.is_dir():
        return reasons
    for entry in tool_dir.iterdir():
        if not entry.is_file():
            continue
        ext = entry.suffix.lower()
        if ext in SCAN_EXTS:
            reasons |= scan_file(entry)
        elif ext in HEAVY_ASSET_EXTS:
            try:
                size = entry.stat().st_size
                if size >= HEAVY_ASSET_ALWAYS_BYTES:
                    reasons.add("heavy-asset")
                elif size >= HEAVY_ASSET_HEAVY_BYTES:
                    reasons.add("medium-asset")
            except OSError:
                pass
    return reasons


def main() -> int:
    if not TOOLS_JSON.exists():
        print(f"error: {TOOLS_JSON} not found", file=sys.stderr)
        return 1
    registry = json.loads(TOOLS_JSON.read_text(encoding="utf-8"))
    tools = registry.get("tools", [])

    incompat: dict[str, dict[str, object]] = {}
    for tool in tools:
        url = tool.get("url", "")
        if not url:
            continue
        rel = url.strip("/").replace("/", os.sep)
        tool_dir = ROOT / rel
        reasons = scan_tool(tool_dir)
        if not reasons:
            continue
        # Tier: "always" if any severe marker present; else "heavy" (low-RAM only).
        tier = "always" if (reasons & ALWAYS_TAGS) else "heavy"
        incompat[url] = {"tier": tier, "tags": sorted(reasons)}

    out = {
        "version": 2,
        "generated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "total": len(incompat),
        "tiers": {
            "always": sorted(ALWAYS_TAGS),
            "heavy": sorted(HEAVY_TAGS),
        },
        # Threshold the app uses to decide whether "heavy" tier triggers
        # redirect. Devices with less physical RAM than this (in MB) get the
        # aggressive rule. Kept in the manifest so we can tune without an
        # app release.
        "low_ram_threshold_mb": 4096,
        "tools": incompat,
    }
    OUT.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
    always_n = sum(1 for v in incompat.values() if v["tier"] == "always")
    heavy_n = len(incompat) - always_n
    print(f"webview-incompat.json: {len(incompat)} tools flagged "
          f"(always={always_n}, heavy={heavy_n})")
    tag_counts: dict[str, int] = {}
    for v in incompat.values():
        for t in v["tags"]:  # type: ignore[index]
            tag_counts[t] = tag_counts.get(t, 0) + 1
    for t, n in sorted(tag_counts.items(), key=lambda x: -x[1]):
        print(f"  {t}: {n}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
