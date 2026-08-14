param(
  [string]$CardData = "..\data\cards.json"
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$cardDataPath = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot $CardData)).Path
$cards = (Get-Content -LiteralPath $cardDataPath -Raw | ConvertFrom-Json).cards
$expectedSizes = @("1102x1498", "1106x1502")
$seen = New-Object 'System.Collections.Generic.HashSet[string]'
$errors = New-Object 'System.Collections.Generic.List[string]'

foreach ($card in $cards) {
  if (-not $card.renderArt) { continue }
  $relativePath = [string]$card.renderArt
  if (-not $seen.Add($relativePath)) { continue }

  $renderPath = Join-Path $projectRoot ($relativePath -replace '/', '\')
  if (-not (Test-Path -LiteralPath $renderPath)) { continue }

  $bytes = [System.IO.File]::ReadAllBytes($renderPath)
  $stream = New-Object System.IO.MemoryStream(,$bytes)
  $bitmap = $null
  try {
    $bitmap = New-Object System.Drawing.Bitmap($stream)
    $size = "$($bitmap.Width)x$($bitmap.Height)"
    if ($expectedSizes -notcontains $size) {
      $errors.Add("$relativePath : dimensions anormales ($size)")
    }

    $corners = @(
      $bitmap.GetPixel(0, 0),
      $bitmap.GetPixel($bitmap.Width - 1, 0),
      $bitmap.GetPixel(0, $bitmap.Height - 1),
      $bitmap.GetPixel($bitmap.Width - 1, $bitmap.Height - 1)
    )
    if ($corners | Where-Object { $_.A -gt 10 }) {
      $errors.Add("$relativePath : coins opaques, detourage a normaliser")
    }
  } finally {
    if ($bitmap) { $bitmap.Dispose() }
    $stream.Dispose()
  }
}

if ($errors.Count -gt 0) {
  Write-Host "Card render geometry errors: $($errors.Count)"
  $errors | ForEach-Object { Write-Host "- $_" }
  exit 1
}

Write-Host "Card render geometry: $($seen.Count) referenced PNGs OK"
