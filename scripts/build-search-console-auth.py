#!/usr/bin/env python3
"""
One-time OAuth setup for Google Search Console API.
Run this once: python3 build-search-console-auth.py
It will open your browser to sign in, then save the token for future use.
"""
import json
import os
from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = [
    'https://www.googleapis.com/auth/webmasters.readonly',
    'https://www.googleapis.com/auth/webmasters',  # Needed for URL Inspection API
]
TOKEN_FILE = os.path.expanduser('~/.config/teamzlab/search-console-token.json')

# Use the API key's OAuth client (we'll create a simple one)
CLIENT_CONFIG = {
    "installed": {
        "client_id": "764086051850-6qr4p6gpi6hn506pt8ejuq83di341hur.apps.googleusercontent.com",
        "client_secret": "d-FL95Q19q7MQmFpd7hHD0Ty",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "redirect_uris": ["http://localhost"]
    }
}

def main():
    os.makedirs(os.path.dirname(TOKEN_FILE), exist_ok=True)

    flow = InstalledAppFlow.from_client_config(CLIENT_CONFIG, SCOPES)
    creds = flow.run_local_server(port=0, open_browser=True)

    token_data = {
        'token': creds.token,
        'refresh_token': creds.refresh_token,
        'token_uri': creds.token_uri,
        'client_id': creds.client_id,
        'client_secret': creds.client_secret,
        'scopes': list(creds.scopes) if creds.scopes else SCOPES
    }

    with open(TOKEN_FILE, 'w') as f:
        json.dump(token_data, f, indent=2)

    print(f'✅ Token saved to {TOKEN_FILE}')
    print(f'   Sign in as: {creds.token[:20]}...')
    print(f'   Now run: ./build-search-console.sh')

if __name__ == '__main__':
    main()
