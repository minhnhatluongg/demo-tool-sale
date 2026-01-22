# PowerShell script to set Vercel environment variable

$API_URL = "https://cms.wininvoice.vn/api"

Write-Host "Setting REACT_APP_API_URL = $API_URL" -ForegroundColor Green

# Using echo to pipe value
$API_URL | vercel env add REACT_APP_API_URL production

Write-Host "`nDeploying to production..." -ForegroundColor Yellow
vercel --prod --yes

Write-Host "`n✅ Done!" -ForegroundColor Green
Write-Host "Frontend: https://fe-create-order.vercel.app" -ForegroundColor Cyan
Write-Host "Backend:  https://cms.wininvoice.vn/api" -ForegroundColor Cyan

