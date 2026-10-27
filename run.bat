@echo off
TITLE MannuMitra - AI-Based Predictive Farming System
cd /d "%~dp0\backend"
echo =====================================================================
echo Starting MannuMitra AI-Based Predictive Farming System...
echo Backend API URL:  http://127.0.0.1:8000/api/health
echo Frontend UI URL: http://127.0.0.1:8000/ui/
echo API Docs URL:     http://127.0.0.1:8000/docs
echo =====================================================================
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
