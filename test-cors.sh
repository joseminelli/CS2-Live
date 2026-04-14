#!/bin/bash

# Script para testar se o backend está respondendo corretamente com CORS headers

echo "🧪 Testando Backend em Localhost..."
echo ""

echo "1️⃣  Test CORS Headers (Preflight):"
curl -i -X OPTIONS http://localhost:5000/api/matches/upcoming \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  2>/dev/null | grep -i "access-control"

echo ""
echo "2️⃣  Test Actual Request:"
curl -H "Origin: http://localhost:3000" http://localhost:5000/api/health 2>/dev/null | jq . 2>/dev/null || echo "Erro ao fazer requisição"

echo ""
echo "---"
echo "🌐 Testando Backend em Produção (Vercel)..."
echo ""

echo "1️⃣  Test CORS Headers (Preflight):"
curl -i -X OPTIONS https://cs-2-live.vercel.app/api/matches/upcoming \
  -H "Origin: https://seu-frontend.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  2>/dev/null | grep -i "access-control"

echo ""
echo "2️⃣  Test Actual Request:"
curl -H "Origin: https://seu-frontend.vercel.app" https://cs-2-live.vercel.app/api/health 2>/dev/null | jq . 2>/dev/null || echo "Erro ao fazer requisição"

echo ""
echo "✅ Testes concluídos!"
