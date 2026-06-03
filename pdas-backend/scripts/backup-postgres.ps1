param(
  [string]$OutputDirectory = ".\backups"
)

$ErrorActionPreference = "Stop"

if (-not $env:DB_HOST -or -not $env:DB_NAME -or -not $env:DB_USER) {
  throw "DB_HOST, DB_NAME, and DB_USER environment variables are required."
}

if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
  throw "pg_dump was not found on PATH. Install PostgreSQL client tools before running backups."
}

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupPath = Join-Path $OutputDirectory "$($env:DB_NAME)-$timestamp.dump"

pg_dump `
  --host $env:DB_HOST `
  --port $(if ($env:DB_PORT) { $env:DB_PORT } else { "5432" }) `
  --username $env:DB_USER `
  --format custom `
  --file $backupPath `
  $env:DB_NAME

Write-Output "Backup created: $backupPath"
