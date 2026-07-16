$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath ".vercel\project.json")) {
  throw "Vercel project is not linked. Run: npx vercel link"
}

$poolerFile = "supabase\.temp\pooler-url"
if (-not (Test-Path -LiteralPath $poolerFile)) {
  throw "Supabase project is not linked. Run: npx supabase link"
}

$securePassword = Read-Host "Supabase database password" -AsSecureString
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
try {
  $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
  $encodedPassword = [Uri]::EscapeDataString($plainPassword)
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
}

$passwordPointer = [IntPtr]::Zero
$plainPassword = $null
$poolerWithoutPassword = (Get-Content -Raw -LiteralPath $poolerFile).Trim()
if ($poolerWithoutPassword -notmatch '^postgresql://([^@]+)@(.+):5432/(.+)$') {
  throw "Unexpected Supabase pooler URL format."
}

$databaseUser = $Matches[1]
$databaseHost = $Matches[2]
$databaseName = $Matches[3]
$directUrl = "postgresql://${databaseUser}:${encodedPassword}@${databaseHost}:5432/${databaseName}?sslmode=require&uselibpqcompat=true"
$databaseUrl = "postgresql://${databaseUser}:${encodedPassword}@${databaseHost}:6543/${databaseName}?sslmode=require&uselibpqcompat=true"
$encodedPassword = $null

$siteUrl = Read-Host "Production site URL [https://khandryfruit.vercel.app]"
if ([string]::IsNullOrWhiteSpace($siteUrl)) { $siteUrl = "https://khandryfruit.vercel.app" }
$siteUrl = $siteUrl.TrimEnd('/')
$adminEmail = Read-Host "Production admin notification email"
if ([string]::IsNullOrWhiteSpace($adminEmail)) { throw "A production admin email is required." }

function New-RandomSecret {
  $bytes = New-Object byte[] 48
  [Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
  return [Convert]::ToBase64String($bytes)
}

function Set-VercelSecret([string]$Name, [string]$Value) {
  $Value | npx.cmd --yes vercel@latest env add $Name production --force --sensitive | Out-Host
  if ($LASTEXITCODE -ne 0) { throw "Failed to configure $Name" }
}

function Set-VercelPublic([string]$Name, [string]$Value) {
  $Value | npx.cmd --yes vercel@latest env add $Name production --force --no-sensitive | Out-Host
  if ($LASTEXITCODE -ne 0) { throw "Failed to configure $Name" }
}

$authSecret = New-RandomSecret
$cronSecret = New-RandomSecret

Set-VercelSecret "DATABASE_URL" $databaseUrl
Set-VercelSecret "DIRECT_URL" $directUrl
Set-VercelSecret "AUTH_SECRET" $authSecret
Set-VercelSecret "CRON_SECRET" $cronSecret
Set-VercelPublic "AUTH_URL" $siteUrl
Set-VercelPublic "NEXT_PUBLIC_SITE_URL" $siteUrl
Set-VercelPublic "NEXT_PUBLIC_DEFAULT_LOCALE" "de"
Set-VercelPublic "ADMIN_EMAIL" $adminEmail
Set-VercelPublic "WHATSAPP_NUMBER" "4917621809185"

$databaseUrl = $null
$directUrl = $null
$authSecret = $null
$cronSecret = $null

Write-Host "Vercel database and Better Auth variables configured for Production only." -ForegroundColor Green
Write-Host "Configure Preview separately with isolated database and test integrations." -ForegroundColor Yellow
Write-Host "No database password was written to the repository." -ForegroundColor Green
