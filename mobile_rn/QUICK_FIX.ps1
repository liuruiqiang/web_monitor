# Quick Fix - Reinitialize React Native project properly

Write-Host ""
Write-Host "React Native Quick Fix" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This will properly set up the React Native Android configuration" -ForegroundColor Yellow
Write-Host ""

# Step 1: Install React Native CLI globally
Write-Host "Step 1: Checking React Native CLI..." -ForegroundColor Yellow
npm install -g react-native-cli

# Step 2: Run React Native doctor
Write-Host ""
Write-Host "Step 2: Running React Native Doctor..." -ForegroundColor Yellow
npx react-native doctor

Write-Host ""
Write-Host "If doctor found issues, please fix them before continuing." -ForegroundColor Yellow
$continue = Read-Host "Continue? (Y/N)"

if ($continue -ne 'Y' -and $continue -ne 'y') {
    exit 1
}

# Step 3: Try to run the app
Write-Host ""
Write-Host "Step 3: Attempting to run the app..." -ForegroundColor Yellow
Write-Host ""

cd d:\dev_projects\mobile_rn
npx react-native run-android --verbose
