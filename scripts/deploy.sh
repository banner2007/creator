#!/bin/bash
echo "========================================="
echo "Deploying Creator Shopy SaaS (Docker)"
echo "========================================="

# 1. Stop existing services
echo "Stopping existing containers..."
docker-compose down

# 2. Build and start in detached mode
echo "Rebuilding and launching services in the background..."
docker-compose up --build -d

echo "========================================="
echo "Deployment initiated!"
echo "- Client running on: http://localhost:80"
echo "- Backend API running on: http://localhost:3000"
echo "========================================="
