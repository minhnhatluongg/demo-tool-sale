@echo off
echo ========================================
echo  Deploy React App to IIS
echo ========================================

REM Set your IIS site path here
set IIS_SITE_PATH=C:\inetpub\wwwroot\wininvoice

echo.
echo Copying build files to IIS site...
echo From: %~dp0build
echo To: %IIS_SITE_PATH%
echo.

if not exist "%IIS_SITE_PATH%" (
    echo Creating IIS directory...
    mkdir "%IIS_SITE_PATH%"
)

echo Copying files...
xcopy /E /I /Y "%~dp0build\*" "%IIS_SITE_PATH%\"

echo.
echo ========================================
echo  Deployment completed!
echo ========================================
echo.
echo Next steps:
echo 1. Open IIS Manager
echo 2. Create a new website or use Default Web Site
echo 3. Set physical path to: %IIS_SITE_PATH%
echo 4. Make sure IIS features are enabled:
echo    - Static Content
echo    - Default Document
echo    - URL Rewrite
echo.
echo Your app will be available at: http://localhost
echo ========================================

pause