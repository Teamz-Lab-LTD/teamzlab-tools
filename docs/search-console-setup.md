# Google Search Console API Setup Guide

## Quick Setup (any new machine)

### Step 1: Install Python dependencies
```bash
pip3 install --break-system-packages google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client requests
```

### Step 2: Run the auth script
```bash
cd "/path/to/teamzlab-tools"
python3 scripts/build-search-console-auth.py
```
- A browser window will open
- Sign in with **teamz.lab.contact@gmail.com**
- Allow access to Search Console
- Token is saved to `~/.config/teamzlab/search-console-token.json`

### Step 3: Run the data pull script
```bash
./scripts/build-search-console.sh
```

---

## What each file does

| File | Location | Purpose |
|------|----------|---------|
| `scripts/build-search-console-auth.py` | `scripts/` | One-time OAuth login — opens browser, saves token |
| `scripts/build-search-console.sh` | `scripts/` | Pulls Search Console data (queries, pages, indexing status) |
| `search-console-token.json` | `~/.config/teamzlab/` | OAuth token (auto-refreshes, NEVER commit this) |

---

## Google Cloud Setup (one-time, already done)

If you ever need to redo the Google Cloud side:

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Select project: **Teamzlab Tools** (`teamzlab-tools`)
3. APIs & Services → Library → Enable **"Google Search Console API"**
4. APIs & Services → Credentials → Create **API Key** (optional, for rate limiting)
   - Restrict to: Websites → `tool.teamzlab.com/*` + `localhost:9090/*`
   - Restrict API: Google Search Console API only

### Search Console property
- Property: `https://tool.teamzlab.com/`
- Account: `teamz.lab.contact@gmail.com`
- Sitemap: `https://tool.teamzlab.com/sitemap.xml` (auto-submitted by build scripts)

---

## Troubleshooting

### "Token expired"
Just re-run `python3 scripts/build-search-console-auth.py` — it will refresh.

### "No search data"
Google hasn't indexed your pages yet. Check indexing status:
```bash
./scripts/build-search-console.sh --status
```

### "API not enabled"
Go to Google Cloud Console → APIs & Services → Library → Search for "Google Search Console API" → Enable.

### "Quota exceeded"
The free tier allows 1,200 queries/day. The script uses ~5 queries per run, so you can run it ~240 times/day.

---

## Important: Security

- **NEVER commit** `~/.config/teamzlab/search-console-token.json`
- The auth script uses Google's public OAuth client ID (safe to commit)
- `scripts/build-search-console-auth.py` is in `.gitignore` as extra precaution
- API key `AIzaSyBXw0OZH1GEgllYpgKB_vHSpQh3S1ym7Do` is restricted to your domains only
