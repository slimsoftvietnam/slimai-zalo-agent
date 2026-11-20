@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\install-skill.ps1"
if errorlevel 1 (
  echo SlimAI setup did not finish. Read the error above and retry.
  pause
  exit /b 1
)
pause
