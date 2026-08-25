$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$repo = Split-Path -Parent $MyInvocation.MyCommand.Path
$renderDir = Join-Path $repo "assets\card_renders"
$downloads = "C:\Users\LENOVO\Downloads"
$statusRoot = Split-Path -Parent $repo
$okMarker = Join-Path $statusRoot "allstar-import-ok.txt"
$errorMarker = Join-Path $statusRoot "allstar-import-error.txt"
$commitMarker = Join-Path $statusRoot "allstar-last-commit.txt"
Remove-Item -LiteralPath $okMarker, $errorMarker -Force -ErrorAction SilentlyContinue

$cards = @(
  @{ Source="Standards_Catcheurs_Luke_Kane.png"; Name="Luke Kane"; Rarity="standard" },
  @{ Source="Standards_Catcheurs_Maxime_Cuadrado.png"; Name="Maxime Cuadrado"; Rarity="standard" },
  @{ Source="Standards_Catcheurs_Nils_N.png"; Name="Nils N"; Rarity="standard" },
  @{ Source="Standards_Catcheurs_Nocif.png"; Name="Nocif"; Rarity="standard" },
  @{ Source="Standards_Catcheurs_Paul_Meunier.png"; Name="Paul Meunier"; Rarity="standard" },
  @{ Source="Légendaires_Catcheurs_Black_Sam.png"; Name="Black Sam"; Rarity="legende" },
  @{ Source="Légendaires_Catcheurs_Drix.png"; Name="Drix"; Rarity="legende" },
  @{ Source="Légendaires_Catcheurs_Ethan_Riley.png"; Name="Ethan Riley"; Rarity="legende" },
  @{ Source="Légendaires_Catcheurs_Maxime_Cuadrado.png"; Name="Maxime Cuadrado"; Rarity="legende" },
  @{ Source="Légendaires_Catcheurs_NILS_N.png"; Name="Nils N"; Rarity="legende" },
  @{ Source="Rare_Catcheurs_Angelo_Folena.png"; Name="Angelo Folena"; Rarity="rare" },
  @{ Source="Rare_Catcheurs_Black_Sam (1).png"; Name="Black Sam"; Rarity="rare" },
  @{ Source="Rare_Catcheurs_Drix.png"; Name="Drix"; Rarity="rare" },
  @{ Source="Rare_Catcheurs_Ethan_Riley.png"; Name="Ethan Riley"; Rarity="rare" },
  @{ Source="Rare_Catcheurs_Maxime_Cuadrado.png"; Name="Maxime Cuadrado"; Rarity="rare" },
  @{ Source="Rare_Catcheurs_Nils_N.png"; Name="Nils N"; Rarity="rare" },
  @{ Source="Rare_Catcheurs_Paul_Meunier.png"; Name="Paul Meunier"; Rarity="rare" },
  @{ Source="Standards_Catcheurs_Angelo_Folena.png"; Name="Angelo Folena"; Rarity="standard" },
  @{ Source="Standards_Catcheurs_Black_Sam.png"; Name="Black Sam"; Rarity="standard" },
  @{ Source="Standards_Catcheurs_Drix.png"; Name="Drix"; Rarity="standard" },
  @{ Source="Standards_Catcheurs_Ethan_Riley.png"; Name="Ethan Riley"; Rarity="standard" },
  @{ Source="Standards_Catcheurs_Jey_Kill.png"; Name="Jey Kill"; Rarity="standard" }
)

function Normalize-Text([string]$value) {
  $decomposed = $value.Normalize([Text.NormalizationForm]::FormD)
  $builder = New-Object Text.StringBuilder
  foreach ($character in $decomposed.ToCharArray()) {
    if ([Globalization.CharUnicodeInfo]::GetUnicodeCategory($character) -ne [Globalization.UnicodeCategory]::NonSpacingMark) {
      [void]$builder.Append($character)
    }
  }
  return (($builder.ToString().ToLowerInvariant()) -replace "[^a-z0-9]", "")
}

function Is-RarityMatch([string]$baseName, [string]$rarity) {
  $normalized = Normalize-Text $baseName
  switch ($rarity) {
    "standard" { return $normalized.Contains("standard") }
    "rare" { return $normalized.Contains("rare") -and -not $normalized.Contains("legende") -and -not $normalized.Contains("legendaire") }
    "legende" { return $normalized.Contains("legende") -or $normalized.Contains("legendaire") }
  }
  return $false
}

function Get-ContentBounds([Drawing.Bitmap]$bitmap) {
  $step = 3
  $minX = $bitmap.Width
  $minY = $bitmap.Height
  $maxX = -1
  $maxY = -1
  for ($y = 0; $y -lt $bitmap.Height; $y += $step) {
    for ($x = 0; $x -lt $bitmap.Width; $x += $step) {
      $pixel = $bitmap.GetPixel($x, $y)
      if ($pixel.A -gt 8 -and -not ($pixel.R -ge 246 -and $pixel.G -ge 246 -and $pixel.B -ge 246)) {
        if ($x -lt $minX) { $minX = $x }
        if ($x -gt $maxX) { $maxX = $x }
        if ($y -lt $minY) { $minY = $y }
        if ($y -gt $maxY) { $maxY = $y }
      }
    }
  }
  if ($maxX -lt 0) {
    return [Drawing.Rectangle]::new(0, 0, $bitmap.Width, $bitmap.Height)
  }
  $padding = 5
  $left = [Math]::Max(0, $minX - $padding)
  $top = [Math]::Max(0, $minY - $padding)
  $right = [Math]::Min($bitmap.Width - 1, $maxX + $step + $padding)
  $bottom = [Math]::Min($bitmap.Height - 1, $maxY + $step + $padding)
  return [Drawing.Rectangle]::new($left, $top, $right - $left + 1, $bottom - $top + 1)
}

try {
  $renderFiles = @(Get-ChildItem -LiteralPath $renderDir -Filter "*.png" -File)
  if ($renderFiles.Count -lt 100) { throw "Catalogue de rendus incomplet: $($renderFiles.Count) fichiers." }

  $mappings = @()
  foreach ($card in $cards) {
    $sourcePath = Join-Path $downloads $card.Source
    if (-not (Test-Path -LiteralPath $sourcePath)) { throw "Source absente: $sourcePath" }
    $wantedName = Normalize-Text $card.Name
    $candidates = @($renderFiles | Where-Object {
      (Normalize-Text $_.BaseName).Contains($wantedName) -and (Is-RarityMatch $_.BaseName $card.Rarity)
    })
    if ($candidates.Count -ne 1) {
      throw "Correspondance ambiguë pour $($card.Name) [$($card.Rarity)]: $($candidates.Name -join ', ')"
    }
    $mappings += [pscustomobject]@{ Source=$sourcePath; Target=$candidates[0].FullName; Name=$card.Name; Rarity=$card.Rarity }
  }

  if (($mappings.Target | Sort-Object -Unique).Count -ne $cards.Count) {
    throw "Au moins deux sources ciblent le même rendu."
  }

  foreach ($mapping in $mappings) {
    $sourceBitmap = [Drawing.Bitmap]::new($mapping.Source)
    $targetBitmap = [Drawing.Bitmap]::new($mapping.Target)
    try {
      $bounds = Get-ContentBounds $sourceBitmap
      $output = [Drawing.Bitmap]::new($targetBitmap.Width, $targetBitmap.Height, [Drawing.Imaging.PixelFormat]::Format32bppArgb)
      try {
        $graphics = [Drawing.Graphics]::FromImage($output)
        try {
          $graphics.Clear([Drawing.Color]::Transparent)
          $graphics.CompositingMode = [Drawing.Drawing2D.CompositingMode]::SourceCopy
          $graphics.CompositingQuality = [Drawing.Drawing2D.CompositingQuality]::HighQuality
          $graphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
          $graphics.PixelOffsetMode = [Drawing.Drawing2D.PixelOffsetMode]::HighQuality
          $graphics.SmoothingMode = [Drawing.Drawing2D.SmoothingMode]::HighQuality
          $destination = [Drawing.Rectangle]::new(0, 0, $output.Width, $output.Height)
          $graphics.DrawImage($sourceBitmap, $destination, $bounds, [Drawing.GraphicsUnit]::Pixel)
        } finally {
          $graphics.Dispose()
        }
        $temporary = "$($mapping.Target).new.png"
        $output.Save($temporary, [Drawing.Imaging.ImageFormat]::Png)
      } finally {
        $output.Dispose()
      }
    } finally {
      $sourceBitmap.Dispose()
      $targetBitmap.Dispose()
    }
    Move-Item -LiteralPath "$($mapping.Target).new.png" -Destination $mapping.Target -Force
  }

  $package = Get-Content -LiteralPath (Join-Path $repo "package.json") -Raw | ConvertFrom-Json
  if ($package.version -ne "0.2.11") { throw "Version inattendue: $($package.version), 0.2.11 attendue." }

  Push-Location $repo
  try {
    & npm.cmd run verify *> (Join-Path $statusRoot "allstar-verify.log")
    if ($LASTEXITCODE -ne 0) { throw "La vérification du catalogue a échoué." }

    Remove-Item -LiteralPath $MyInvocation.MyCommand.Path -Force
    git add -A
    git diff --cached --quiet
    if ($LASTEXITCODE -eq 0) { throw "Aucune modification à valider." }
    git commit -m "Finalize 0.2.11 card visuals and gameplay fixes" *> (Join-Path $statusRoot "allstar-commit.log")
    if ($LASTEXITCODE -ne 0) { throw "Le commit Git a échoué." }
    $hash = (git rev-parse --short HEAD).Trim()
    Set-Content -LiteralPath $commitMarker -Value $hash -Encoding ascii
  } finally {
    Pop-Location
  }

  $mappings | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath $okMarker -Encoding utf8
} catch {
  $_ | Out-String | Set-Content -LiteralPath $errorMarker -Encoding utf8
  throw
}
