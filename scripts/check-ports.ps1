param(
  [int]$FrontendPort = 5173,
  [int]$BackendPort = 3001
)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$files = @(
  'vite.config.js',
  'package.json',
  'run-app.bat',
  'launcher.js',
  '.env',
  '.env.example',
  'README.md',
  'mcp-services/src/index.js',
  'mcp-services/src/config/config.js'
) | Where-Object { Test-Path $_ }

$patterns = @(
  '(?i)server\s*\.\s*port\s*[:=]\s*(\d+)',
  '(?i)clientPort\s*[:=]\s*(\d+)',
  '(?i)--port\s*(\d+)',
  '(?i)http://[\w\.:]+:(\d+)',
  '(?i)MCP_SERVER_PORT\s*|\s*port\s*[:=]\s*(\d+)',
  '(?i)PORT\s*=\s*(\d+)',
  '(?i)FRONTEND_URL\s*=.*:(\d+)'
)

$results = @()
foreach ($f in $files) {
  $content = Get-Content -Raw $f
  foreach ($p in $patterns) {
    $matches = [regex]::Matches($content, $p)
    foreach ($m in $matches) {
      $line = ($content.Substring(0, $m.Index).Split("`n").Count)
      $port = ($m.Groups | Where-Object { $_.Value -match '^[0-9]+$' } | Select-Object -First 1).Value
      if ($port) {
        $expected = if ($f -like 'mcp-services*') { $BackendPort } else { $FrontendPort }
        $status = if ([int]$port -eq $expected) { 'OK' } else { 'MISMATCH' }
        $results += [pscustomobject]@{ File=$f; Line=$line; Port=[int]$port; Expected=$expected; Status=$status }
      }
    }
  }
}

Write-Host "Port Consistency Report" -ForegroundColor Cyan
$results | Format-Table -AutoSize

try {
  $listeners = netstat -ano | Select-String ":$FrontendPort|:$BackendPort" -ErrorAction Stop
  Write-Host "Listeners:" -ForegroundColor Green
  $listeners | ForEach-Object { $_.ToString() }
} catch { Write-Host "netstat unavailable or no listeners yet" -ForegroundColor Yellow }

try { curl.exe "http://127.0.0.1:$FrontendPort/" -m 3 | Out-Null; Write-Host "Frontend reachable" -ForegroundColor Green } catch { Write-Host "Frontend unreachable" -ForegroundColor Red }
try { curl.exe "http://127.0.0.1:$BackendPort/health" -m 3 | Out-Null; Write-Host "Backend health OK" -ForegroundColor Green } catch { Write-Host "Backend health failed" -ForegroundColor Red }
