@echo off
REM Quick Deploy to Vercel - Direct to CMS Backend

echo ====================================
echo Deploy Frontend to Vercel
echo ====================================
echo.
echo Backend API: https://cms.wininvoice.vn/api
echo Frontend URL: https://fe-create-order.vercel.app
echo.
echo Đang deploy...
echo.

REM Build project
echo [1/2] Building project...
call npm run build

echo.
echo [2/2] Deploying to Vercel...
call vercel --prod --yes

echo.
echo ✅ DONE!
echo.
echo ✅ Frontend: https://fe-create-order.vercel.app
echo ✅ Backend: https://cms.wininvoice.vn/api
echo ✅ Đã cấu hình gọi trực tiếp (không qua proxy)
echo.
pause

