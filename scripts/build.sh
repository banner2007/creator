#!/bin/bash
# Exit on error
set -e

echo "========================================="
echo "Building Creator Shopy SaaS Application"
echo "========================================="

# 1. Install Backend Dependencies
echo "Installing backend dependencies..."
cd backend
npm install
cd ..

# 2. Install Frontend Dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

# 3. Compile React Client Assets
echo "Compiling frontend assets with Vite..."
cd frontend
npm run build
cd ..

echo "========================================="
echo "Build completed successfully!"
echo "========================================="
