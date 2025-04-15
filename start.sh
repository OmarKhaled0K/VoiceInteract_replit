#!/bin/bash

# Kill any existing uvicorn processes
pkill -f uvicorn || true

# Start the uvicorn server with the FastAPI app
uvicorn app:app --host 0.0.0.0 --port 5000 --reload