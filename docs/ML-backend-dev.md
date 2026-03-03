# ML Backend Development Workflow

This document explains how to start, stop, and check the health of the FastAPI ML backend, and how to run the entire stack together.

## Scripts

Located in `stockpredict/`:

- `start-ml.ps1` - Starts the ML backend in the background, writes PID to `.ml-backend.pid`, streams stdout/stderr into `logs/uvicorn_stdout.log` and `logs/uvicorn_stderr.log`.
- `stop-ml.ps1` - Gracefully stops (then force-kills if needed) the ML backend based on the stored PID.
- `health-ml.ps1` - Polls the health endpoint with retries; returns 0 exit code on success.

## Start the ML Backend

```powershell
# From repository root
powershell -ExecutionPolicy Bypass -File stockpredict/start-ml.ps1
# Optional custom port
powershell -ExecutionPolicy Bypass -File stockpredict/start-ml.ps1 -Port 8010
```

Check logs:
```powershell
Get-Content stockpredict/logs/uvicorn_stdout.log -Tail 50
Get-Content stockpredict/logs/uvicorn_stderr.log -Tail 50
```

## Health Check
```powershell
powershell -ExecutionPolicy Bypass -File stockpredict/health-ml.ps1
```
Expect output:
```
Healthy (HTTP 200)
{"status":"ok","version":"1.0.0"}
```

## Stop the Backend
```powershell
powershell -ExecutionPolicy Bypass -File stockpredict/stop-ml.ps1
```

## Run Full Dev Stack
Adds ML backend + Node API + Vite dev server concurrently.

```powershell
npm install
npm run dev:all
```

`dev:all` runs:
1. Node API: `npm run dev`
2. ML backend: `start-ml.ps1`
3. Vite frontend: `vite --host`

## Troubleshooting

| Symptom | Possible Cause | Fix |
|---------|----------------|-----|
| Health check fails | Backend not started or crashed | Inspect `uvicorn_stderr.log`; re-run start script |
| Port already in use | Previous process stuck | Run `stop-ml.ps1`; or `Get-Process -Id <PID> | Kill()` |
| PID file exists but process missing | Crash left stale PID | Run `stop-ml.ps1` (will clean stale file) then start again |
| Import errors on start | Missing venv packages | Activate venv: `stockpredict/.venv/Scripts/activate.ps1`; run `pip install -r requirements.txt` |

## Manual Start (Foreground)
If you need interactive logs:
```powershell
Set-Location stockpredict
./.venv/Scripts/python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000
```

## Notes
- Scripts assume the virtual environment lives at `stockpredict/.venv`.
- Logs rotate daily via `loguru` for application logs; uvicorn stdout/stderr are simple append-only.
- Adjust CORS or security settings before production deployment.

