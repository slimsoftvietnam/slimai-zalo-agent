[CmdletBinding()]
param([string]$SkillsRoot)
$ErrorActionPreference = 'Stop'
$source = [IO.Path]::GetFullPath((Split-Path $PSScriptRoot -Parent))
if (-not $SkillsRoot) {
    $codexRoot = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $env:USERPROFILE '.codex' }
    $SkillsRoot = Join-Path $codexRoot 'skills'
}
$target = [IO.Path]::GetFullPath((Join-Path $SkillsRoot 'slimai-zalo-agent'))
if ($source -ne $target) {
    if (Test-Path -LiteralPath $target) { throw "Skill đã tồn tại tại $target. Giữ bản hiện tại để tránh ghi đè tùy chỉnh." }
    New-Item -ItemType Directory -Force -Path $SkillsRoot | Out-Null
    Copy-Item -LiteralPath $source -Destination $target -Recurse
}
Write-Host "Đã cài skill SlimAI tại $target"
Write-Host 'Nếu Codex chưa nhận skill, mở cuộc chat mới hoặc khởi động lại ứng dụng. Gõ $slimai-zalo-agent để bắt đầu.'
& (Join-Path $target 'scripts\setup.ps1')
