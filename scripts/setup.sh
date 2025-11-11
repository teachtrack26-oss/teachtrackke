#!/bin/bash
# Setup script for TeachTrack CBC

echo "Setting up project dependencies..."
cd ../frontend && npm install
cd ../backend && pip install -r requirements.txt
