# publish.ps1 - Create a single-folder production build for Tejco ERP
$PublishDir = "dist"

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  Tejco ERP - Creating Production Bundle" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

# 1. Clean previous build
if (Test-Path $PublishDir) {
    Write-Host "Cleaning existing $PublishDir folder..." -ForegroundColor Gray
    Remove-Item -Path $PublishDir -Recurse -Force
}

# 2. Build the application
Write-Host "[1/4] Building Next.js application..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error "Build failed."; exit }

# 3. Create the distribution folder
Write-Host "[2/4] Creating '$PublishDir' folder structure..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $PublishDir | Out-Null

# 4. Copy Standalone files
Write-Host "[3/4] Copying standalone server files..." -ForegroundColor Yellow
Copy-Item -Path ".next\standalone\*" -Destination $PublishDir -Recurse -Force

# 5. Copy Static and Public assets
Write-Host "[4/4] Copying assets and configs..." -ForegroundColor Yellow

# Create necessary subfolders
New-Item -ItemType Directory -Path "$PublishDir\.next\static" -Force | Out-Null
New-Item -ItemType Directory -Path "$PublishDir\public" -Force | Out-Null

# Copy static assets
Copy-Item -Path ".next\static\*" -Destination "$PublishDir\.next\static" -Recurse -Force
Copy-Item -Path "public\*" -Destination "$PublishDir\public" -Recurse -Force

# Copy Server-specific configs
Copy-Item -Path "web.config" -Destination $PublishDir -Force
Copy-Item -Path "ecosystem.config.js" -Destination $PublishDir -Force
if (Test-Path ".env.production") {
    Copy-Item -Path ".env.production" -Destination $PublishDir -Force
}

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  Success! Your production build is ready in: ./$PublishDir" -ForegroundColor Green
Write-Host "  To deploy, simply copy the '$PublishDir' folder to your server." -ForegroundColor White
Write-Host "  Run it with: pm2 start ecosystem.config.js" -ForegroundColor Gray
Write-Host "======================================================" -ForegroundColor Cyan
