<#
.SYNOPSIS
  Renames this template to a new project name in one shot.

.DESCRIPTION
  Replaces three tokens everywhere (file contents + file names):
    AppTemplate    -> <NewName>      (PascalCase: namespaces, .csproj, .sln, dll)
    app-template   -> <new-name>     (kebab-case: npm package name)
    "App Template" -> "<New Name>"   (spaced: window/page titles, headings)

  Skips node_modules, bin, obj, dist, .git, and the rename scripts themselves.
  Run this ONCE on a fresh copy of the template, before `npm install`.

.EXAMPLE
  ./rename.ps1 OrderPortal
#>
param(
  [Parameter(Mandatory = $true)]
  [string]$NewName
)

# Derive the other two casings from the PascalCase input.
$kebab = ($NewName -creplace '([a-z0-9])([A-Z])', '$1-$2').ToLower()
$title =  $NewName -creplace '([a-z0-9])([A-Z])', '$1 $2'

Write-Host "Renaming:"
Write-Host "  AppTemplate    -> $NewName"
Write-Host "  app-template   -> $kebab"
Write-Host "  'App Template' -> '$title'"

$excludeDirs  = @('node_modules', 'bin', 'obj', 'dist', '.git')
$excludeFiles = @('rename.ps1', 'rename.sh')

function Test-Excluded($fullName) {
  $parts = $fullName -split '[\\/]'
  foreach ($p in $parts) { if ($excludeDirs -contains $p) { return $true } }
  return $false
}

# 1) Replace file contents. -creplace is CASE-SENSITIVE — important, because
#    PowerShell's default -replace is case-insensitive and would mangle tokens.
Get-ChildItem -Recurse -File | Where-Object {
  -not (Test-Excluded $_.FullName) -and ($excludeFiles -notcontains $_.Name)
} | ForEach-Object {
  $content = Get-Content -LiteralPath $_.FullName -Raw
  if ($content -cmatch 'App Template|AppTemplate|app-template') {
    $content = $content -creplace 'App Template', $title
    $content = $content -creplace 'AppTemplate', $NewName
    $content = $content -creplace 'app-template', $kebab
    Set-Content -LiteralPath $_.FullName -Value $content -NoNewline
  }
}

# 2) Rename files whose NAME contains the token (.sln, .csproj).
Get-ChildItem -Recurse -File -Filter '*AppTemplate*' | Where-Object {
  -not (Test-Excluded $_.FullName)
} | ForEach-Object {
  $newFileName = $_.Name -creplace 'AppTemplate', $NewName
  Rename-Item -LiteralPath $_.FullName -NewName $newFileName
}

Write-Host ""
Write-Host "Done. Next: cd client; npm install; then open the folder in VS Code."
