#!/usr/bin/env python3
"""
Request Google to index your pages via URL Inspection API.
Run: python3 build-request-indexing.py
"""
import json
import os
from google_auth_oauthlib.flow import InstalledAppFlow
from google.oauth2.credentials import Credentials
import requests

SCOPES = [
    'https://www.googleapis.com/auth/webmasters',
    'https://www.googleapis.com/auth/indexing'
]
TOKEN_FILE = os.path.expanduser('~/.config/teamzlab/indexing-token.json')

CLIENT_CONFIG = {
    "installed": {
        "client_id": "764086051850-6qr4p6gpi6hn506pt8ejuq83di341hur.apps.googleusercontent.com",
        "client_secret": "d-FL95Q19q7MQmFpd7hHD0Ty",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "redirect_uris": ["http://localhost"]
    }
}

def get_creds():
    if os.path.exists(TOKEN_FILE):
        with open(TOKEN_FILE) as f:
            td = json.load(f)
        creds = Credentials(
            token=td['token'], refresh_token=td['refresh_token'],
            token_uri=td['token_uri'], client_id=td['client_id'],
            client_secret=td['client_secret'], scopes=SCOPES
        )
        if creds.valid:
            return creds
        # Try refresh
        try:
            r = requests.post('https://oauth2.googleapis.com/token', data={
                'client_id': td['client_id'], 'client_secret': td['client_secret'],
                'refresh_token': td['refresh_token'], 'grant_type': 'refresh_token'
            })
            if r.status_code == 200:
                td['token'] = r.json()['access_token']
                with open(TOKEN_FILE, 'w') as f:
                    json.dump(td, f, indent=2)
                return Credentials(token=td['token'], refresh_token=td['refresh_token'],
                    token_uri=td['token_uri'], client_id=td['client_id'],
                    client_secret=td['client_secret'], scopes=SCOPES)
        except:
            pass

    # Fresh auth
    os.makedirs(os.path.dirname(TOKEN_FILE), exist_ok=True)
    flow = InstalledAppFlow.from_client_config(CLIENT_CONFIG, SCOPES)
    creds = flow.run_local_server(port=0, open_browser=True)
    with open(TOKEN_FILE, 'w') as f:
        json.dump({
            'token': creds.token, 'refresh_token': creds.refresh_token,
            'token_uri': creds.token_uri, 'client_id': creds.client_id,
            'client_secret': creds.client_secret, 'scopes': SCOPES
        }, f, indent=2)
    return creds

def main():
    creds = get_creds()
    headers = {
        'Authorization': f'Bearer {creds.token}',
        'x-goog-user-project': 'teamzlab-tools',
        'Content-Type': 'application/json'
    }

    pages = [
        'https://tool.teamzlab.com/',
        'https://tool.teamzlab.com/health/',
        'https://tool.teamzlab.com/dev/',
        'https://tool.teamzlab.com/evergreen/',
        'https://tool.teamzlab.com/tools/',
        'https://tool.teamzlab.com/math/',
        'https://tool.teamzlab.com/ramadan/',
        'https://tool.teamzlab.com/health/iq-test/',
        'https://tool.teamzlab.com/health/childhood-trauma-test/',
        'https://tool.teamzlab.com/health/ovulation-calculator/',
        'https://tool.teamzlab.com/health/couples-compatibility-test/',
        'https://tool.teamzlab.com/health/love-language-quiz/',
        'https://tool.teamzlab.com/tools/countdown-timer/',
        'https://tool.teamzlab.com/tools/stopwatch/',
        'https://tool.teamzlab.com/evergreen/temperature-converter/',
        'https://tool.teamzlab.com/evergreen/personal-loan-calculator/',
        'https://tool.teamzlab.com/evergreen/tax-calculator/',
        'https://tool.teamzlab.com/evergreen/home-insurance-calculator/',
        'https://tool.teamzlab.com/math/roman-numeral-converter/',
        'https://tool.teamzlab.com/ramadan/eid-salami-cheque-book/',
        'https://tool.teamzlab.com/ramadan/eid-salami-qr-card-generator/',
        'https://tool.teamzlab.com/health/tdee-calculator/',
        'https://tool.teamzlab.com/health/bmi-health-checker/',
        'https://tool.teamzlab.com/tools/typing-speed-test/',
        'https://tool.teamzlab.com/tools/world-clock/',
        'https://tool.teamzlab.com/bd/salary-tax-calculator/',
        'https://tool.teamzlab.com/tools/truth-or-dare-couples/',
        'https://tool.teamzlab.com/tools/date-night-generator/',
        'https://tool.teamzlab.com/dev/json-formatter/',
        'https://tool.teamzlab.com/dev/hex-to-rgb/',
    ]

    print(f'Requesting indexing for {len(pages)} pages...\n')

    # Try Indexing API first
    success = 0
    for url in pages:
        r = requests.post(
            'https://indexing.googleapis.com/v3/urlNotifications:publish',
            headers=headers,
            json={'url': url, 'type': 'URL_UPDATED'}
        )
        if r.status_code == 200:
            print(f'  ✅ {url}')
            success += 1
        else:
            err = r.json().get('error', {}).get('message', '')[:60]
            print(f'  ❌ {url} — {err}')

    print(f'\n✅ {success}/{len(pages)} pages submitted for indexing')

    if success == 0:
        print('\n⚠️  Indexing API failed. The Indexing API is only for JobPosting/BroadcastEvent pages.')
        print('For regular pages, use Search Console UI:')
        print('  1. Go to https://search.google.com/search-console')
        print('  2. Select tool.teamzlab.com')
        print('  3. URL Inspection → paste URL → Request Indexing')
        print('  4. Do this for your top 10-20 most important pages')

if __name__ == '__main__':
    main()
