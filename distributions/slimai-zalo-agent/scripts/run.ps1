# Usage: ./run.ps1 campaign <plan.json> --limit 1 --send
$ErrorActionPreference = 'Stop'
if ($args.Count -lt 1 -or $args[0] -notin @('campaign','monitor')) { throw 'Dùng run.ps1 campaign ... hoặc run.ps1 monitor ...' }
$scriptName = $args[0]
$remaining = @($args | Select-Object -Skip 1)
$dataRoot = if ($env:SLIMAI_ZALO_DATA) { $env:SLIMAI_ZALO_DATA } else { Join-Path $env:LOCALAPPDATA 'SlimAI\ZaloAgent' }
$configPath = Join-Path $dataRoot 'installation.json'
if (-not (Test-Path -LiteralPath $configPath)) { & (Join-Path $PSScriptRoot 'setup.ps1') -DataRoot $dataRoot }
$config = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
& $config.node (Join-Path $PSScriptRoot ($scriptName + '.mjs')) @remaining
exit $LASTEXITCODE
