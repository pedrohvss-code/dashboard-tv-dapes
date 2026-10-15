# =====================================================================
#  Abre o dashboard em tela cheia na TV (conectada como monitor extra)
#
#  Antes: conecte a TV com Win+K e escolha "Estender" em Win+P.
#  Uso:
#    abrir-na-tv.bat              -> abre na última tela extra conectada
#    abrir-na-tv.bat -Monitor 3   -> abre na tela DISPLAY3
#    abrir-na-tv.bat -Listar      -> só mostra as telas detectadas
#    abrir-na-tv.bat -Fechar      -> fecha o dashboard
# =====================================================================
param(
  [int]$Monitor = 0,
  [switch]$Listar,
  [switch]$Fechar
)

$url = "https://pedrohvss-code.github.io/dashboard-tv-dapes/"
# Perfil separado: não interfere no navegador que você usa no dia a dia
$perfil = Join-Path $env:LOCALAPPDATA "DashboardTV\perfil"

function Fechar-Dashboard {
  Get-CimInstance Win32_Process -Filter "Name='msedge.exe' OR Name='chrome.exe'" |
    Where-Object { $_.CommandLine -like "*DashboardTV*" } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
}

if ($Fechar) { Fechar-Dashboard; Write-Host "Dashboard fechado."; exit }

Add-Type -AssemblyName System.Windows.Forms
$telas = [System.Windows.Forms.Screen]::AllScreens
$numero = { param($t) [int]($t.DeviceName -replace '\D', '') }

Write-Host "Telas detectadas:"
$telas | ForEach-Object {
  $b = $_.Bounds
  Write-Host ("  DISPLAY{0}  {1}x{2} em ({3},{4}){5}" -f (& $numero $_), $b.Width, $b.Height, $b.X, $b.Y, $(if ($_.Primary) { "  [principal]" } else { "" }))
}
if ($Listar) { exit }

if ($Monitor -gt 0) {
  $alvo = $telas | Where-Object { (& $numero $_) -eq $Monitor }
} else {
  $alvo = $telas | Where-Object { -not $_.Primary } | Sort-Object { & $numero $_ } | Select-Object -Last 1
}

if (-not $alvo) {
  Write-Warning "Nenhuma tela extra encontrada. Conecte a TV com Win+K e escolha 'Estender' em Win+P."
  Read-Host "Enter para sair"
  exit 1
}

$navegador = @(
  "C:\Program Files\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe",
  "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
  "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $navegador) { Write-Warning "Chrome/Edge não encontrado."; Read-Host "Enter para sair"; exit 1 }

Fechar-Dashboard
Start-Sleep -Milliseconds 800

$b = $alvo.Bounds
Write-Host ("Abrindo em DISPLAY{0}..." -f (& $numero $alvo))
Start-Process $navegador -ArgumentList @(
  "--user-data-dir=`"$perfil`"",
  "--window-position=$($b.X),$($b.Y)",
  "--window-size=$($b.Width),$($b.Height)",
  "--kiosk", "--edge-kiosk-type=fullscreen",
  "--no-first-run", "--noerrdialogs", "--disable-session-crashed-bubble",
  "--disable-features=Translate",
  $url
)
