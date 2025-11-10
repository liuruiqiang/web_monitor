# Android SDK Setup Helper
# This script helps detect and configure Android SDK for React Native

Write-Host ""
Write-Host "Android SDK Setup Helper" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

# Common Android SDK locations
$possibleLocations = @(
    "$env:LOCALAPPDATA\Android\Sdk",
    "C:\Android\Sdk",
    "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk",
    "D:\Android\Sdk"
)

Write-Host "Searching for Android SDK..." -ForegroundColor Yellow
Write-Host ""

$foundSdk = $null

foreach ($location in $possibleLocations) {
    if (Test-Path $location) {
        Write-Host "Found SDK at: $location" -ForegroundColor Green
        
        # Verify it's a valid SDK
        $platformTools = Join-Path $location "platform-tools"
        $buildTools = Join-Path $location "build-tools"
        
        if ((Test-Path $platformTools) -and (Test-Path $buildTools)) {
            $foundSdk = $location
            Write-Host "  - Valid SDK installation detected" -ForegroundColor Green
            break
        } else {
            Write-Host "  - Incomplete SDK installation" -ForegroundColor Yellow
        }
    }
}

if (-not $foundSdk) {
    Write-Host "No Android SDK found in common locations" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Android Studio first:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://developer.android.com/studio" -ForegroundColor Gray
    Write-Host "2. Run the installer" -ForegroundColor Gray
    Write-Host "3. Follow the setup wizard to install Android SDK" -ForegroundColor Gray
    Write-Host "4. Run this script again" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "Current ANDROID_HOME: $env:ANDROID_HOME" -ForegroundColor Cyan

if ($env:ANDROID_HOME -eq $foundSdk) {
    Write-Host ""
    Write-Host "ANDROID_HOME is already correctly set!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ANDROID_HOME needs to be updated" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To set ANDROID_HOME permanently:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Option 1: Using System Properties (Recommended)" -ForegroundColor Yellow
    Write-Host "1. Press Win + X, select 'System'" -ForegroundColor Gray
    Write-Host "2. Click 'Advanced system settings'" -ForegroundColor Gray
    Write-Host "3. Click 'Environment Variables'" -ForegroundColor Gray
    Write-Host "4. Under System variables, click 'New'" -ForegroundColor Gray
    Write-Host "   Variable name: ANDROID_HOME" -ForegroundColor Gray
    Write-Host "   Variable value: $foundSdk" -ForegroundColor Gray
    Write-Host "5. Edit 'Path', add these entries:" -ForegroundColor Gray
    Write-Host "   %ANDROID_HOME%\platform-tools" -ForegroundColor Gray
    Write-Host "   %ANDROID_HOME%\tools" -ForegroundColor Gray
    Write-Host "6. Click OK and restart PowerShell" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Option 2: Using PowerShell (Current session only)" -ForegroundColor Yellow
    Write-Host "Run this command:" -ForegroundColor Gray
    Write-Host "`$env:ANDROID_HOME = '$foundSdk'" -ForegroundColor Cyan
    Write-Host ""
    
    $setNow = Read-Host "Set ANDROID_HOME for current PowerShell session? (Y/N)"
    if ($setNow -eq 'Y' -or $setNow -eq 'y') {
        $env:ANDROID_HOME = $foundSdk
        $env:Path = "$env:Path;$foundSdk\platform-tools;$foundSdk\tools"
        Write-Host ""
        Write-Host "ANDROID_HOME set to: $foundSdk" -ForegroundColor Green
        Write-Host "This will only work in the current PowerShell session!" -ForegroundColor Yellow
        Write-Host "For permanent setup, follow Option 1 above" -ForegroundColor Yellow
        Write-Host ""
    }
}

# Check SDK components
Write-Host ""
Write-Host "Checking SDK components..." -ForegroundColor Yellow
Write-Host ""

$platformTools = Join-Path $foundSdk "platform-tools"
if (Test-Path $platformTools) {
    Write-Host "Platform tools: OK" -ForegroundColor Green
    $adb = Join-Path $platformTools "adb.exe"
    if (Test-Path $adb) {
        Write-Host "  - adb.exe found" -ForegroundColor Green
    }
} else {
    Write-Host "Platform tools: MISSING" -ForegroundColor Red
    Write-Host "  Install via Android Studio SDK Manager" -ForegroundColor Yellow
}

$buildTools = Join-Path $foundSdk "build-tools"
if (Test-Path $buildTools) {
    $versions = Get-ChildItem $buildTools -Directory | Select-Object -ExpandProperty Name | Sort-Object -Descending
    if ($versions) {
        Write-Host "Build tools: OK" -ForegroundColor Green
        Write-Host "  - Installed versions: $($versions -join ', ')" -ForegroundColor Gray
        
        # Check if version 34.0.0 exists
        if ($versions -contains "34.0.0") {
            Write-Host "  - Version 34.0.0 (required by React Native): FOUND" -ForegroundColor Green
        } else {
            Write-Host "  - Version 34.0.0 (required): NOT FOUND" -ForegroundColor Yellow
            Write-Host "    Latest version: $($versions[0])" -ForegroundColor Gray
            Write-Host "    This should work fine for React Native" -ForegroundColor Cyan
        }
    }
} else {
    Write-Host "Build tools: MISSING" -ForegroundColor Red
    Write-Host "  Install via Android Studio SDK Manager" -ForegroundColor Yellow
}

$platforms = Join-Path $foundSdk "platforms"
if (Test-Path $platforms) {
    $androidVersions = Get-ChildItem $platforms -Directory | Select-Object -ExpandProperty Name
    if ($androidVersions) {
        Write-Host "Android platforms: OK" -ForegroundColor Green
        Write-Host "  - Installed: $($androidVersions -join ', ')" -ForegroundColor Gray
    }
} else {
    Write-Host "Android platforms: MISSING" -ForegroundColor Red
}

Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "--------" -ForegroundColor Cyan
Write-Host "SDK Location: $foundSdk" -ForegroundColor White
Write-Host ""

if ($env:ANDROID_HOME -eq $foundSdk) {
    Write-Host "Status: Ready for React Native development!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now run:" -ForegroundColor Cyan
    Write-Host "  cd d:\dev_projects\mobile_rn" -ForegroundColor Gray
    Write-Host "  .\RUN_ANDROID.ps1" -ForegroundColor Gray
} else {
    Write-Host "Status: ANDROID_HOME needs to be set permanently" -ForegroundColor Yellow
    Write-Host "Follow the instructions above to set it" -ForegroundColor Yellow
}

Write-Host ""
