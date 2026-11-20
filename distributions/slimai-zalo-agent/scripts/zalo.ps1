# Usage: ./zalo.ps1 --json status
$ErrorActionPreference = 'Stop'
$dataRoot = if ($env:SLIMAI_ZALO_DATA) { $env:SLIMAI_ZALO_DATA } else { Join-Path $env:LOCALAPPDATA 'SlimAI\ZaloAgent' }
$configPath = Join-Path $dataRoot 'installation.json'
if (-not (Test-Path -LiteralPath $configPath)) {
    & (Join-Path $PSScriptRoot 'setup.ps1') -DataRoot $dataRoot
}
$config = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
$env:SLIMAI_ZALO_HOME = Join-Path $dataRoot 'auth'
& $config.node (Join-Path $config.runtime 'src\index.js') @args
exit $LASTEXITCODE
