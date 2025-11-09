# Flutter 网络连接问题解决方案

## 问题描述

`flutter doctor` 报错：
- 访问 `https://storage.googleapis.com/` 时出现加密错误
- 访问 `https://maven.google.com/` 时出现"信号灯超时时间已到"错误

## 解决方案

### 方案 1：配置 Flutter 中国镜像（推荐）

这是最简单有效的方法，适用于国内用户。

#### Windows 系统：

1. **打开环境变量设置**
   - 按 `Win + R`，输入 `sysdm.cpl`，回车
   - 点击"高级"标签 → "环境变量"
   - 在"用户变量"或"系统变量"中添加以下变量：

2. **添加环境变量**
   ```
   PUB_HOSTED_URL=https://pub.flutter-io.cn
   FLUTTER_STORAGE_BASE_URL=https://storage.flutter-io.cn
   ```

   或者使用其他镜像源：
   ```
   PUB_HOSTED_URL=https://pub.flutter-io.cn
   FLUTTER_STORAGE_BASE_URL=https://storage.flutter-io.cn
   ```

3. **使用 PowerShell 临时设置（每次重启需要重新设置）**
   ```powershell
   $env:PUB_HOSTED_URL="https://pub.flutter-io.cn"
   $env:FLUTTER_STORAGE_BASE_URL="https://storage.flutter-io.cn"
   ```

#### macOS/Linux 系统：

1. **编辑 shell 配置文件**
   - bash: `~/.bashrc` 或 `~/.bash_profile`
   - zsh: `~/.zshrc`

2. **添加以下内容**
   ```bash
   export PUB_HOSTED_URL=https://pub.flutter-io.cn
   export FLUTTER_STORAGE_BASE_URL=https://storage.flutter-io.cn
   ```

3. **使配置生效**
   ```bash
   source ~/.bashrc  # 或 source ~/.zshrc
   ```

### 方案 2：配置 Android Gradle 镜像

解决 Maven 仓库访问问题：

1. **找到 `android/build.gradle` 文件**
   - 位置：`<项目目录>/android/build.gradle`

2. **修改 repositories 配置**
   ```gradle
   buildscript {
       repositories {
           // 添加阿里云镜像
           maven { url 'https://maven.aliyun.com/repository/google' }
           maven { url 'https://maven.aliyun.com/repository/jcenter' }
           maven { url 'https://maven.aliyun.com/repository/public' }
           // 保留原有的，作为备用
           google()
           jcenter()
       }
   }
   
   allprojects {
       repositories {
           // 添加阿里云镜像
           maven { url 'https://maven.aliyun.com/repository/google' }
           maven { url 'https://maven.aliyun.com/repository/jcenter' }
           maven { url 'https://maven.aliyun.com/repository/public' }
           // 保留原有的，作为备用
           google()
           jcenter()
       }
   }
   ```

3. **修改 `android/gradle.properties`**
   添加或修改：
   ```properties
   # 使用国内镜像
   android.useAndroidX=true
   android.enableJetifier=true
   ```

### 方案 3：使用代理/VPN

如果您有可用的代理或 VPN：

1. **设置系统代理**
   - Windows: 设置 → 网络和 Internet → 代理
   - macOS: 系统偏好设置 → 网络 → 高级 → 代理

2. **配置 Flutter 使用代理**
   设置环境变量：
   ```bash
   HTTP_PROXY=http://127.0.0.1:1080
   HTTPS_PROXY=http://127.0.0.1:1080
   ```
   （将端口改为您的代理端口）

### 方案 4：检查防火墙和杀毒软件

1. **临时关闭防火墙/杀毒软件**测试是否解决问题
2. **添加 Flutter 到白名单**
   - 将 Flutter SDK 目录添加到杀毒软件白名单
   - 允许 Flutter 相关程序访问网络

### 方案 5：清除 Flutter 缓存

如果配置镜像后仍有问题，尝试清除缓存：

```bash
flutter clean
flutter pub cache repair
```

### 方案 6：手动下载依赖（最后手段）

如果以上方法都不行，可以尝试：

1. **手动下载 Flutter SDK**
   - 从镜像站下载：https://flutter.cn/docs/get-started/install

2. **使用国内 Git 镜像**
   ```bash
   git config --global url."https://github.com.cnpmjs.org/".insteadOf "https://github.com/"
   ```

## 验证配置

配置完成后，运行以下命令验证：

```bash
flutter doctor -v
```

如果看到网络相关的错误消失，说明配置成功。

## 常用镜像源

### Flutter 官方镜像（国内）
- PUB: `https://pub.flutter-io.cn`
- Storage: `https://storage.flutter-io.cn`

### 其他可用镜像
- 清华大学镜像：`https://mirrors.tuna.tsinghua.edu.cn/flutter`
- 上海交大镜像：`https://mirror.sjtu.edu.cn/flutter`

## 注意事项

1. **环境变量设置后需要重启终端**
2. **如果是系统变量，可能需要重启电脑**
3. **确保镜像源可用**（某些镜像可能不稳定）
4. **Gradle 配置修改后需要重新构建项目**

## 快速检查清单

- [ ] 已设置 `PUB_HOSTED_URL` 环境变量
- [ ] 已设置 `FLUTTER_STORAGE_BASE_URL` 环境变量
- [ ] 已配置 Android Gradle 镜像
- [ ] 已重启终端或重新加载环境变量
- [ ] 已运行 `flutter doctor` 验证

## 如果问题仍然存在

1. 检查网络连接是否正常
2. 尝试使用手机热点（排除网络环境问题）
3. 检查系统时间是否正确
4. 查看 Flutter 官方文档：https://flutter.cn/docs/get-started/install
5. 在 Flutter 社区寻求帮助：https://flutter.cn/community

