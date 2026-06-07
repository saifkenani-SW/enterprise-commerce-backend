#!/bin/bash

echo "🔍 Fetching IDs from API..."
echo ""

# User IDs
echo "📦 USERS:"
curl -s http://localhost:3000/users | jq -r '.[].id' | while read id; do
  echo "  '$id',"
done

echo ""
echo "📦 PRODUCTS:"
curl -s http://localhost:3000/products | jq -r '.[] | "  { id: \"\(.id)\", name: \"\(.name)\", price: \(.price) },"'