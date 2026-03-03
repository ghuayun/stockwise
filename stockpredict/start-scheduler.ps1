# Starts the Python scheduler service in background
# Usage: ./start-scheduler.ps1 [-Time "17:00"]
param(
    [string]$Time = "17:00"
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

$venvPython = Join-Path $scriptDir '.venv/Scripts/python.exe'
if (!(Test-Path $venvPython)) {
    Write-Error "Python venv interpreter not found: $venvPython"
}

# Ensure logs directory exists
$logsDir = Join-Path $scriptDir 'logs'
if (!(Test-Path $logsDir)) { New-Item -ItemType Directory -Path $logsDir | Out-Null }

# If already running, prevent duplicate
$pidFile = Join-Path $scriptDir '.scheduler.pid'
if (Test-Path $pidFile) {
    $existingPid = Get-Content $pidFile | Select-Object -First 1
    if ($existingPid -and (Get-Process -Id $existingPid -ErrorAction SilentlyContinue)) {
        Write-Host "Scheduler already running (PID $existingPid)." -ForegroundColor Yellow
        exit 0
    } else {
        Remove-Item $pidFile -Force
    }
}

# Launch scheduler service
$schedulerCmd = "scheduler_service.py --time $Time"

$startInfo = New-Object System.Diagnostics.ProcessStartInfo
$startInfo.FileName = $venvPython
$startInfo.Arguments = $schedulerCmd
$startInfo.WorkingDirectory = $scriptDir
$startInfo.RedirectStandardOutput = $true
$startInfo.RedirectStandardError = $true
$startInfo.UseShellExecute = $false
$startInfo.CreateNoWindow = $true

$proc = [System.Diagnostics.Process]::Start($startInfo)
if (!$proc) { Write-Error 'Failed to start scheduler service process.' }

# Async capture output to log files
$stdOutFile = Join-Path $logsDir 'scheduler_stdout.log'
$stdErrFile = Join-Path $logsDir 'scheduler_stderr.log'

$outTask = [System.IO.File]::AppendAllTextAsync($stdOutFile, "")
$errTask = [System.IO.File]::AppendAllTextAsync($stdErrFile, "")

Register-ObjectEvent -InputObject $proc -EventName OutputDataReceived -Action {
    $data = $Event.SourceEventArgs.Data
    if ($data) {
        [System.IO.File]::AppendAllText($using:stdOutFile, "$data`n")
    }
}

Register-ObjectEvent -InputObject $proc -EventName ErrorDataReceived -Action {
    $data = $Event.SourceEventArgs.Data
    if ($data) {
        [System.IO.File]::AppendAllText($using:stdErrFile, "$data`n")
    }
}

$proc.BeginOutputReadLine()
$proc.BeginErrorReadLine()

# Save PID
$proc.Id | Out-File -FilePath $pidFile -Encoding UTF8

Write-Host "Scheduler service started (PID $($proc.Id))" -ForegroundColor Green
Write-Host "  Schedule: $Time on weekdays (Mon-Fri)" -ForegroundColor Gray
Write-Host "  Logs: $logsDir" -ForegroundColor Gray
Write-Host "`nManagement:" -ForegroundColor Cyan
Write-Host "  Stop:   .\stop-scheduler.ps1"
Write-Host "  Logs:   Get-Content $stdOutFile -Tail 20"
Write-Host "  Test:   .\.venv\Scripts\python.exe scheduler_service.py --test"
