# Schedule daily_update.py to run automatically using Windows Task Scheduler
# This script creates a sc`heduled task that runs daily at 5:00 PM (after market close)
# Usage: Run as Administrator: .\schedule-daily-update.ps1

param(
    [string]$Time = "17:00",  # Default: 5:00 PM (after market close at 4:00 PM EST)
    [string]$TaskName = "StockWiseInvest-DailyUpdate"
)

$ErrorActionPreference = 'Stop'

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Error "This script must be run as Administrator to create scheduled tasks."
    Write-Host "Please right-click PowerShell and select 'Run as Administrator', then run this script again." -ForegroundColor Yellow
    exit 1
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$venvPython = Join-Path $scriptDir '.venv\Scripts\python.exe'
$dailyUpdateScript = Join-Path $scriptDir 'scripts\daily_update.py'

# Verify files exist
if (!(Test-Path $venvPython)) {
    Write-Error "Python venv not found: $venvPython"
}
if (!(Test-Path $dailyUpdateScript)) {
    Write-Error "Daily update script not found: $dailyUpdateScript"
}

Write-Host "Setting up scheduled task: $TaskName" -ForegroundColor Cyan
Write-Host "  Python: $venvPython" -ForegroundColor Gray
Write-Host "  Script: $dailyUpdateScript" -ForegroundColor Gray
Write-Host "  Time: $Time (weekdays only)" -ForegroundColor Gray

# Remove existing task if it exists
$existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "Removing existing task..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

# Create the scheduled task action
$action = New-ScheduledTaskAction `
    -Execute $venvPython `
    -Argument "`"$dailyUpdateScript`"" `
    -WorkingDirectory $scriptDir

# Create the trigger (daily at specified time, Monday-Friday only)
$trigger = New-ScheduledTaskTrigger `
    -Weekly `
    -DaysOfWeek Monday, Tuesday, Wednesday, Thursday, Friday `
    -At $Time

# Create task settings
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Hours 2)

# Create the principal (run as current user)
$principal = New-ScheduledTaskPrincipal `
    -UserId $env:USERNAME `
    -LogonType S4U `
    -RunLevel Limited

# Register the task
$task = Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Principal $principal `
    -Description "Runs StockWiseInvest daily update to fetch stock data, calculate indicators, and generate predictions after market close."

Write-Host ""
Write-Host "SUCCESS: Scheduled task created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Task Details:" -ForegroundColor Cyan
Write-Host "  Name: $TaskName"
Write-Host "  Schedule: Weekdays (Mon-Fri) at $Time"
Write-Host "  Next Run: $((Get-ScheduledTask -TaskName $TaskName).Triggers[0].StartBoundary)"

Write-Host "`nManagement Commands:" -ForegroundColor Cyan
Write-Host "  View task:   Get-ScheduledTask -TaskName '$TaskName' | Format-List"
Write-Host "  Run now:     Start-ScheduledTask -TaskName '$TaskName'"
Write-Host "  Disable:     Disable-ScheduledTask -TaskName '$TaskName'"
Write-Host "  Enable:      Enable-ScheduledTask -TaskName '$TaskName'"
Write-Host "  Remove:      Unregister-ScheduledTask -TaskName '$TaskName' -Confirm:`$false"
Write-Host "  View logs:   Get-ScheduledTask -TaskName '$TaskName' | Get-ScheduledTaskInfo"

$logsPath = Join-Path $scriptDir "logs"
Write-Host ""
Write-Host "Log files will be written to: $logsPath" -ForegroundColor Gray
