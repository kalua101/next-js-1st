# PowerShell script to start the backend server
# Run with: .\start-backend.ps1

Write-Host "🚀 Starting AddisFarmers Backend Server..." -ForegroundColor Green
Write-Host ""

# Check if virtual environment exists
if (Test-Path "venv") {
    Write-Host "✓ Activating virtual environment..." -ForegroundColor Cyan
    & "venv\Scripts\Activate.ps1"
} else {
    Write-Host "⚠️  No virtual environment found. Creating one..." -ForegroundColor Yellow
    python -m venv venv
    & "venv\Scripts\Activate.ps1"
    Write-Host "✓ Installing dependencies..." -ForegroundColor Cyan
    pip install -r backend\requirements.txt
}

Write-Host ""
Write-Host "🔄 Testing database connection..." -ForegroundColor Cyan
python -m backend.test_connection

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Database connection successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 Starting server at http://127.0.0.1:8000" -ForegroundColor Green
    Write-Host "📚 API Docs available at http://127.0.0.1:8000/docs" -ForegroundColor Green
    Write-Host ""
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
    Write-Host ""
    
    uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
} else {
    Write-Host ""
    Write-Host "❌ Database connection failed. Please check your .env file" -ForegroundColor Red
    Write-Host "   Update backend\.env with your Supabase credentials" -ForegroundColor Yellow
}
