# Stops the ML FastAPI backend using PID stored in .ml-backend.pid
# Usage: ./stop-ml.ps1
$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir
$pidFile = Join-Path $scriptDir '.ml-backend.pid'

if (!(Test-Path $pidFile)) {
    Write-Host 'ML backend is not running (PID file missing).' -ForegroundColor Yellow
    exit 0
}

$mlPid = Get-Content $pidFile | Select-Object -First 1
if (-not $mlPid) {
    Write-Host 'PID file empty; removing.' -ForegroundColor Yellow
    Remove-Item $pidFile -Force
    exit 0
}

$proc = Get-Process -Id $mlPid -ErrorAction SilentlyContinue
if ($proc) {
    Write-Host "Stopping ML backend (PID $mlPid)..." -ForegroundColor Cyan
    try {
        $proc.CloseMainWindow() | Out-Null
        Start-Sleep -Seconds 1
        if (!$proc.HasExited) { $proc.Kill() }
        Write-Host 'Stopped.' -ForegroundColor Green
    } catch {
        Write-Host "Failed graceful stop; killing process $mlPid" -ForegroundColor Red
        Stop-Process -Id $mlPid -Force -ErrorAction SilentlyContinue
    }
} else {
    Write-Host 'Process not found; removing stale PID file.' -ForegroundColor Yellow
}

Remove-Item $pidFile -Force
