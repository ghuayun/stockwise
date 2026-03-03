# Checks ML backend health endpoint with retries
# Usage: ./health-ml.ps1 [-Port 8000] [-Retries 5] [-DelaySeconds 1]
param(
    [int]$Port = 8000,
    [int]$Retries = 5,
    [int]$DelaySeconds = 1
)

$ErrorActionPreference = 'Stop'

$url = "http://127.0.0.1:$Port/api/health"
for ($i = 1; $i -le $Retries; $i++) {
    try {
        $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5
        if ($resp.StatusCode -eq 200) {
            Write-Host "Healthy (HTTP 200)" -ForegroundColor Green
            Write-Host $resp.Content
            exit 0
        } else {
            Write-Host "Attempt $($i): Unexpected status $($resp.StatusCode)" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Attempt $i failed: $($_.Exception.Message)" -ForegroundColor DarkYellow
    }
    Start-Sleep -Seconds $DelaySeconds
}
Write-Host "Health check failed after $Retries attempts." -ForegroundColor Red
exit 1
