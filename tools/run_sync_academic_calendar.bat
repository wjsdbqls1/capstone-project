@echo off
set ROOT=C:\Users\ybjeo\OneDrive\Desktop\CapstoneDesign
set VENV=%ROOT%\.venv
set BACKEND=%ROOT%\backend

set LOGDIR=C:\uploads\logs
set LOG=%LOGDIR%\sync_academic_calendar.log

if not exist %LOGDIR% mkdir %LOGDIR%

cd /d %BACKEND%
call "%VENV%\Scripts\activate.bat"

python .\scripts\sync_academic_calendar.py >> "%LOG%" 2>&1
