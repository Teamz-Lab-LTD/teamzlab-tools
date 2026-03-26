#!/bin/bash
# Newsletter subscriber export — fetches from Firebase RTDB
# Uses Firebase CLI (handles auth automatically)
#
# Usage:
#   ./newsletter-export.sh           # List all subscribers
#   ./newsletter-export.sh --csv     # Export as CSV
#   ./newsletter-export.sh --count   # Just show count
#
# Prerequisites: firebase-tools installed (npm install -g firebase-tools)
# Auth: firebase login (one-time)

PROJECT="teamzlab-tools"
DB_PATH="/newsletter/subscribers"
MODE="${1:-list}"

# Check if firebase CLI is available
if ! command -v firebase &> /dev/null; then
  echo "Firebase CLI not found. Install with: npm install -g firebase-tools"
  echo ""
  echo "Alternative: view subscribers in Firebase Console:"
  echo "  https://console.firebase.google.com/project/$PROJECT/database/teamzlab-tools-default-rtdb/data/newsletter/subscribers"
  exit 1
fi

# Fetch data via Firebase CLI
DATA=$(firebase database:get "$DB_PATH" --project "$PROJECT" 2>/dev/null)

if [ -z "$DATA" ] || [ "$DATA" = "null" ]; then
  echo "No subscribers yet."
  exit 0
fi

case "$MODE" in
  --count)
    echo "$DATA" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f'Total subscribers: {len(data)}')
"
    ;;
  --csv)
    echo "$DATA" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print('email,subscribed_at,source,status')
for key, sub in sorted(data.items(), key=lambda x: x[1].get('subscribedAt', '')):
    email = sub.get('email', '')
    date = sub.get('subscribedAt', '')[:19]
    source = sub.get('source', '/')
    status = sub.get('status', 'active')
    print(f'{email},{date},{source},{status}')
"
    ;;
  *)
    echo "$DATA" | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f'Newsletter Subscribers: {len(data)}')
print('=' * 60)
print(f'{\"Email\":<35} {\"Date\":<12} {\"Source\":<20}')
print('-' * 60)
for key, sub in sorted(data.items(), key=lambda x: x[1].get('subscribedAt', '')):
    email = sub.get('email', 'N/A')
    date = sub.get('subscribedAt', 'N/A')[:10]
    source = sub.get('source', '/')
    print(f'{email:<35} {date:<12} {source:<20}')
"
    ;;
esac
