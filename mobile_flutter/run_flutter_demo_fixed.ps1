# ========================================
# Flutter Content Security Monitor - Setup & Run
# ========================================

Write-Host ""
Write-Host "🚀 Flutter 内容安全监控器 - 安装运行指南" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Flutter installation
Write-Host "📋 Step 1: 检查 Flutter 环境..." -ForegroundColor Yellow
Write-Host ""

$flutterVersion = flutter --version 2>$null
if ($flutterVersion) {
    Write-Host "✅ Flutter 已安装" -ForegroundColor Green
    flutter --version | Select-Object -First 1
} else {
    Write-Host "❌ Flutter 未安装!" -ForegroundColor Red
    Write-Host ""
    Write-Host "请按照以下步骤安装 Flutter:" -ForegroundColor Yellow
    Write-Host "1. 访问: https://docs.flutter.dev/get-started/install/windows" -ForegroundColor Gray
    Write-Host "2. 下载 Flutter SDK" -ForegroundColor Gray
    Write-Host "3. 解压到目录 (例如: C:\flutter)" -ForegroundColor Gray
    Write-Host "4. 添加到环境变量 PATH: C:\flutter\bin" -ForegroundColor Gray
    Write-Host "5. 运行: flutter doctor" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Step 2: Run flutter doctor
Write-Host "🏥 Step 2: 检查 Flutter 环境配置..." -ForegroundColor Yellow
Write-Host ""
flutter doctor

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Step 3: Check for Android device
Write-Host "📱 Step 3: 检查 Android 设备..." -ForegroundColor Yellow
Write-Host ""
flutter devices

$confirm = Read-Host "`n是否已连接设备或启动模拟器? (Y/N)"
if ($confirm -ne 'Y' -and $confirm -ne 'y') {
    Write-Host ""
    Write-Host "❌ 请先连接设备或启动模拟器!" -ForegroundColor Red
    Write-Host ""
    Write-Host "启动模拟器方法:" -ForegroundColor Yellow
    Write-Host "1. 打开 Android Studio" -ForegroundColor Gray
    Write-Host "2. Tools -> Device Manager" -ForegroundColor Gray
    Write-Host "3. 创建并启动 AVD" -ForegroundColor Gray
    Write-Host ""
    Write-Host "或使用命令:" -ForegroundColor Yellow
    Write-Host "flutter emulators" -ForegroundColor Gray
    Write-Host "flutter emulators --launch emulator_id" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Step 4: Navigate to project
Write-Host "📂 Step 4: 进入项目目录..." -ForegroundColor Yellow
Set-Location "d:\dev_projects\mobile_flutter"
Write-Host "✅ 当前目录: $(Get-Location)" -ForegroundColor Green
Write-Host ""

# Step 5: Get dependencies
Write-Host "📦 Step 5: 下载依赖包 (首次运行需要几分钟)..." -ForegroundColor Yellow
Write-Host ""
flutter pub get

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 依赖包下载完成!" -ForegroundColor Green
} else {
    Write-Host "❌ 依赖包下载失败!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Step 6: Run the app
Write-Host "🚀 Step 6: 构建并运行应用..." -ForegroundColor Yellow
Write-Host ""
Write-Host "⏳ 首次构建需要 3-5 分钟，请耐心等待..." -ForegroundColor Yellow
Write-Host ""

flutter run

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host "✅ 应用运行成功!" -ForegroundColor Green
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🎉 Flutter Demo 功能测试:" -ForegroundColor Cyan
    Write-Host "  1. 地址栏输入网址测试" -ForegroundColor White
    Write-Host "  2. 访问可疑网站会被拦截" -ForegroundColor White
    Write-Host "  3. 点击设置图标配置规则" -ForegroundColor White
    Write-Host "  4. 点击历史图标查看记录" -ForegroundColor White
    Write-Host ""
    Write-Host "🧪 测试 URL:" -ForegroundColor Cyan
    Write-Host "  ✅ 安全: google.com" -ForegroundColor Green
    Write-Host "  🚫 拦截: 包含 porn/adult/nude 等关键词的网址" -ForegroundColor Red
    Write-Host ""
    Write-Host "热重载: 在终端按 r 键重新加载" -ForegroundColor Yellow
    Write-Host "调试: 按 i 键查看 widget 树" -ForegroundColor Yellow
    Write-Host "退出: 按 q 键停止应用" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "构建失败! 请检查错误信息" -ForegroundColor Red
    exit 1
}
