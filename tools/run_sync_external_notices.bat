@echo off
set ROOT=C:\Users\ybjeo\OneDrive\Desktop\CapstoneDesign
set VENV=%ROOT%\.venv
set BACKEND=%ROOT%\backend
set LOGDIR=C:\uploads\logs
set LOG=%LOGDIR%\sync_external_notices.log

if not exist %LOGDIR% mkdir %LOGDIR%

cd /d %BACKEND%

call "%VENV%\Scripts\activate.bat"

python .\scripts\sync_external_notices.py >> "%LOG%" 2>&1
