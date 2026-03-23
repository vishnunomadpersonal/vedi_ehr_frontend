$base = "C:\Users\andre\Downloads\Reconstruct\vedi_ehr_frontend_8\src\app\dashboard"
$ehrRoutes = @('patients','encounters','schedule','sessions','recordings','tasks','settings','telehealth','messages','orders','prescriptions','reports','admin','billing','login')
$count = 0
Get-ChildItem -LiteralPath $base -Recurse -Filter "*.tsx" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $updated = $content
    foreach ($r in $ehrRoutes) {
        $updated = $updated -replace "([`"'])/$r(?=[/`"')\s])", "`$1/dashboard/$r"
    }
    if ($updated -ne $content) {
        Set-Content $_.FullName -Value $updated -NoNewline
        $count++
        Write-Host "Fixed: $($_.Name)"
    }
}
Write-Host "Total files fixed: $count"
