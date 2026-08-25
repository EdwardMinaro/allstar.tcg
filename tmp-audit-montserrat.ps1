$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$repo = Split-Path -Parent $MyInvocation.MyCommand.Path
$downloads = 'C:\Users\LENOVO\Downloads'
$assets = Join-Path $repo 'assets\card_renders'

$items = @(
  @{ Source='Standards_Catcheurs_Luke_Kane.png'; Name='Luke Kane'; Rarity='standard' },
  @{ Source='Standards_Catcheurs_Maxime_Cuadrado.png'; Name='Maxime Cuadrado'; Rarity='standard' },
  @{ Source='Standards_Catcheurs_Nils_N.png'; Name="Nils'N"; Rarity='standard' },
  @{ Source='Standards_Catcheurs_Nocif.png'; Name='Nocif'; Rarity='standard' },
  @{ Source='Standards_Catcheurs_Paul_Meunier.png'; Name='Paul Meunier'; Rarity='standard' },
  @{ Source='Légendaires_Catcheurs_Black_Sam.png'; Name='Black Sam'; Rarity='legendaire' },
  @{ Source='Légendaires_Catcheurs_Drix.png'; Name='Drix'; Rarity='legendaire' },
  @{ Source='Légendaires_Catcheurs_Ethan_Riley.png'; Name='Ethan Riley'; Rarity='legendaire' },
  @{ Source='Légendaires_Catcheurs_Maxime_Cuadrado.png'; Name='Maxime Cuadrado'; Rarity='legendaire' },
  @{ Source='Légendaires_Catcheurs_NILS_N.png'; Name="Nils'N"; Rarity='legendaire' },
  @{ Source='Rare_Catcheurs_Angelo_Folena.png'; Name='Angelo Folena'; Rarity='rare' },
  @{ Source='Rare_Catcheurs_Black_Sam (1).png'; Name='Black Sam'; Rarity='rare' },
  @{ Source='Rare_Catcheurs_Drix.png'; Name='Drix'; Rarity='rare' },
  @{ Source='Rare_Catcheurs_Ethan_Riley.png'; Name='Ethan Riley'; Rarity='rare' },
  @{ Source='Rare_Catcheurs_Maxime_Cuadrado.png'; Name='Maxime Cuadrado'; Rarity='rare' },
  @{ Source='Rare_Catcheurs_Nils_N.png'; Name="Nils'N"; Rarity='rare' },
  @{ Source='Rare_Catcheurs_Paul_Meunier.png'; Name='Paul Meunier'; Rarity='rare' },
  @{ Source='Standards_Catcheurs_Angelo_Folena.png'; Name='Angelo Folena'; Rarity='standard' },
  @{ Source='Standards_Catcheurs_Black_Sam.png'; Name='Black Sam'; Rarity='standard' },
  @{ Source='Standards_Catcheurs_Drix.png'; Name='Drix'; Rarity='standard' },
  @{ Source='Standards_Catcheurs_Ethan_Riley.png'; Name='Ethan Riley'; Rarity='standard' },
  @{ Source='Standards_Catcheurs_Jey_Kill.png'; Name='Jey Kill'; Rarity='standard' }
)

function Normalize([string]$value) {
  if ($null -eq $value) { return '' }
  $formD = $value.Normalize([Text.NormalizationForm]::FormD)
  $chars = foreach ($char in $formD.ToCharArray()) {
    if ([Globalization.CharUnicodeInfo]::GetUnicodeCategory($char) -ne [Globalization.UnicodeCategory]::NonSpacingMark) { $char }
  }
  return (-join $chars).ToLowerInvariant() -replace '[^a-z0-9]', ''
}

$renderFiles = Get-ChildItem -LiteralPath $assets -Recurse -File -Filter '*.png'

foreach ($item in $items) {
  $nameKey = Normalize $item.Name
  $rarityAliases = switch ($item.Rarity) {
    'legendaire' { @('legendaire','legende','legendary') }
    default { @($item.Rarity) }
  }
  $scored = foreach ($file in $renderFiles) {
    $key = Normalize $file.BaseName
    $score = 0
    if ($key.Contains($nameKey)) { $score += 100 }
    foreach ($alias in $rarityAliases) {
      if ($key.Contains((Normalize $alias))) { $score += 30 }
    }
    if ($item.Rarity -eq 'standard' -and -not ($key -match 'rare|legend')) { $score += 5 }
    if ($score -gt 0) { [pscustomobject]@{ File=$file; Score=$score } }
  }
  $best = $scored | Sort-Object Score -Descending, @{Expression={$_.File.Name.Length}; Ascending=$true} | Select-Object -First 1
  $item.SourcePath = Join-Path $downloads $item.Source
  $item.TargetPath = if ($best) { $best.File.FullName } else { '' }
  $item.Score = if ($best) { $best.Score } else { 0 }
}

$width = 1800
$rowHeight = 105
$height = 100 + ($items.Count * $rowHeight)
$canvas = New-Object Drawing.Bitmap $width, $height
$g = [Drawing.Graphics]::FromImage($canvas)
$g.Clear([Drawing.Color]::FromArgb(18,18,25))
$g.TextRenderingHint = [Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$titleFont = New-Object Drawing.Font 'Arial', 22, ([Drawing.FontStyle]::Bold)
$font = New-Object Drawing.Font 'Consolas', 11
$okBrush = New-Object Drawing.SolidBrush ([Drawing.Color]::FromArgb(255,200,45))
$whiteBrush = [Drawing.Brushes]::White
$mutedBrush = New-Object Drawing.SolidBrush ([Drawing.Color]::FromArgb(180,190,205))
$badBrush = New-Object Drawing.SolidBrush ([Drawing.Color]::FromArgb(255,90,90))
$g.DrawString('Audit visuels Montserrat - correspondances avant remplacement', $titleFont, $okBrush, 28, 24)

$y = 82
foreach ($item in $items) {
  $sourceOk = Test-Path -LiteralPath $item.SourcePath
  $targetOk = $item.TargetPath -and (Test-Path -LiteralPath $item.TargetPath)
  $brush = if ($sourceOk -and $targetOk -and $item.Score -ge 100) { $whiteBrush } else { $badBrush }
  $status = if ($sourceOk -and $targetOk -and $item.Score -ge 100) { 'OK' } else { 'ERREUR' }
  $g.DrawString(('{0,-7} {1,-10} {2}' -f $status, $item.Rarity, $item.Name), $font, $brush, 28, $y)
  $g.DrawString(('source: ' + $item.Source), $font, $mutedBrush, 410, $y)
  $targetLabel = if ($targetOk) { $item.TargetPath.Substring($repo.Length + 1) } else { '(introuvable)' }
  $g.DrawString(('cible:  ' + $targetLabel + '  score=' + $item.Score), $font, $mutedBrush, 410, ($y + 28))
  $g.DrawLine((New-Object Drawing.Pen ([Drawing.Color]::FromArgb(50,60,75))), 20, ($y + 72), 1770, ($y + 72))
  $y += $rowHeight
}

$auditPng = Join-Path $repo 'tmp-montserrat-audit.png'
$auditJson = Join-Path $repo 'tmp-montserrat-audit.json'
$canvas.Save($auditPng, [Drawing.Imaging.ImageFormat]::Png)
$items | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $auditJson -Encoding UTF8

$g.Dispose(); $canvas.Dispose(); $titleFont.Dispose(); $font.Dispose(); $okBrush.Dispose(); $mutedBrush.Dispose(); $badBrush.Dispose()
