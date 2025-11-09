# VSCode 中安装 Android SDK 完整指南

## 方法 1：通过 Android Studio 安装（推荐）

这是最简单可靠的方法，Android Studio 会自动下载和管理 Android SDK。

### 步骤 1：下载 Android Studio

1. 访问官网：https://developer.android.com/studio
2. 下载适合您系统的版本（Windows/macOS/Linux）
3. 安装 Android Studio

### 步骤 2：安装 Android SDK

1. **打开 Android Studio**
   - 首次启动时，会进入设置向导
   - 如果已经安装过，进入：`File` → `Settings`（Windows/Linux）或 `Android Studio` → `Preferences`（macOS）

2. **配置 SDK**
   - 在设置向导中选择 "Standard" 安装
   - 或在设置中：`Appearance & Behavior` → `System Settings` → `Android SDK`
   - 选择 SDK 版本（推荐至少安装 API 33 和最新的稳定版）
   - 点击 "Apply" 开始下载安装

3. **记录 SDK 路径**
   - Windows: `C:\Users\您的用户名\AppData\Local\Android\Sdk`
   - macOS: `~/Library/Android/sdk`
   - Linux: `~/Android/Sdk`

### 步骤 3：在 VSCode 中配置

1. **安装 Flutter 扩展**（如果开发 Flutter）
   - 打开 VSCode
   - 按 `Ctrl+Shift+X`（Windows/Linux）或 `Cmd+Shift+X`（macOS）打开扩展商店
   - 搜索 "Flutter" 并安装
   - 安装时会自动安装 "Dart" 扩展

2. **配置环境变量**

   **Windows:**
   - 按 `Win + R`，输入 `sysdm.cpl`，回车
   - 点击"高级" → "环境变量"
   - 在"系统变量"或"用户变量"中添加：
     ```
     ANDROID_HOME = C:\Users\您的用户名\AppData\Local\Android\Sdk
     ```
   - 编辑 `Path` 变量，添加：
     ```
     %ANDROID_HOME%\platform-tools
     %ANDROID_HOME%\tools
     %ANDROID_HOME%\tools\bin
     ```

   **macOS/Linux:**
   - 编辑 `~/.bashrc` 或 `~/.zshrc`：
     ```bash
     export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
     # 或
     export ANDROID_HOME=$HOME/Android/Sdk  # Linux
     
     export PATH=$PATH:$ANDROID_HOME/platform-tools
     export PATH=$PATH:$ANDROID_HOME/tools
     export PATH=$PATH:$ANDROID_HOME/tools/bin
     ```
   - 使配置生效：
     ```bash
     source ~/.bashrc  # 或 source ~/.zshrc
     ```

3. **验证安装**
   - 打开新的终端（重启终端以加载环境变量）
   - 运行：
     ```bash
     adb version
     ```
   - 如果显示版本号，说明安装成功

## 方法 2：手动安装 Android SDK（不推荐，但可行）

如果您不想安装完整的 Android Studio，可以手动安装 SDK。

### 步骤 1：下载 Command Line Tools

1. 访问：https://developer.android.com/studio#command-tools
2. 下载适合您系统的 "Command line tools only"
3. **重要：正确解压目录结构**
   - 解压下载的 zip 文件
   - 将解压后的 `cmdline-tools` 文件夹重命名为 `latest`
   - 创建目录：`C:\Android\sdk\cmdline-tools\`（或您选择的 SDK 根目录）
   - 将 `latest` 文件夹移动到 `C:\Android\sdk\cmdline-tools\latest\`
   - **最终目录结构应该是：**
     ```
     C:\Android\sdk\
     └── cmdline-tools\
         └── latest\
             ├── bin\
             ├── lib\
             └── ... (其他文件)
     ```

### 步骤 2：使用 SDK Manager

1. **设置环境变量（临时）**
   ```powershell
   # 在 PowerShell 中设置
   $env:ANDROID_HOME="C:\Android\sdk"
   $env:ANDROID_SDK_ROOT="C:\Android\sdk"
   ```

2. **使用 SDK Manager 安装组件**
   ```powershell
   # 方法 1：使用 --sdk_root 参数（推荐）
   cd C:\Android\sdk\cmdline-tools\latest\bin
   .\sdkmanager.bat --sdk_root=C:\Android\sdk "platform-tools" "platforms;android-33" "build-tools;33.0.0"
   
   # 方法 2：设置环境变量后直接使用
   $env:ANDROID_HOME="C:\Android\sdk"
   .\sdkmanager.bat "platform-tools" "platforms;android-33" "build-tools;33.0.0"
   ```

### 步骤 3：解决 "Could not determine SDK root" 错误

如果遇到此错误，使用以下方法：

**方法 A：使用 --sdk_root 参数（最简单）**
```powershell
# 每次使用时指定 SDK 根目录
.\sdkmanager.bat --sdk_root=C:\Android\sdk "platform-tools"
```

**方法 B：创建正确的目录结构**
```powershell
# 1. 确认目录结构正确
# C:\Android\sdk\cmdline-tools\latest\bin\sdkmanager.bat 必须存在

# 2. 设置环境变量
$env:ANDROID_HOME="C:\Android\sdk"
$env:ANDROID_SDK_ROOT="C:\Android\sdk"

# 3. 然后运行
cd C:\Android\sdk\cmdline-tools\latest\bin
.\sdkmanager.bat "platform-tools"
```

**方法 C：设置系统环境变量（永久）**
1. 按 `Win + R`，输入 `sysdm.cpl`，回车
2. 点击"高级" → "环境变量"
3. 在"用户变量"中新建：
   - `ANDROID_HOME` = `C:\Android\sdk`
   - `ANDROID_SDK_ROOT` = `C:\Android\sdk`
4. 重启 PowerShell/命令提示符

### 步骤 4：配置环境变量

按照方法 1 的步骤 3 配置环境变量（将 SDK 工具添加到 PATH）。

## 方法 3：通过 Flutter 自动配置

如果您使用 Flutter 开发，Flutter 可以帮您安装 Android SDK。

### 步骤 1：安装 Flutter

1. 下载 Flutter SDK：https://flutter.dev/docs/get-started/install
2. 解压并添加到 PATH

### 步骤 2：运行 Flutter Doctor

```bash
flutter doctor
```

### 步骤 3：安装 Android SDK

```bash
flutter doctor --android-licenses
```

按照提示接受所有许可证。

### 步骤 4：在 VSCode 中配置

1. 安装 Flutter 扩展
2. 按 `Ctrl+Shift+P`（Windows/Linux）或 `Cmd+Shift+P`（macOS）
3. 输入 "Flutter: New Project" 创建项目
4. VSCode 会自动检测 Android SDK

## VSCode 扩展推荐

### 必需扩展

1. **Flutter**（Flutter 开发）
   - 扩展 ID: `Dart-Code.flutter`
   - 功能：Flutter 开发支持、热重载、调试等

2. **Dart**（Dart 语言支持）
   - 扩展 ID: `Dart-Code.dart-code`
   - 功能：Dart 语法高亮、代码提示等

### 可选扩展

1. **Android iOS Emulator**
   - 扩展 ID: `DiemasMichiels.emulate`
   - 功能：在 VSCode 中启动 Android/iOS 模拟器

2. **Android Studio Theme**
   - 扩展 ID: `Visual Studio Code Team.visual-studio-code`
   - 功能：Android Studio 风格的代码主题

## 验证配置

### 1. 检查 Android SDK

```bash
# 检查 ANDROID_HOME
echo $ANDROID_HOME  # macOS/Linux
echo %ANDROID_HOME%  # Windows PowerShell

# 检查 adb
adb version

# 检查可用设备
adb devices
```

### 2. 检查 Flutter 配置

```bash
flutter doctor -v
```

应该看到类似输出：
```
[✓] Flutter (Channel stable, ...)
[✓] Android toolchain - develop for Android devices
    • Android SDK at /path/to/android/sdk
    • Platform android-33, build-tools 33.0.0
    • Java version OpenJDK Runtime Environment
[✓] VS Code (version ...)
```

### 3. 在 VSCode 中测试

1. 创建新的 Flutter 项目
2. 按 `F5` 启动调试
3. 选择 Android 设备或模拟器

## 常见问题解决

### 问题 1：VSCode 找不到 Android SDK

**解决方案：**
1. 确认环境变量 `ANDROID_HOME` 已正确设置
2. 重启 VSCode
3. 在 VSCode 中按 `Ctrl+Shift+P`，输入 "Flutter: Change SDK"，选择 Flutter SDK 路径

### 问题 1.1：Error: Could not determine SDK root

**错误信息：**
```
Error: Could not determine SDK root.
Error: Either specify it explicitly with --sdk_root= or move this package into its expected location: <sdk>\cmdline-tools\latest\
```

**原因：**
- 命令行工具的目录结构不正确
- 环境变量 `ANDROID_HOME` 或 `ANDROID_SDK_ROOT` 未设置
- SDK 工具不在预期位置

**解决方案：**

**方案 1：使用 --sdk_root 参数（最快）**
```powershell
# 导航到 sdkmanager 所在目录
cd C:\Android\sdk\cmdline-tools\latest\bin

# 使用 --sdk_root 参数明确指定 SDK 根目录
.\sdkmanager.bat --sdk_root=C:\Android\sdk "platform-tools" "platforms;android-33" "build-tools;33.0.0"
```

**方案 2：修正目录结构**
1. 确认您的目录结构如下：
   ```
   C:\Android\sdk\                    ← SDK 根目录
   └── cmdline-tools\
       └── latest\                    ← 必须是 "latest"，不是其他名称
           ├── bin\
           │   ├── sdkmanager.bat     ← 工具文件
           │   └── ...
           └── lib\
   ```

2. 如果结构不对，重新组织：
   ```powershell
   # 假设您解压到了 C:\Android\sdk\cmdline-tools
   # 需要将内容移到 latest 子目录
   
   # 1. 创建 latest 目录
   New-Item -ItemType Directory -Path "C:\Android\sdk\cmdline-tools\latest" -Force
   
   # 2. 移动文件（将 cmdline-tools 下的所有内容移到 latest 目录）
   Move-Item -Path "C:\Android\sdk\cmdline-tools\*" -Destination "C:\Android\sdk\cmdline-tools\latest\" -Exclude "latest"
   ```

**方案 3：设置环境变量**
```powershell
# 在 PowerShell 中临时设置
$env:ANDROID_HOME="C:\Android\sdk"
$env:ANDROID_SDK_ROOT="C:\Android\sdk"

# 然后运行 sdkmanager
cd C:\Android\sdk\cmdline-tools\latest\bin
.\sdkmanager.bat "platform-tools"
```

**方案 4：设置永久环境变量**
1. 按 `Win + R`，输入 `sysdm.cpl`，回车
2. 点击"高级" → "环境变量"
3. 在"用户变量"中新建：
   - 变量名：`ANDROID_HOME`
   - 变量值：`C:\Android\sdk`
4. 再新建：
   - 变量名：`ANDROID_SDK_ROOT`
   - 变量值：`C:\Android\sdk`
5. 重启 PowerShell/命令提示符
6. 验证：
   ```powershell
   echo $env:ANDROID_HOME
   ```

**完整安装示例：**
```powershell
# 1. 设置环境变量
$env:ANDROID_HOME="C:\Android\sdk"
$env:ANDROID_SDK_ROOT="C:\Android\sdk"

# 2. 导航到工具目录
cd C:\Android\sdk\cmdline-tools\latest\bin

# 3. 安装必需组件
.\sdkmanager.bat --sdk_root=$env:ANDROID_HOME "platform-tools"
.\sdkmanager.bat --sdk_root=$env:ANDROID_HOME "platforms;android-33"
.\sdkmanager.bat --sdk_root=$env:ANDROID_HOME "build-tools;33.0.0"

# 或者一次安装多个
.\sdkmanager.bat --sdk_root=$env:ANDROID_HOME "platform-tools" "platforms;android-33" "build-tools;33.0.0"
```

### 问题 2：许可证未接受

**解决方案：**
```bash
flutter doctor --android-licenses
```
按 `y` 接受所有许可证。

### 问题 3：adb 命令未找到

**解决方案：**
1. 确认 `platform-tools` 已添加到 PATH
2. 重启终端
3. 确认 SDK 路径正确

### 问题 4：模拟器无法启动

**解决方案：**
1. 确认已安装 Android 模拟器：
   - 在 Android Studio 中：`Tools` → `Device Manager` → `Create Device`
2. 或在命令行创建：
   ```bash
   avdmanager create avd -n test_avd -k "system-images;android-33;google_apis;x86_64"
   ```

### 问题 5：构建工具版本不匹配

**解决方案：**
1. 打开 Android Studio
2. `Tools` → `SDK Manager`
3. 在 "SDK Tools" 标签中安装最新版本的 Build Tools

## 推荐的 SDK 组件

### 必需组件

- Android SDK Platform（至少一个版本，推荐最新稳定版）
- Android SDK Build-Tools
- Android SDK Platform-Tools
- Android Emulator
- Android SDK Command-line Tools

### 推荐安装的 API 级别

- API 33 (Android 13)
- API 32 (Android 12L)
- API 31 (Android 12)

## 快速检查清单

- [ ] Android Studio 已安装
- [ ] Android SDK 已下载（至少一个 API 级别）
- [ ] `ANDROID_HOME` 环境变量已设置
- [ ] `platform-tools` 已添加到 PATH
- [ ] VSCode Flutter 扩展已安装
- [ ] `flutter doctor` 显示 Android toolchain 正常
- [ ] Android 许可证已接受
- [ ] 可以运行 `adb devices` 命令

## 网络问题解决

如果您在中国大陆，可能需要配置镜像：

### Android SDK 镜像

在 Android Studio 中：
1. `File` → `Settings` → `Appearance & Behavior` → `System Settings` → `Android SDK`
2. 点击 "SDK Update Sites" 标签
3. 添加镜像站点（如果需要）

### 命令行工具镜像

编辑 `~/.android/repositories.cfg` 或使用国内镜像源。

## 相关资源

- Android 开发者官网：https://developer.android.com
- Flutter 官方文档：https://flutter.dev/docs
- VSCode Flutter 扩展：https://marketplace.visualstudio.com/items?itemName=Dart-Code.flutter

## 总结

**最简单的方法：**
1. 安装 Android Studio
2. 在 Android Studio 中安装 Android SDK
3. 配置环境变量 `ANDROID_HOME` 和 `PATH`
4. 在 VSCode 中安装 Flutter 扩展
5. 运行 `flutter doctor` 验证

完成以上步骤后，您就可以在 VSCode 中进行 Android/Flutter 开发了！

