# ============================================================
#  PubVibe Stack – First-time setup (Windows PowerShell)
#  Run: .\scripts\setup.ps1
# ============================================================

Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   PubVibe Prebid Stack – Setup           ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan

# 1. Generate .env if missing
if (-Not (Test-Path ".\.env")) {
    $jwtSecret      = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 40 | ForEach-Object {[char]$_})
    $refreshSecret  = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 40 | ForEach-Object {[char]$_})
    @"
JWT_SECRET=$jwtSecret
JWT_REFRESH_SECRET=$refreshSecret
ADMIN_DOMAIN=admin.pubvibe.com
PUBLISHER_DOMAIN=pub.pubvibe.com
"@ | Set-Content ".\.env"
    Write-Host "✓  .env created with random JWT secrets" -ForegroundColor Green
} else {
    Write-Host "✓  .env already exists" -ForegroundColor Green
}

# 2. nginx/certs directory
New-Item -ItemType Directory -Force -Path ".\nginx\certs" | Out-Null
Write-Host "✓  nginx/certs directory ready" -ForegroundColor Green

# 3. Build containers
Write-Host "`nBuilding Docker images…" -ForegroundColor Yellow
docker-compose build

# 4. Start containers
Write-Host "`nStarting containers…" -ForegroundColor Yellow
docker-compose up -d

# 5. Wait for backend health
Write-Host "`nWaiting for backend to be ready…" -ForegroundColor Yellow
$healthy = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:4000/health" -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) { $healthy = $true; break }
    } catch {}
    Start-Sleep -Seconds 3
    Write-Host -NoNewline "."
}
if ($healthy) {
    Write-Host "`n✓  Backend is healthy" -ForegroundColor Green
} else {
    Write-Host "`n⚠  Backend did not respond in time – check logs with: docker-compose logs backend" -ForegroundColor Yellow
}

# 6. Seed superadmin
Write-Host "`nSeeding superadmin account…" -ForegroundColor Yellow
docker-compose exec backend node src/services/seedAdmin.js

Write-Host ""
Write-Host "══════════════════════════════════════════" -ForegroundColor Green
Write-Host "  Setup complete!" -ForegroundColor Green
Write-Host "══════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  Admin Panel:       http://localhost  (or http://admin.pubvibe.com)"
Write-Host "  Publisher Portal:  http://pub.pubvibe.com"
Write-Host "  Prebid Server:     http://localhost:8000"
Write-Host "  API Health:        http://localhost:4000/health"
Write-Host ""
Write-Host "  Default admin login:"
Write-Host "    Email:    admin@pubvibe.com"
Write-Host "    Password: Admin@12345"
Write-Host ""
Write-Host "  ⚠  Change the admin password immediately after first login!" -ForegroundColor Yellow
Write-Host ""
