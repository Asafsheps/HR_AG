# ==================================================
# HR Project — Pre-Deploy Checklist
# Run: .\scripts\deploy-check.ps1
# ==================================================

$pass = 0
$fail = 0
$warn = 0

function Check($label, $ok, $msg = "") {
    if ($ok) {
        Write-Host "  [OK] $label" -ForegroundColor Green
        $script:pass++
    } else {
        Write-Host "  [FAIL] $label$(if($msg){": $msg"})" -ForegroundColor Red
        $script:fail++
    }
}
function Warn($label, $msg = "") {
    Write-Host "  [WARN] $label$(if($msg){": $msg"})" -ForegroundColor Yellow
    $script:warn++
}

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host " HR Project — Pre-Deploy Checklist"  -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# ── 1. Git state ─────────────────────────────────────────────────────────────
Write-Host "Git" -ForegroundColor White
$branch     = git rev-parse --abbrev-ref HEAD 2>$null
$dirty      = git status --porcelain 2>$null
$commitCount= (git rev-list --count HEAD 2>$null)
Check "On a named branch"    ($branch -ne "" -and $branch -ne "HEAD") "branch: $branch"
Check "No uncommitted changes" (-not $dirty)
Check "Has commits"            ($commitCount -gt 0) "$commitCount commits"
Write-Host ""

# ── 2. .env.local ────────────────────────────────────────────────────────────
Write-Host ".env.local" -ForegroundColor White
$envFile = ".\.env.local"
Check ".env.local exists" (Test-Path $envFile)

if (Test-Path $envFile) {
    $env = Get-Content $envFile | Where-Object { $_ -match "^[^#].*=.+" }
    $envMap = @{}
    $env | ForEach-Object {
        $parts = $_ -split "=", 2
        $envMap[$parts[0].Trim()] = $parts[1].Trim()
    }

    $required = @(
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
        "ANTHROPIC_API_KEY"
    )
    foreach ($key in $required) {
        $val = $envMap[$key]
        Check "$key set" ($val -and $val -notmatch "your-|change-me|xxx|placeholder")
    }

    # Warn about optional but important vars
    foreach ($key in @("TELEGRAM_BOT_TOKEN", "NEXT_PUBLIC_APP_URL")) {
        if (-not $envMap[$key] -or $envMap[$key] -match "your-|localhost") {
            Warn "$key not set or still default"
        }
    }
}
Write-Host ""

# ── 3. Build check ───────────────────────────────────────────────────────────
Write-Host "Build" -ForegroundColor White
$nodeOk = (node --version 2>$null) -match "v\d"
$npmOk  = (npm --version 2>$null)  -match "\d"
Check "Node.js installed"  $nodeOk
Check "npm installed"      ($npmOk -ne $null)

$nmExists = Test-Path ".\node_modules"
Check "node_modules exists (npm install)" $nmExists
Write-Host ""

# ── 4. TypeScript ─────────────────────────────────────────────────────────────
Write-Host "TypeScript" -ForegroundColor White
$tscOut = npm run type-check 2>&1
$tscOk  = $LASTEXITCODE -eq 0
Check "tsc --noEmit passes" $tscOk
Write-Host ""

# ── 5. Supabase migrations ────────────────────────────────────────────────────
Write-Host "Supabase Migrations" -ForegroundColor White
$migrations = Get-ChildItem ".\supabase\migrations\*.sql" -ErrorAction SilentlyContinue
Check "Migration files exist" ($migrations.Count -gt 0) "$($migrations.Count) files"
$supabaseCli = Get-Command supabase -ErrorAction SilentlyContinue
if ($supabaseCli) {
    Check "Supabase CLI installed" $true
} else {
    Warn "Supabase CLI not installed — install with: npm i -g supabase"
}
Write-Host ""

# ── 6. Vercel config ──────────────────────────────────────────────────────────
Write-Host "Vercel" -ForegroundColor White
Check "vercel.json exists" (Test-Path ".\vercel.json")
$vercelCli = Get-Command vercel -ErrorAction SilentlyContinue
if ($vercelCli) {
    Check "Vercel CLI installed" $true
} else {
    Warn "Vercel CLI not installed — install with: npm i -g vercel"
}
Write-Host ""

# ── Summary ───────────────────────────────────────────────────────────────────
Write-Host "====================================" -ForegroundColor Cyan
Write-Host " Results: $pass passed, $fail failed, $warn warnings" -ForegroundColor $(if($fail -gt 0){"Red"}elseif($warn -gt 0){"Yellow"}else{"Green"})
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

if ($fail -gt 0) {
    Write-Host "Fix the above failures before deploying." -ForegroundColor Red
    exit 1
} elseif ($warn -gt 0) {
    Write-Host "Ready to deploy (with warnings)." -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "All checks passed. Ready to deploy!" -ForegroundColor Green
    exit 0
}
