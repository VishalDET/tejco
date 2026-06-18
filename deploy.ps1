# deploy.ps1 - Tejco ERP Windows IIS/PM2 Deployment Script
# Run this script from PowerShell (run as Administrator) to build and deploy.

$source = "d:\repository\tejco"
$dest   = "C:\inetpub\wwwroot\tejcocrm"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   Tejco ERP Windows Deployment Script   " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Check for Administrator privileges
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Warning "This script MUST be run as Administrator because it copies files to C:\inetpub\wwwroot."
    Write-Warning "Please close this and open PowerShell by right-clicking it and selecting 'Run as Administrator'."
    Write-Error "Deployment aborted: Not running as Administrator."
    exit 1
}

# Step 1: Build the Next.js application
Write-Host "`n[1/4] Building Next.js application..." -ForegroundColor Yellow
Set-Location $source
npm run build
if ($LASTEXITCODE -ne 0) { 
    Write-Host "Build failed! Please fix compiler errors before deploying." -ForegroundColor Red
    exit 1 
}
Write-Host "Build completed successfully." -ForegroundColor Green

# Step 2: Clean old deployment files (preserving .env.production if it exists)
Write-Host "`n[2/4] Cleaning previous deployment files..." -ForegroundColor Yellow

# Remove files from root
Remove-Item -Path "$dest\server.js" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$dest\package.json" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$dest\web.config" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$dest\ecosystem.config.js" -Force -ErrorAction SilentlyContinue

# Safely delete folders
if (Test-Path "$dest\.next") {
    Remove-Item -Path "$dest\.next" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path "$dest\public") {
    Remove-Item -Path "$dest\public" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path "$dest\node_modules") {
    Remove-Item -Path "$dest\node_modules" -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "Old deployment files cleaned." -ForegroundColor Green

# Step 3: Copy Standalone build files to IIS folder
Write-Host "`n[3/4] Copying build artifacts to IIS directory..." -ForegroundColor Yellow

# Ensure destination directory exists
if (-not (Test-Path $dest)) {
    New-Item -ItemType Directory -Path $dest -Force | Out-Null
}

# Copy standalone build files (.next/standalone contains server.js, package.json, and node_modules)
if (Test-Path "$source\.next\standalone") {
    # Copy standalone root contents (server.js, package.json, etc.)
    Copy-Item -Path "$source\.next\standalone\*" -Destination "$dest\" -Recurse -Force
} else {
    Write-Error "Standalone build directory not found at $source\.next\standalone. Check next.config.ts has output: 'standalone'."
    exit 1
}

# Create .next/static directory on the server and copy static files (required for pages to load styles/JS)
New-Item -ItemType Directory -Path "$dest\.next\static" -Force | Out-Null
if (Test-Path "$source\.next\static") {
    Copy-Item -Path "$source\.next\static\*" -Destination "$dest\.next\static\" -Recurse -Force
}

# Create public directory and copy public assets (images, icons, etc.)
if (Test-Path "$source\public") {
    New-Item -ItemType Directory -Path "$dest\public" -Force | Out-Null
    Copy-Item -Path "$source\public\*" -Destination "$dest\public\" -Recurse -Force
}

# Copy deployment configurations
if (Test-Path "$source\web.config") {
    Copy-Item -Path "$source\web.config" -Destination "$dest\web.config" -Force
}
if (Test-Path "$source\ecosystem.config.js") {
    Copy-Item -Path "$source\ecosystem.config.js" -Destination "$dest\ecosystem.config.js" -Force
}

# Copy production env config if present locally, and doesn't exist on server
$destEnv = "$dest\.env.production"
if (-not (Test-Path $destEnv)) {
    if (Test-Path "$source\.env.production") {
        Copy-Item -Path "$source\.env.production" -Destination $destEnv -Force
        Write-Host "Copied .env.production to server." -ForegroundColor Gray
    }
} else {
    Write-Host "Preserved existing .env.production on server." -ForegroundColor Gray
}

Write-Host "Files copied successfully." -ForegroundColor Green

# Step 4: PM2 Service Reload/Restart
Write-Host "`n[4/4] Checking PM2 process..." -ForegroundColor Yellow
$pm2Command = Get-Command pm2 -ErrorAction SilentlyContinue
if ($pm2Command) {
    # Check if the process is running
    $pm2Status = pm2 list 2>&1
    if ($pm2Status -like "*tejco-erp*") {
        Write-Host "Reloading PM2 process 'tejco-erp' for zero-downtime update..." -ForegroundColor Yellow
        pm2 reload tejco-erp --update-env
        Write-Host "PM2 process reloaded." -ForegroundColor Green
    } else {
        Write-Host "Starting new PM2 process 'tejco-erp'..." -ForegroundColor Yellow
        Push-Location $dest
        pm2 start ecosystem.config.js --env production
        pm2 save
        Pop-Location
        Write-Host "PM2 process started and configuration saved." -ForegroundColor Green
    }
} else {
    Write-Host "PM2 is not installed or not in system PATH." -ForegroundColor Yellow
    Write-Host "To start the server manually, run:" -ForegroundColor Gray
    Write-Host "  node $dest\server.js" -ForegroundColor White
}

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "       DEPLOYMENT COMPLETED SUCCESSFULLY!  " -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
