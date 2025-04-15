#!/usr/bin/env python3
import uvicorn
import os

# This is our entry point for running with uvicorn directly
if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=int(os.environ.get("PORT", "5000")), log_level="info")