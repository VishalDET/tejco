<#
  deploy.ps1 – Tejco ERP Windows Server Deployment Script
  ────────────────────────────────────────────────────────
  Run from the source machine or a CI/CD agent with PowerShell 5+.
  Adjust the variables at the top before first use.
#>

param(
    [string]$DeployPath   = "C:\inetpub\tejco",
    [string]$BackupRoot   = "C:\deployments\backups",
    [string]$IISSiteName  = "tejco-erp",
    [string]$PM2AppName   = "tejco-erp",
    [switch]$SkipBuild
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupPath = "$BackupRoot\$Timestamp"

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  Tejco ERP – Deployment  ($Timestamp)" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: Build ────────────────────────────────────────────
if (-not $SkipBuild) {
    Write-Host "[1/5] Building Next.js production bundle..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Build failed. Aborting deployment." }
    Write-Host "      Build succeeded." -ForegroundColor Green
} else {
    Write-Host "[1/5] Build skipped (-SkipBuild flag)." -ForegroundColor DarkGray
}

# ── Step 2: Backup current deployment ────────────────────────
Write-Host ""
Write-Host "[2/5] Backing up current deployment..." -ForegroundColor Yellow
if (Test-Path $DeployPath) {
    New-Item -ItemType Directory -Force -Path $BackupPath | Out-Null
    Copy-Item -Path $DeployPath -Destination $BackupPath -Recurse -Force
    Write-Host "      Backed up to: $BackupPath" -ForegroundColor Green
} else {
    Write-Host "      No existing deployment found – skipping backup." -ForegroundColor DarkGray
    New-Item -ItemType Directory -Force -Path $DeployPath | Out-Null
}

# ── Step 3: Copy build artifacts ─────────────────────────────
Write-Host ""
Write-Host "[3/5] Copying build artifacts to $DeployPath..." -ForegroundColor Yellow

$FilesToCopy = @(".next", "public", "package.json", "package-lock.json",
                 "next.config.ts", "web.config", "ecosystem.config.js")

foreach ($item in $FilesToCopy) {
    if (Test-Path ".\$item") {
        Copy-Item -Path ".\$item" -Destination "$DeployPath\$item" -Recurse -Force
        Write-Host "      Copied: $item" -ForegroundColor DarkGray
    }
}

# Copy production env (only if it doesn't already exist on server)
$EnvDest = "$DeployPath\.env.production"
if (-not (Test-Path $EnvDest)) {
    Copy-Item ".\.env.production" $EnvDest -Force
    Write-Host "      Copied: .env.production (first time)" -ForegroundColor DarkGray
} else {
    Write-Host "      Skipped: .env.production already exists on server." -ForegroundColor DarkGray
}

Write-Host "      Files copied." -ForegroundColor Green

# ── Step 4: Install production dependencies ───────────────────
Write-Host ""
Write-Host "[4/5] Installing production npm dependencies..." -ForegroundColor Yellow
Push-Location $DeployPath
npm install --omit=dev --legacy-peer-deps
if ($LASTEXITCODE -ne 0) { throw "npm install failed." }
Pop-Location
Write-Host "      Dependencies installed." -ForegroundColor Green

# ── Step 5: Restart the application via PM2 ──────────────────
Write-Host ""
Write-Host "[5/5] Restarting PM2 process '$PM2AppName'..." -ForegroundColor Yellow

$pm2Running = pm2 list 2>&1 | Select-String $PM2AppName
if ($pm2Running) {
    pm2 reload $PM2AppName --update-env
    Write-Host "      Reloaded existing PM2 process (zero-downtime)." -ForegroundColor Green
} else {
    Push-Location $DeployPath
    pm2 start ecosystem.config.js --env production
    pm2 save
    Pop-Location
    Write-Host "      Started new PM2 process and saved." -ForegroundColor Green
}

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  Deployment complete!" -ForegroundColor Green
Write-Host "  Site :  http://$IISSiteName (or your domain)" -ForegroundColor Cyan
Write-Host "  Logs :  pm2 logs $PM2AppName" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""
