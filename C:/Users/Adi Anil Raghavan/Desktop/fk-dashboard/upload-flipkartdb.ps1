# upload-flipkartdb.ps1
# Pushes the fk-dashboard project to GitHub via the Contents API (no git needed).
#
# 1. Create an EMPTY repo on GitHub first: github.com -> New -> name "flipkartdb"
#    (do NOT add a README / .gitignore / license — leave it completely empty).
# 2. Put this script inside the fk-dashboard folder (next to package.json).
# 3. Set $TOKEN below to a fine-grained PAT with Contents: Read/Write on flipkartdb
#    (or a classic PAT with "repo" scope).
# 4. Right-click -> Run with PowerShell, or:  powershell -ExecutionPolicy Bypass -File .\upload-flipkartdb.ps1

$TOKEN  = "PASTE_YOUR_PAT_HERE"
$REPO   = "ns-adiraghavan/flipkartdb"
$ROOT   = $PSScriptRoot          # the folder this script sits in
$BRANCH = "main"

# GitHub requires TLS 1.2 (Windows PowerShell 5.1 often defaults lower).
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$HEADERS = @{
    Authorization = "token $TOKEN"
    Accept        = "application/vnd.github.v3+json"
}

# Folders / files to skip.
$skipDirs = @('\node_modules\', '\dist\', '\.git\')
$thisFile = $MyInvocation.MyCommand.Name

$files = Get-ChildItem -Path $ROOT -Recurse -File | Where-Object {
    $full = $_.FullName
    $skip = $false
    foreach ($d in $skipDirs) { if ($full -like "*$d*") { $skip = $true } }
    if ($_.Name -eq $thisFile)                 { $skip = $true }   # don't upload the uploader
    if ($_.Extension -eq '.zip')               { $skip = $true }
    if ($_.Extension -eq '.log')               { $skip = $true }
    if ($full -like '*\data\incoming\*.xlsx')  { $skip = $true }   # raw workbooks = PII
    -not $skip
}

Write-Host "Uploading $($files.Count) files to $REPO ($BRANCH)...`n"
$ok = 0; $fail = 0

foreach ($f in $files) {
    $rel     = $f.FullName.Substring($ROOT.Length).TrimStart('\')
    $apiPath = $rel -replace '\\', '/'
    $url     = "https://api.github.com/repos/$REPO/contents/$apiPath"

    $bytes = [System.IO.File]::ReadAllBytes($f.FullName)
    $b64   = [Convert]::ToBase64String($bytes)

    # existing SHA (needed to update a file that already exists)
    try {
        $existing = Invoke-RestMethod -Uri "$url`?ref=$BRANCH" -Headers $HEADERS -Method Get -ErrorAction Stop
        $sha = $existing.sha
    } catch { $sha = $null }

    $body = @{ message = "upload: $apiPath"; content = $b64; branch = $BRANCH }
    if ($sha) { $body.sha = $sha }

    try {
        Invoke-RestMethod -Uri $url -Headers $HEADERS -Method Put `
            -Body (ConvertTo-Json $body -Depth 5) -ContentType "application/json" | Out-Null
        $status = if ($sha) { "UPDATED" } else { "CREATED" }
        Write-Host ("{0,-8} {1}" -f $status, $apiPath)
        $ok++
    } catch {
        Write-Host ("FAIL     {0} - {1}" -f $apiPath, $_.Exception.Message) -ForegroundColor Red
        $fail++
    }
}

Write-Host "`nDone. $ok uploaded, $fail failed."
if ($fail -eq 0) {
    Write-Host "Now import ns-adiraghavan/flipkartdb in Vercel (New Project -> Import). Vercel will build and deploy."
}
