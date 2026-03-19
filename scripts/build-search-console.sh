#!/bin/bash
# =============================================================
#  Teamz Lab Tools — Search Console Data Pull
#  Usage: ./build-search-console.sh [--status|--queries|--pages|--all]
#  Requires: python3 + google API libs + OAuth token
#  Setup: see docs/search-console-setup.md
# =============================================================

set -e
cd "$(dirname "$0")"

TOKEN_FILE="$HOME/.config/teamzlab/search-console-token.json"
SITE_URL="https://tool.teamzlab.com/"

# Check dependencies
if ! python3 -c "import requests" 2>/dev/null; then
  echo "ERROR: Missing Python dependencies. Run:"
  echo "  pip3 install --break-system-packages google-auth google-auth-oauthlib requests"
  exit 1
fi

# Check token
if [ ! -f "$TOKEN_FILE" ]; then
  echo "ERROR: No Search Console token found."
  echo "Run: python3 build-search-console-auth.py"
  echo "See: docs/search-console-setup.md"
  exit 1
fi

MODE="${1:---all}"

python3 - "$MODE" "$TOKEN_FILE" "$SITE_URL" << 'PYEOF'
import json, sys, requests
from datetime import datetime, timedelta
from urllib.parse import quote

MODE = sys.argv[1]
TOKEN_FILE = sys.argv[2]
SITE_URL = sys.argv[3]
ENCODED_SITE = quote(SITE_URL, safe='')

with open(TOKEN_FILE) as f:
    token_data = json.load(f)

# Refresh token if needed
def get_fresh_token():
    """Try existing token, refresh if expired."""
    token = token_data.get('token', '')
    # Test token
    r = requests.get(
        f'https://searchconsole.googleapis.com/webmasters/v3/sites',
        headers={'Authorization': f'Bearer {token}', 'x-goog-user-project': 'teamzlab-tools'}
    )
    if r.status_code == 200:
        return token
    # Refresh
    refresh = token_data.get('refresh_token')
    if not refresh:
        print("ERROR: Token expired. Re-run: python3 build-search-console-auth.py")
        sys.exit(1)
    rr = requests.post('https://oauth2.googleapis.com/token', data={
        'client_id': token_data['client_id'],
        'client_secret': token_data['client_secret'],
        'refresh_token': refresh,
        'grant_type': 'refresh_token'
    })
    if rr.status_code == 200:
        new_token = rr.json()['access_token']
        token_data['token'] = new_token
        with open(TOKEN_FILE, 'w') as f:
            json.dump(token_data, f, indent=2)
        return new_token
    print("ERROR: Token refresh failed. Re-run: python3 build-search-console-auth.py")
    sys.exit(1)

token = get_fresh_token()
headers = {
    'Authorization': f'Bearer {token}',
    'x-goog-user-project': 'teamzlab-tools',
    'Content-Type': 'application/json'
}
API_BASE = f'https://searchconsole.googleapis.com/webmasters/v3/sites/{ENCODED_SITE}'

end_date = (datetime.now() - timedelta(days=3)).strftime('%Y-%m-%d')
start_date = (datetime.now() - timedelta(days=90)).strftime('%Y-%m-%d')
start_date_7d = (datetime.now() - timedelta(days=10)).strftime('%Y-%m-%d')

def query_search(dimensions, row_limit=50, start=start_date, end=end_date):
    r = requests.post(f'{API_BASE}/searchAnalytics/query', headers=headers, json={
        'startDate': start, 'endDate': end,
        'dimensions': dimensions, 'rowLimit': row_limit
    })
    return r.json().get('rows', [])

print("=" * 70)
print("  SEARCH CONSOLE REPORT — tool.teamzlab.com")
print(f"  Period: {start_date} to {end_date}")
print("=" * 70)

# --- Indexing Status ---
if MODE in ('--status', '--all'):
    print("\n📊 INDEXING STATUS")
    print("-" * 50)
    r = requests.get(f'{API_BASE}/sitemaps', headers=headers)
    sitemaps = r.json()
    if 'sitemap' in sitemaps:
        for s in sitemaps['sitemap']:
            contents = s.get('contents', [{}])[0]
            print(f"  Sitemap: {s.get('path','?')}")
            print(f"  Submitted: {contents.get('submitted','?')} URLs")
            print(f"  Indexed:   {contents.get('indexed','?')} URLs")
            print(f"  Last downloaded: {s.get('lastDownloaded','?')}")
    else:
        print("  No sitemaps found")

# --- Top Queries ---
if MODE in ('--queries', '--all'):
    print("\n🔍 TOP SEARCH QUERIES (Last 90 days)")
    print("-" * 90)
    rows = query_search(['query'], 30)
    if rows:
        print(f"  {'Keyword':<45} {'Clicks':>7} {'Impr':>8} {'CTR':>7} {'Pos':>6}")
        print("  " + "-" * 75)
        total_clicks = 0
        total_impr = 0
        for row in rows:
            q = row['keys'][0][:45]
            c = row.get('clicks', 0)
            i = row.get('impressions', 0)
            ctr = row.get('ctr', 0) * 100
            pos = row.get('position', 0)
            total_clicks += c
            total_impr += i
            print(f"  {q:<45} {c:>7} {i:>8} {ctr:>6.1f}% {pos:>5.1f}")
        print(f"\n  Total: {total_clicks} clicks, {total_impr} impressions")
    else:
        print("  No search query data yet (site may not be indexed)")

# --- Top Pages ---
if MODE in ('--pages', '--all'):
    print("\n📄 TOP PAGES (Last 90 days)")
    print("-" * 90)
    rows = query_search(['page'], 25)
    if rows:
        print(f"  {'Page':<55} {'Clicks':>7} {'Impr':>8} {'Pos':>6}")
        print("  " + "-" * 78)
        for row in rows:
            page = row['keys'][0].replace('https://tool.teamzlab.com', '')[:55]
            c = row.get('clicks', 0)
            i = row.get('impressions', 0)
            pos = row.get('position', 0)
            print(f"  {page:<55} {c:>7} {i:>8} {pos:>5.1f}")
    else:
        print("  No page data yet (site may not be indexed)")

# --- Device breakdown ---
if MODE in ('--all',):
    print("\n📱 DEVICE BREAKDOWN")
    print("-" * 50)
    rows = query_search(['device'])
    if rows:
        for row in rows:
            device = row['keys'][0]
            c = row.get('clicks', 0)
            i = row.get('impressions', 0)
            print(f"  {device:<15} {c:>7} clicks  {i:>8} impressions")
    else:
        print("  No device data yet")

# --- Country breakdown ---
if MODE in ('--all',):
    print("\n🌍 TOP COUNTRIES")
    print("-" * 50)
    rows = query_search(['country'], 15)
    if rows:
        for row in rows:
            country = row['keys'][0]
            c = row.get('clicks', 0)
            i = row.get('impressions', 0)
            print(f"  {country:<10} {c:>7} clicks  {i:>8} impressions")
    else:
        print("  No country data yet")

print("\n" + "=" * 70)
print("  Run: ./build-search-console.sh --queries   (queries only)")
print("  Run: ./build-search-console.sh --pages     (pages only)")
print("  Run: ./build-search-console.sh --status    (indexing only)")
print("  Docs: docs/search-console-setup.md")
print("=" * 70)
PYEOF
