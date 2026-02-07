#!/bin/bash
# Start script for Render

# Exit on error
set -e

# Run Gunicorn
# Adjust the workers and threads based on your instance size
exec gunicorn app.main:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:$PORT
