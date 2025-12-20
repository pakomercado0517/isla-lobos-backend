# Script para desinstalar pnpm completamente
# Ejecutar como Administrador en PowerShell

Write-Host "Desinstalando pnpm completamente..." -ForegroundColor Yellow

# 1. Desinstalar de npm
Write-Host "`n1. Desinstalando de npm..." -ForegroundColor Cyan
npm uninstall -g pnpm 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Desinstalado de npm" -ForegroundColor Green
} else {
    Write-Host "   ℹ No estaba instalado en npm" -ForegroundColor Gray
}

# 2. Eliminar carpeta de instalación standalone
Write-Host "`n2. Eliminando instalación standalone..." -ForegroundColor Cyan
$pnpmPath = "$env:LOCALAPPDATA\pnpm"
if (Test-Path $pnpmPath) {
    Remove-Item -Recurse -Force $pnpmPath
    Write-Host "   ✓ Carpeta eliminada: $pnpmPath" -ForegroundColor Green
} else {
    Write-Host "   ℹ Carpeta no encontrada: $pnpmPath" -ForegroundColor Gray
}

# 3. Limpiar PATH (solo muestra, no modifica automáticamente por seguridad)
Write-Host "`n3. Verificando PATH..." -ForegroundColor Cyan
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
$pathEntries = $currentPath -split ';'
$pnpmInPath = $pathEntries | Where-Object { $_ -like "*pnpm*" }

if ($pnpmInPath) {
    Write-Host "   ⚠ Encontradas entradas de pnpm en PATH:" -ForegroundColor Yellow
    $pnpmInPath | ForEach-Object { Write-Host "     - $_" -ForegroundColor Yellow }
    Write-Host "`n   ⚠ Debes eliminarlas manualmente:" -ForegroundColor Yellow
    Write-Host "     1. Abre 'Variables de entorno' en Windows" -ForegroundColor White
    Write-Host "     2. Busca 'Path' en 'Variables de usuario'" -ForegroundColor White
    Write-Host "     3. Elimina las entradas relacionadas con pnpm" -ForegroundColor White
} else {
    Write-Host "   ✓ No hay entradas de pnpm en PATH" -ForegroundColor Green
}

Write-Host "`n✓ Desinstalación completada!" -ForegroundColor Green
Write-Host "`nCierra y vuelve a abrir la terminal para que los cambios surtan efecto." -ForegroundColor Yellow
Write-Host "Luego verifica con: pnpm --version (debería dar error)" -ForegroundColor Yellow

