# dump-project.ps1 — dump all source files (path + line numbers) for review.
# Includes uncommitted files. Respects .gitignore. Skips junk/binaries/large files.
#
# Usage (in PowerShell):
#   powershell -ExecutionPolicy Bypass -File .\dump-project.ps1
#   powershell -ExecutionPolicy Bypass -File .\dump-project.ps1 -Out review.txt
#   powershell -ExecutionPolicy Bypass -File .\dump-project.ps1 -Out review.txt -ExtFilter ts,tsx,css,json,md
param(
  [string]$Out = "project-dump.txt",
  [string]$ExtFilter = ""
)

$ErrorActionPreference = "Stop"
$MaxBytes  = 100000
$SkipDirs  = @('node_modules','.next','.git','dist','build','out','.vercel','coverage','.turbo','vendor','__pycache__','.venv','venv','target','.idea','.cache')
$SkipFiles = @('package-lock.json','yarn.lock','pnpm-lock.yaml','bun.lockb','project-dump.txt','review.txt')

# Gather: tracked + untracked-but-not-ignored (so new uncommitted files are included)
$gitOk = (Get-Command git -ErrorAction SilentlyContinue) -and ((git rev-parse --is-inside-work-tree 2>$null) -eq 'true')
if ($gitOk) {
  $files = git ls-files --cached --others --exclude-standard
} else {
  $files = Get-ChildItem -Recurse -File | ForEach-Object {
    $_.FullName.Substring((Get-Location).Path.Length + 1).Replace('\','/')
  }
}

$exts = @(); if ($ExtFilter) { $exts = $ExtFilter.Split(',') | ForEach-Object { $_.Trim() } }

function Should-Skip($path) {
  $segs = $path -split '[\\/]'
  foreach ($d in $SkipDirs) { if ($segs -contains $d) { return $true } }
  if ($SkipFiles -contains (Split-Path $path -Leaf)) { return $true }
  return $false
}

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("# PROJECT DUMP")
[void]$sb.AppendLine("# Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
[void]$sb.AppendLine("# Directory: $(Get-Location)")
[void]$sb.AppendLine("")

$count = 0; $total = 0
foreach ($f in $files) {
  if ($null -eq $f -or "$f" -eq '') { continue }
  if (Should-Skip $f) { continue }
  if (-not (Test-Path $f -PathType Leaf)) { continue }
  $fi = Get-Item $f
  if ($fi.Length -gt $MaxBytes) { continue }
  if ($exts.Count -gt 0 -and $exts -notcontains $fi.Extension.TrimStart('.')) { continue }

  $bytes = [System.IO.File]::ReadAllBytes($fi.FullName)
  if ($bytes.Length -gt 0) {
    $n = [Math]::Min(2000, $bytes.Length - 1)
    if ($bytes[0..$n] -contains 0) { continue }   # binary -> skip
  }
  $lines = [System.Text.Encoding]::UTF8.GetString($bytes) -split "`r?`n"

  [void]$sb.AppendLine("================================================================")
  [void]$sb.AppendLine("FILE: $f  ($($lines.Count) lines)")
  [void]$sb.AppendLine("================================================================")
  for ($i = 0; $i -lt $lines.Count; $i++) {
    [void]$sb.AppendLine(("{0,4} | {1}" -f ($i + 1), $lines[$i]))
  }
  [void]$sb.AppendLine("")
  $count++; $total += $lines.Count
}

[void]$sb.AppendLine("================================================================")
[void]$sb.AppendLine("# SUMMARY: $count files, $total lines -> $Out")
[void]$sb.AppendLine("================================================================")
Set-Content -Path $Out -Value $sb.ToString() -Encoding UTF8
Write-Host "Done. $count files ($total lines) written to $Out"