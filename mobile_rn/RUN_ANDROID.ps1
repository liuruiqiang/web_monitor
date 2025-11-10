# React Native Content Security Monitor - Setup & Run Script

Write-Host ""
Write-Host "React Native Content Security Monitor - Android Setup" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Node.js
Write-Host "Step 1: Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "Node.js installed: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "ERROR: Node.js not found!" -ForegroundColor Red
    Write-Host "Please install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# Step 2: Check Java
Write-Host "Step 2: Checking Java JDK..." -ForegroundColor Yellow
$javaVersion = java -version 2>&1 | Select-String "version"
if ($javaVersion) {
    Write-Host "Java installed: $javaVersion" -ForegroundColor Green
} else {
    Write-Host "WARNING: Java not found!" -ForegroundColor Yellow
    Write-Host "Please install JDK 11 from: https://adoptium.net/" -ForegroundColor Gray
}

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# Step 3: Check Android SDK
Write-Host "Step 3: Checking ANDROID_HOME..." -ForegroundColor Yellow
if ($env:ANDROID_HOME) {
    Write-Host "ANDROID_HOME: $env:ANDROID_HOME" -ForegroundColor Green
} else {
    Write-Host "WARNING: ANDROID_HOME not set!" -ForegroundColor Yellow
    Write-Host "Please install Android Studio and set ANDROID_HOME" -ForegroundColor Gray
}

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# Step 4: Navigate to project
Write-Host "Step 4: Navigating to project directory..." -ForegroundColor Yellow
Set-Location "d:\dev_projects\mobile_rn"
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Green

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# Step 5: Install dependencies
Write-Host "Step 5: Installing dependencies..." -ForegroundColor Yellow
Write-Host "This may take a few minutes on first run..." -ForegroundColor Gray
Write-Host ""

npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "ERROR: Failed to install dependencies!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# Step 6: Check for devices
Write-Host "Step 6: Checking for Android devices..." -ForegroundColor Yellow
Write-Host ""

# Check if adb is available
$adbPath = $null
if ($env:ANDROID_HOME) {
    $adbPath = Join-Path $env:ANDROID_HOME "platform-tools\adb.exe"
}

if ($adbPath -and (Test-Path $adbPath)) {
    Write-Host "Running: $adbPath devices" -ForegroundColor Gray
    & $adbPath devices
} else {
    # Try to find adb in PATH
    $adbCommand = Get-Command adb -ErrorAction SilentlyContinue
    if ($adbCommand) {
        adb devices
    } else {
        Write-Host "WARNING: adb not found in PATH" -ForegroundColor Yellow
        Write-Host "This is normal if you haven't added Android SDK to PATH" -ForegroundColor Gray
        Write-Host ""
        if ($env:ANDROID_HOME) {
            Write-Host "Expected adb location: $env:ANDROID_HOME\platform-tools\adb.exe" -ForegroundColor Gray
        }
        Write-Host ""
        Write-Host "React Native will try to detect devices automatically during build." -ForegroundColor Cyan
    }
}

Write-Host ""
Write-Host "Make sure you have either:" -ForegroundColor Yellow
Write-Host "  1. A physical Android device connected via USB (USB debugging enabled)" -ForegroundColor Gray
Write-Host "  2. An Android emulator running (from Android Studio)" -ForegroundColor Gray
Write-Host ""

$confirm = Read-Host "Do you have a device/emulator ready? (Y/N)"
if ($confirm -ne 'Y' -and $confirm -ne 'y') {
    Write-Host ""
    Write-Host "Please start a device or emulator first!" -ForegroundColor Red
    Write-Host ""
    Write-Host "To start an Android emulator:" -ForegroundColor Yellow
    Write-Host "  1. Open Android Studio" -ForegroundColor Gray
    Write-Host "  2. Click on Device Manager (phone icon on the right)" -ForegroundColor Gray
    Write-Host "  3. Create a new Virtual Device or start an existing one" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Or run this command if you have Android SDK in PATH:" -ForegroundColor Yellow
    Write-Host "  emulator -avd YOUR_AVD_NAME" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# Step 7: Start Metro
Write-Host "Step 7: Starting Metro bundler..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Opening Metro in a new window..." -ForegroundColor Gray

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd d:\dev_projects\mobile_rn; Write-Host 'Metro Bundler Running...' -ForegroundColor Cyan; npm start"

Write-Host "Waiting 5 seconds for Metro to start..." -ForegroundColor Gray
Start-Sleep -Seconds 5
Write-Host "Metro bundler started!" -ForegroundColor Green

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

# Step 8: Build and run
Write-Host "Step 8: Building and running on Android..." -ForegroundColor Yellow
Write-Host ""
Write-Host "This will:" -ForegroundColor Gray
Write-Host "  - Build the Android app" -ForegroundColor Gray
Write-Host "  - Install it on your device/emulator" -ForegroundColor Gray
Write-Host "  - Launch the app" -ForegroundColor Gray
Write-Host ""
Write-Host "First build may take 2-5 minutes..." -ForegroundColor Yellow
Write-Host ""

npx react-native run-android

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "======================================================" -ForegroundColor Cyan
    Write-Host "SUCCESS! App is now running on your device!" -ForegroundColor Green
    Write-Host "======================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Demo Features to Test:" -ForegroundColor Cyan
    Write-Host "  1. Enter a URL in the address bar" -ForegroundColor White
    Write-Host "  2. Try visiting suspicious sites (will be blocked)" -ForegroundColor White
    Write-Host "  3. Tap settings icon to configure" -ForegroundColor White
    Write-Host "  4. Tap history icon to view blocks" -ForegroundColor White
    Write-Host ""
    Write-Host "Test URLs:" -ForegroundColor Cyan
    Write-Host "  Safe: https://www.google.com" -ForegroundColor Green
    Write-Host "  Blocked: URLs with porn, adult, nude keywords" -ForegroundColor Red
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERROR: Build failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  - No device/emulator connected" -ForegroundColor Gray
    Write-Host "  - ANDROID_HOME not set correctly" -ForegroundColor Gray
    Write-Host "  - Android SDK tools not installed" -ForegroundColor Gray
    exit 1
}
