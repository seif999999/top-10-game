Write-Host "Starting Top 10 Multiplayer Server..." -ForegroundColor Green
Write-Host ""
Write-Host "Make sure you have Node.js installed and dependencies installed." -ForegroundColor Yellow
Write-Host ""

# Check if server dependencies are installed
if (-not (Test-Path "server\node_modules")) {
    Write-Host "Installing server dependencies..." -ForegroundColor Yellow
    Set-Location server
    npm install
    Set-Location ..
}

# Start the server
Set-Location server
npm start
Set-Location ..




