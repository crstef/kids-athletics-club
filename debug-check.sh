#!/bin/bash

echo "🔍 Verificare Probleme Aplicație"
echo "================================="
echo ""

# Verificare 1: Server rulează?
echo "1. Verificare server backend..."
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Server backend rulează pe portul 3001"
else
    echo "❌ Server backend NU rulează"
fi
echo ""

# Verificare 2: Baza de date PostgreSQL
echo "2. Verificare conexiune PostgreSQL..."
if command -v psql &> /dev/null; then
    echo "PostgreSQL client instalat"
    # Try to connect
    PGPASSWORD=postgres psql -U postgres -d clubdb -c "\dt" 2>&1 | head -5
else
    echo "⚠️  psql nu este disponibil în container"
fi
echo ""

# Verificare 3: Test API Users (fără autentificare)
echo "3. Test API /api/users (va eșua fără token valid)..."
curl -s http://localhost:3001/api/users 2>&1 | head -100
echo ""
echo ""

# Verificare 4: Frontend rulează?
echo "4. Verificare frontend..."
if curl -s http://localhost:5000 > /dev/null 2>&1; then
    echo "✅ Frontend rulează pe portul 5000"
else
    echo "❌ Frontend NU rulează"
fi
echo ""

echo "================================="
echo "Verificări complete!"
