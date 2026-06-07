echo "// ============================================"
echo "// 🔑 توكنات ثابتة"
echo "// ============================================"
echo "let TOKENS = {"
for id in 11111111-0000-4000-8000-00000000000{0..9}; do
  TOKEN=$(curl -s -X POST http://localhost:3000/auth/token/generate \
  -H "Content-Type: application/json" \
    -d "{\"userId\":\"$id\",\"email\":\"user@test.com\"}" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['access_token'])" 2>/dev/null)
if [ -n "$TOKEN" ]; then
echo "  '$id': '$TOKEN',"
fi
done
echo "};"