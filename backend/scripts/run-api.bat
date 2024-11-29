@echo off
poetry run uvicorn "notebook.main:create_app" --reload