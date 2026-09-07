# publish.ps1 - Create production static build for Tejco ERP on IIS Windows Server
$PublishDir = "dist"

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  Tejco ERP - Creating Production Bundle (Vite SPA)" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

# 1. Clean previous build
if (Test-Path $PublishDir) {
    Write-Host "Cleaning existing $PublishDir folder..." -ForegroundColor Gray
    Remove-Item -Path $PublishDir -Recurse -Force
}

# 2. Build the application
Write-Host "[1/2] Building Vite application..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error "Build failed."; exit }

# 3. Verify web.config exists in dist
if (Test-Path "$PublishDir\web.config") {
    Write-Host "[2/2] IIS web.config included in production bundle." -ForegroundColor Green
} else {
    Write-Host "[2/2] Copying web.config to production bundle..." -ForegroundColor Yellow
    Copy-Item -Path "web.config" -Destination $PublishDir -Force
}

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  Success! Production build created in: ./$PublishDir" -ForegroundColor Green
Write-Host "  To deploy on Windows Server IIS:" -ForegroundColor White
Write-Host "    1. Copy all contents of ./$PublishDir to IIS site directory" -ForegroundColor Gray
Write-Host "    2. Ensure URL Rewrite 2.0 module is installed on IIS" -ForegroundColor Gray
Write-Host "======================================================" -ForegroundColor Cyan
