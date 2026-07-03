# build-package.ps1
# This script builds the Next.js app and packages ALL necessary files 
# into a single "tejco-release" folder, ready to be copied to IIS.

$source = "d:\repository\tejco"
$dest   = "$source\tejco-release"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   Tejco ERP - Building Single Release Folder" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Step 1: Build the Next.js application
Write-Host "`n[1/3] Building Next.js application..." -ForegroundColor Yellow
Set-Location $source
npm run build
if ($LASTEXITCODE -ne 0) { 
    Write-Host "Build failed! Please fix compiler errors before packaging." -ForegroundColor Red
    exit 1 
}
Write-Host "Build completed successfully." -ForegroundColor Green

# Step 2: Clean old release folder
Write-Host "`n[2/3] Cleaning previous release folder..." -ForegroundColor Yellow
if (Test-Path $dest) {
    Remove-Item -Path $dest -Recurse -Force -ErrorAction SilentlyContinue
}
New-Item -ItemType Directory -Path $dest -Force | Out-Null

# Step 3: Assemble all files into the release folder
Write-Host "`n[3/3] Assembling files into $dest..." -ForegroundColor Yellow

# Copy standalone build files (server.js, package.json, node_modules)
if (Test-Path "$source\.next\standalone") {
    Copy-Item -Path "$source\.next\standalone\*" -Destination "$dest\" -Recurse -Force
} else {
    Write-Error "Standalone build directory not found. Make sure output: 'standalone' is in next.config.ts"
    exit 1
}

# Copy static files to _next/static (using _next bypasses IIS hidden segment blocks)
New-Item -ItemType Directory -Path "$dest\_next\static" -Force | Out-Null
if (Test-Path "$source\.next\static") {
    Copy-Item -Path "$source\.next\static\*" -Destination "$dest\_next\static\" -Recurse -Force
}

# Copy public assets
if (Test-Path "$source\public") {
    New-Item -ItemType Directory -Path "$dest\public" -Force | Out-Null
    Copy-Item -Path "$source\public\*" -Destination "$dest\public\" -Recurse -Force
}

# Copy IIS and PM2 configurations
if (Test-Path "$source\web.config") {
    Copy-Item -Path "$source\web.config" -Destination "$dest\web.config" -Force
}
if (Test-Path "$source\ecosystem.config.js") {
    Copy-Item -Path "$source\ecosystem.config.js" -Destination "$dest\ecosystem.config.js" -Force
}
if (Test-Path "$source\.env.production") {
    $envContent = Get-Content "$source\.env.production"
    if ($envContent -like "*api.yourdomain.com*") {
        Write-Host "Updating placeholder API URL in .env.production..." -ForegroundColor Yellow
        $envContent = $envContent -replace "https://api.yourdomain.com", "http://tejco.digitaledgetech.in/api"
        $envContent | Out-File -FilePath "$dest\.env.production" -Encoding utf8
    } else {
        Copy-Item -Path "$source\.env.production" -Destination "$dest\.env.production" -Force
    }
}

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host " SUCCESS! Everything is packaged inside: " -ForegroundColor Green
Write-Host " => $dest" -ForegroundColor White
Write-Host " You can now copy the contents of this folder directly to IIS." -ForegroundColor Gray
Write-Host "==========================================" -ForegroundColor Green
