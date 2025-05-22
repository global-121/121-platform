#!/bin/bash
set -Eeuo pipefail

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 transaction_id"
    exit 1
fi

TRANSACTION_ID="$1"

echo "🧪🧪🧪🧪🧪🧪🧪🧪🧪🧪"
echo "enquiry v2"
npx tsx src/enquiryv2.ts "$TRANSACTION_ID"
