TOKEN=$(curl -s -X POST http://127.0.0.1:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "imily", "password": "202580"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['access'])")
