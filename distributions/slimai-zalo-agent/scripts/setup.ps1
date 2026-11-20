[CmdletBinding()]
param([switch]$CheckOnly, [string]$DataRoot)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$skillRoot = Split-Path $PSScriptRoot -Parent
if (-not $DataRoot) { $DataRoot = Join-Path $env:LOCALAPPDATA 'SlimAI\ZaloAgent' }
$DataRoot = [IO.Path]::GetFullPath($DataRoot)
$runtimeRoot = Join-Path $DataRoot 'runtime'
$sourceRoot = Join-Path $skillRoot 'assets\cli'
$configPath = Join-Path $DataRoot 'installation.json'
if ($CheckOnly) {
    if (-not (Test-Path -LiteralPath $configPath)) { throw 'Chưa cài. Chạy setup.ps1 để cài tự động.' }
    $config = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
    & $config.node '--version'
    if ($LASTEXITCODE -ne 0) { throw 'Node.js không chạy được.' }
    & $config.node (Join-Path $runtimeRoot 'src\index.js') '--version'
    if ($LASTEXITCODE -ne 0) { throw 'CLI chưa sẵn sàng. Chạy lại setup.ps1.' }
    Write-Host 'SlimAI đã sẵn sàng. Bước tiếp theo: scripts\zalo.ps1 --json status'
    return
}
New-Item -ItemType Directory -Force -Path $DataRoot | Out-Null
# New private state directory. Never touch another Zalo installation's credentials.
$sid = [Security.Principal.WindowsIdentity]::GetCurrent().User.Value
& icacls.exe $DataRoot '/inheritance:r' '/grant:r' "*${sid}:(OI)(CI)F" '*S-1-5-18:(OI)(CI)F' | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Không thể giới hạn quyền truy cập thư mục dữ liệu.' }
$nodePath = $null
$npmPath = $null
$nodeCandidates = @()
if (Test-Path -LiteralPath $configPath) {
    $existing = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
    if (Test-Path -LiteralPath $existing.node) { $nodeCandidates += $existing.node }
}
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCommand) { $nodeCandidates += $nodeCommand.Source }
foreach ($candidate in $nodeCandidates) {
    $major = & $candidate -p 'process.versions.node.split(String.fromCharCode(46))[0]'
    $siblingNpm = Join-Path (Split-Path $candidate -Parent) 'node_modules\npm\bin\npm-cli.js'
    if ([int]$major -ge 24 -and (Test-Path -LiteralPath $siblingNpm)) { $nodePath = $candidate; $npmPath = $siblingNpm; break }
}
if (-not $nodePath) {
    Write-Host '1/3 Đang chuẩn bị Node.js 24 LTS và npm trong thư mục SlimAI...'
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $architecture = [Runtime.InteropServices.RuntimeInformation]::OSArchitecture.ToString().ToLowerInvariant()
    if ($architecture -notin @('x64','arm64')) { throw 'Bộ cài hỗ trợ Windows x64 và ARM64.' }
    $distribution = 'https://nodejs.org/dist/latest-v24.x/'
    $manifest = (Invoke-WebRequest -UseBasicParsing -TimeoutSec 120 -Uri ($distribution + 'SHASUMS256.txt')).Content
    $pattern = '(?m)^([a-f0-9]{64})\s+(node-v24\.[0-9]+\.[0-9]+-win-' + $architecture + '\.zip)\s*$'
    $match = [regex]::Match([string]$manifest, $pattern)
    if (-not $match.Success) { throw 'Không tìm thấy bản Node LTS tương ứng trong manifest chính thức.' }
    $filename = $match.Groups[2].Value
    $toolsRoot = Join-Path $DataRoot 'tools'
    New-Item -ItemType Directory -Force -Path $toolsRoot | Out-Null
    $archive = Join-Path $toolsRoot $filename
    if (-not (Test-Path -LiteralPath $archive) -or (Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant() -ne $match.Groups[1].Value) {
        Invoke-WebRequest -UseBasicParsing -TimeoutSec 300 -Uri ($distribution + $filename) -OutFile $archive
    }
    if ((Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant() -ne $match.Groups[1].Value) { throw 'SHA-256 Node.js không khớp. Dừng cài đặt.' }
    Expand-Archive -LiteralPath $archive -DestinationPath $toolsRoot -Force
    $nodeFolder = Join-Path $toolsRoot ([IO.Path]::GetFileNameWithoutExtension($filename))
    $nodePath = Join-Path $nodeFolder 'node.exe'
    $npmPath = Join-Path $nodeFolder 'node_modules\npm\bin\npm-cli.js'
}
Write-Host '2/3 Đang cài CLI và thư viện theo lockfile...'
if ((Test-Path -LiteralPath (Join-Path $DataRoot 'listener.lock')) -or (Test-Path -LiteralPath (Join-Path $DataRoot 'dispatch.lock'))) { throw 'Có listener hoặc đợt gửi đang chạy. Dừng đúng tiến trình này trước khi cập nhật runtime.' }
New-Item -ItemType Directory -Force -Path $runtimeRoot | Out-Null
Copy-Item -LiteralPath (Join-Path $sourceRoot 'src') -Destination $runtimeRoot -Recurse -Force
foreach ($file in @('package.json','package-lock.json','LICENSE')) { Copy-Item -LiteralPath (Join-Path $sourceRoot $file) -Destination $runtimeRoot -Force }
$previousPath = $env:PATH
$env:PATH = (Split-Path $nodePath -Parent) + ';' + $previousPath
Push-Location $runtimeRoot
try {
    & $nodePath $npmPath 'ci' '--omit=dev' '--ignore-scripts' '--no-fund' '--no-audit'
    if ($LASTEXITCODE -ne 0) { throw 'Cài dependency thất bại. Kiểm tra mạng rồi chạy lại setup.ps1.' }
    & $nodePath 'src/index.js' '--version'
    if ($LASTEXITCODE -ne 0) { throw 'CLI không vượt qua kiểm tra khởi động.' }
} finally { Pop-Location; $env:PATH = $previousPath }
@{ node = $nodePath; runtime = $runtimeRoot; data = $DataRoot; version = '1.0.0'; installedAt = [DateTime]::UtcNow.ToString('o') } | ConvertTo-Json | Set-Content -LiteralPath $configPath -Encoding UTF8
Write-Host '3/3 Cài xong. Không cần Zalo PC. Chạy scripts\zalo.ps1 login rồi quét QR bằng Zalo điện thoại.'
