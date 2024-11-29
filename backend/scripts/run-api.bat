@echo off
poetry run uvicorn "notebook.main:create_app" --factory --reload --host 0.0.0.0 --port 8000