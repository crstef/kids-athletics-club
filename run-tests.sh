#!/bin/bash

echo "=========================================="
echo "Running Unit and Integration Tests"
echo "=========================================="
echo ""

echo "Running all tests..."
npm test -- --run --reporter=verbose

echo ""
echo "=========================================="
echo "Test execution completed!"
echo "=========================================="
