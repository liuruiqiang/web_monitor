# Flutter Gradle 与 Java 版本兼容性问题解决方案

## 问题描述

运行 Flutter 项目时出现错误：
```
Your project's Gradle version is incompatible with the Java version that Flutter is using for Gradle.

To fix this issue, first, check the Java version used by Flutter by running `flutter doctor --verbose`.

Then, update the Gradle version specified in 
D:\dev_projects\mobile_flutter\android\gradle\wrapper\gradle-wrapper.properties to be compatible with that Java version.
```

## 解决步骤

### 步骤 1：检查 Java 版本

运行以下命令查看 Flutter 使用的 Java 版本：

```bash
flutter doctor --verbose
```

查找类似这样的输出：
```
[✓] Android toolchain - develop for Android devices (Android SDK version ...)
    • Java binary at: C:\Program Files\Java\jdk-17\bin\java
    • Java version: Java(TM) SE Runtime Environment (build 17.0.x)
```

或者直接检查 Java 版本：

```bash
java -version
```

### 步骤 2：查看当前的 Gradle 版本

打开文件：
```
android/gradle/wrapper/gradle-wrapper.properties
```

查看 `distributionUrl` 中的版本号，例如：
```properties
distributionUrl=https\://services.gradle.org/distributions/gradle-7.5-all.zip
```
这里的 `7.5` 就是当前的 Gradle 版本。

### 步骤 3：根据 Java 版本选择合适的 Gradle 版本

#### Java 与 Gradle 兼容性对照表

| Java 版本 | 最低 Gradle 版本 | 推荐 Gradle 版本 | 最高 Gradle 版本 |
|-----------|-----------------|-----------------|-----------------|
| Java 8    | 2.0             | 6.9 - 7.5       | 7.6             |
| Java 11   | 5.0             | 7.3 - 7.6       | 8.4             |
| Java 17   | 7.3             | 7.6 - 8.3       | 8.5+            |
| Java 19   | 7.6             | 8.0 - 8.3       | 8.5+            |
| Java 20   | 8.1             | 8.3 - 8.5       | 8.5+            |
| Java 21   | 8.5             | 8.5+            | 最新            |

#### Flutter 推荐配置

- **Java 11 + Gradle 7.5**（稳定推荐）
- **Java 17 + Gradle 7.6 或 8.0+**（现代推荐）

### 步骤 4：更新 Gradle 版本

#### 方法 1：直接修改 gradle-wrapper.properties（推荐）

编辑文件：`android/gradle/wrapper/gradle-wrapper.properties`

**示例：使用 Gradle 7.6（兼容 Java 17）**
```properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-7.6-all.zip
```

**示例：使用 Gradle 8.0（兼容 Java 17/19）**
```properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.0-all.zip
```

**示例：使用 Gradle 8.3（兼容 Java 17/19/20）**
```properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.3-all.zip
```

#### 方法 2：使用命令行更新

```bash
cd android
./gradlew wrapper --gradle-version 7.6
```

Windows PowerShell:
```powershell
cd android
.\gradlew wrapper --gradle-version 7.6
```

### 步骤 5：更新 Android Gradle Plugin 版本（如需要）

如果更新了 Gradle 版本，可能还需要更新 Android Gradle Plugin 版本。

编辑文件：`android/build.gradle`

查找 `dependencies` 块中的 `com.android.tools.build:gradle`：

```gradle
buildscript {
    repositories {
        google()
        mavenCentral()
    }

    dependencies {
        classpath 'com.android.tools.build:gradle:7.4.2'  // 更新这个版本
    }
}
```

#### Android Gradle Plugin 与 Gradle 版本对应关系

| Android Gradle Plugin | Gradle 版本要求 |
|----------------------|----------------|
| 7.0.x                | 7.0+           |
| 7.1.x                | 7.2+           |
| 7.2.x                | 7.3.3+         |
| 7.3.x                | 7.4+           |
| 7.4.x                | 7.5+           |
| 8.0.x                | 8.0+           |
| 8.1.x                | 8.0+           |
| 8.2.x                | 8.2+           |
| 8.3.x                | 8.4+           |

**推荐配置：**
- Gradle 7.6 + Android Gradle Plugin 7.4.2
- Gradle 8.0 + Android Gradle Plugin 8.0.2
- Gradle 8.3 + Android Gradle Plugin 8.2.0

### 步骤 6：清理并重新构建

```bash
# 清理 Flutter 项目
flutter clean

# 进入 Android 目录清理 Gradle 缓存
cd android
./gradlew clean

# 返回项目根目录
cd ..

# 重新获取依赖
flutter pub get

# 重新运行项目
flutter run
```

Windows PowerShell:
```powershell
flutter clean
cd android
.\gradlew clean
cd ..
flutter pub get
flutter run
```

## 完整解决方案示例

### 场景 1：Java 17 + Gradle 7.6

**1. 修改 `android/gradle/wrapper/gradle-wrapper.properties`：**
```properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-7.6-all.zip
```

**2. 修改 `android/build.gradle`：**
```gradle
buildscript {
    ext.kotlin_version = '1.7.10'
    repositories {
        google()
        mavenCentral()
    }

    dependencies {
        classpath 'com.android.tools.build:gradle:7.4.2'
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version"
    }
}
```

### 场景 2：Java 17 + Gradle 8.0

**1. 修改 `android/gradle/wrapper/gradle-wrapper.properties`：**
```properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.0-all.zip
```

**2. 修改 `android/build.gradle`：**
```gradle
buildscript {
    ext.kotlin_version = '1.8.0'
    repositories {
        google()
        mavenCentral()
    }

    dependencies {
        classpath 'com.android.tools.build:gradle:8.0.2'
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version"
    }
}
```

**3. 修改 `android/gradle.properties`（如果存在）：**
```properties
android.useAndroidX=true
android.enableJetifier=true
# 添加以下配置以支持 Gradle 8.0
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.defaults.buildfeatures.buildconfig=true
android.nonTransitiveRClass=false
android.nonFinalResIds=false
```

## 常见问题

### 问题 1：Gradle 下载缓慢

**解决方案：配置国内镜像**

编辑 `android/build.gradle`：
```gradle
buildscript {
    repositories {
        // 添加阿里云镜像
        maven { url 'https://maven.aliyun.com/repository/google' }
        maven { url 'https://maven.aliyun.com/repository/jcenter' }
        maven { url 'https://maven.aliyun.com/repository/public' }
        google()
        mavenCentral()
    }
}

allprojects {
    repositories {
        // 添加阿里云镜像
        maven { url 'https://maven.aliyun.com/repository/google' }
        maven { url 'https://maven.aliyun.com/repository/jcenter' }
        maven { url 'https://maven.aliyun.com/repository/public' }
        google()
        mavenCentral()
    }
}
```

### 问题 2：仍然报版本不兼容错误

**解决方案：**
1. 确认 Java 版本：
   ```bash
   java -version
   flutter doctor -v
   ```

2. 检查 Gradle 使用的 Java 版本：
   ```bash
   cd android
   ./gradlew --version
   ```
   查看输出中的 "JVM" 信息

3. 如果 Gradle 使用了错误的 Java 版本，设置 `JAVA_HOME`：
   ```bash
   # Windows PowerShell
   $env:JAVA_HOME="C:\Program Files\Java\jdk-17"
   
   # 或设置系统环境变量
   # JAVA_HOME = C:\Program Files\Java\jdk-17
   ```

### 问题 3：构建失败，提示需要更新的 Android Gradle Plugin

**解决方案：**
更新 `android/build.gradle` 中的 Android Gradle Plugin 版本到与 Gradle 兼容的版本。

### 问题 4：Kotlin 版本不兼容

**解决方案：**
更新 `android/build.gradle` 中的 Kotlin 版本：
```gradle
ext.kotlin_version = '1.8.0'  // 或更新到最新稳定版
```

## 快速检查清单

- [ ] 运行 `flutter doctor -v` 查看 Java 版本
- [ ] 检查 `gradle-wrapper.properties` 中的 Gradle 版本
- [ ] 根据 Java 版本更新 Gradle 版本
- [ ] 更新 Android Gradle Plugin 版本（如需要）
- [ ] 更新 Kotlin 版本（如需要）
- [ ] 运行 `flutter clean`
- [ ] 运行 `flutter pub get`
- [ ] 重新构建项目

## 推荐配置（2024年）

### 稳定配置（推荐）
- **Java**: 17
- **Gradle**: 7.6
- **Android Gradle Plugin**: 7.4.2
- **Kotlin**: 1.8.0

### 最新配置
- **Java**: 17 或 21
- **Gradle**: 8.3
- **Android Gradle Plugin**: 8.2.0
- **Kotlin**: 1.9.0

## 参考资源

- Gradle 官方兼容性文档：https://docs.gradle.org/current/userguide/compatibility.html#java
- Android Gradle Plugin 发布说明：https://developer.android.com/studio/releases/gradle-plugin
- Flutter 官方文档：https://flutter.dev/docs/deployment/android

## 总结

解决 Gradle 与 Java 版本不兼容问题的关键步骤：

1. ✅ 检查 Java 版本（`flutter doctor -v`）
2. ✅ 查看当前 Gradle 版本（`gradle-wrapper.properties`）
3. ✅ 根据兼容性表选择正确的 Gradle 版本
4. ✅ 更新 `gradle-wrapper.properties`
5. ✅ 更新 Android Gradle Plugin（如需要）
6. ✅ 清理并重新构建项目

完成这些步骤后，项目应该可以正常构建和运行了！

