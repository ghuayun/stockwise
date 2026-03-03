# Stops the Python scheduler service
$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$pidFile = Join-Path $scriptDir '.scheduler.pid'

if (!(Test-Path $pidFile)) {
    Write-Host "No scheduler service is running (PID file not found)." -ForegroundColor Yellow
    exit 0
}

$servicePid = Get-Content $pidFile | Select-Object -First 1
Remove-Item $pidFile -Force

$proc = Get-Process -Id $servicePid -ErrorAction SilentlyContinue
if (!$proc) {
    Write-Host "Scheduler service is not running (PID $servicePid not found)." -ForegroundColor Yellow
    exit 0
}

Stop-Process -Id $servicePid -Force
Write-Host "Scheduler service stopped (PID $servicePid)." -ForegroundColor Green
