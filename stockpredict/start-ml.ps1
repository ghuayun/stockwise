# Starts the ML FastAPI backend in background and writes PID to .ml-backend.pid
# Usage: ./start-ml.ps1 [-Port 8000]
param(
    [int]$Port = 8000
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
$pidFile = Join-Path $scriptDir '.ml-backend.pid'
if (Test-Path $pidFile) {
    $existingPid = Get-Content $pidFile | Select-Object -First 1
    if ($existingPid -and (Get-Process -Id $existingPid -ErrorAction SilentlyContinue)) {
        Write-Host "ML backend already running (PID $existingPid)." -ForegroundColor Yellow
        exit 0
    } else {
        Remove-Item $pidFile -Force
    }
}

# Launch uvicorn main:app
$uvicornCmd = "-m uvicorn main:app --host 0.0.0.0 --port $Port"

$startInfo = New-Object System.Diagnostics.ProcessStartInfo
$startInfo.FileName = $venvPython
$startInfo.Arguments = $uvicornCmd
$startInfo.WorkingDirectory = $scriptDir
$startInfo.RedirectStandardOutput = $true
$startInfo.RedirectStandardError = $true
$startInfo.UseShellExecute = $false
$startInfo.CreateNoWindow = $true

$proc = [System.Diagnostics.Process]::Start($startInfo)
if (!$proc) { Write-Error 'Failed to start uvicorn process.' }

# Async capture output to log files
$stdOutFile = Join-Path $logsDir 'uvicorn_stdout.log'
$stdErrFile = Join-Path $logsDir 'uvicorn_stderr.log'

Start-Job -ScriptBlock {
    param($p, $outPath, $errPath)
    while (!$p.HasExited) {
        if (!$p.StandardOutput.EndOfStream) {
            $line = $p.StandardOutput.ReadLine(); Add-Content -Path $outPath -Value $line
        }
        if (!$p.StandardError.EndOfStream) {
            $eline = $p.StandardError.ReadLine(); Add-Content -Path $errPath -Value $eline
        }
        Start-Sleep -Milliseconds 200
    }
} -ArgumentList $proc, $stdOutFile, $stdErrFile | Out-Null

# Write PID
$proc.Id | Out-File $pidFile -Encoding ascii -NoNewline

Write-Host "Started ML backend (PID $($proc.Id)) on port $Port" -ForegroundColor Green
Write-Host "Logs: $stdOutFile / $stdErrFile" -ForegroundColor DarkGray
