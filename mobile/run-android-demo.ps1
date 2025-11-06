# ========================================
# Android Demo Setup & Run Guide
# ========================================

Write-Host "🚀 Content Security Monitor - Android Demo Setup" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check prerequisites
Write-Host "📋 Step 1: Checking prerequisites..." -ForegroundColor Yellow
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Gray
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "✅ Node.js installed: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js not found! Please install Node.js 16+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check Java
Write-Host "Checking Java (JDK)..." -ForegroundColor Gray
$javaVersion = java -version 2>&1 | Select-String "version"
if ($javaVersion) {
    Write-Host "✅ Java installed: $javaVersion" -ForegroundColor Green
} else {
    Write-Host "⚠️ Java not found! Please install JDK 11 from https://adoptium.net/" -ForegroundColor Yellow
}

# Check Android SDK
Write-Host "Checking ANDROID_HOME..." -ForegroundColor Gray
if ($env:ANDROID_HOME) {
    Write-Host "✅ ANDROID_HOME: $env:ANDROID_HOME" -ForegroundColor Green
} else {
    Write-Host "⚠️ ANDROID_HOME not set! Please install Android Studio and set ANDROID_HOME" -ForegroundColor Yellow
    Write-Host "   Typical path: C:\Users\YourName\AppData\Local\Android\Sdk" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Step 2: Navigate to project
Write-Host "📂 Step 2: Navigating to mobile project..." -ForegroundColor Yellow
Set-Location "d:\dev_projects\mobile"
Write-Host "✅ Current directory: $(Get-Location)" -ForegroundColor Green
Write-Host ""

# Step 3: Install dependencies
Write-Host "📦 Step 3: Installing dependencies (this may take a few minutes)..." -ForegroundColor Yellow
Write-Host ""
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install dependencies!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Step 4: Check for connected device
Write-Host "📱 Step 4: Checking for Android devices..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Running: adb devices" -ForegroundColor Gray
adb devices

Write-Host ""
Write-Host "⚠️ IMPORTANT: Make sure you have either:" -ForegroundColor Yellow
Write-Host "   1. A physical Android device connected via USB with USB debugging enabled" -ForegroundColor Gray
Write-Host "   2. An Android emulator running (from Android Studio)" -ForegroundColor Gray
Write-Host ""

$confirm = Read-Host "Do you have a device/emulator ready? (Y/N)"
if ($confirm -ne 'Y' -and $confirm -ne 'y') {
    Write-Host ""
    Write-Host "❌ Please connect a device or start an emulator first!" -ForegroundColor Red
    Write-Host ""
    Write-Host "To start an emulator:" -ForegroundColor Yellow
    Write-Host "1. Open Android Studio" -ForegroundColor Gray
    Write-Host "2. Click 'Device Manager' (phone icon)" -ForegroundColor Gray
    Write-Host "3. Create/Start an Android Virtual Device (AVD)" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Step 5: Start Metro bundler
Write-Host "🔧 Step 5: Starting Metro bundler..." -ForegroundColor Yellow
Write-Host ""
Write-Host "This will open a new window for the Metro bundler." -ForegroundColor Gray
Write-Host "Keep it running in the background!" -ForegroundColor Gray
Write-Host ""

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd d:\dev_projects\mobile; Write-Host '📦 Metro Bundler Running...' -ForegroundColor Cyan; npm start"

Write-Host "⏳ Waiting 5 seconds for Metro to start..." -ForegroundColor Gray
Start-Sleep -Seconds 5
Write-Host "✅ Metro bundler started!" -ForegroundColor Green
Write-Host ""

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Step 6: Build and run on Android
Write-Host "🚀 Step 6: Building and running on Android..." -ForegroundColor Yellow
Write-Host ""
Write-Host "This will:" -ForegroundColor Gray
Write-Host "  • Build the Android app" -ForegroundColor Gray
Write-Host "  • Install it on your device/emulator" -ForegroundColor Gray
Write-Host "  • Launch the app" -ForegroundColor Gray
Write-Host ""
Write-Host "⏳ This may take 2-5 minutes for first build..." -ForegroundColor Yellow
Write-Host ""

npx react-native run-android

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host "✅ SUCCESS! App should now be running on your device!" -ForegroundColor Green
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🎉 Demo Features to Test:" -ForegroundColor Cyan
    Write-Host "  1. Enter a URL in the address bar" -ForegroundColor White
    Write-Host "  2. Try visiting suspicious sites (will be blocked)" -ForegroundColor White
    Write-Host "  3. Tap ⚙️ to configure settings" -ForegroundColor White
    Write-Host "  4. Tap 📋 to view block history" -ForegroundColor White
    Write-Host ""
    Write-Host "🧪 Test URLs:" -ForegroundColor Cyan
    Write-Host "  • Safe: https://www.google.com" -ForegroundColor Green
    Write-Host "  • Blocked: Any URL with 'porn', 'adult', etc." -ForegroundColor Red
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Build failed! Check errors above." -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  • No device/emulator connected" -ForegroundColor Gray
    Write-Host "  • ANDROID_HOME not set correctly" -ForegroundColor Gray
    Write-Host "  • Android SDK tools not installed" -ForegroundColor Gray
    exit 1
}
