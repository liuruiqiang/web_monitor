# Metro Bundler Debugging Solution

## Issue
"unable to load script, make sure you are either running metro (run npx react-native start) or that your bundle 'index.android.bundle' is packaged correctly for release"

## Solution Steps

1. Check if Metro server is running
2. Start Metro server in background with correct port configuration
3. Set up port forwarding for Android emulator
4. Verify app loads correctly

## Commands Used

1. Check running processes:
   ```bash
   ps aux | grep metro
   ```

2. Start Metro server in background:
   ```bash
   npx react-native start --port 8088 &
   ```

3. Set up port forwarding:
   ```bash
   adb reverse tcp:8088 tcp:8088
   ```
如果报错Error: adb: no devices/emulators found,那么就需执行：
sleep 5 &&/Users/liuruiqiang/Library/Android/sdk/platform-tools/adb    devices                                                        │
来Check connected Android devices/emulators after delay
然后执行:
/Users/liuruiqiang/Library/Android/sdk/emulator/emulator
       -list-avds
找到可用的模拟器,之后运行/Users/liuruiqiang/Library/Android/sdk/emulator/emulator
       -avd Medium_Phone_API_36.1 &
来启动模拟器

## Additional Debugging Commands

1. Check connected devices:
   ```bash
   /Users/liuruiqiang/Library/Android/sdk/platform-tools/adb devices
   ```

2. Kill existing packager:
   ```bash
   npx react-native start --reset-cache
   ```

3. If adb command not found, use full path:
   ```bash
   /Users/liuruiqiang/Library/Android/sdk/platform-tools/adb shell am start -n com.contentsecuritymonitor/.MainActivity -a android.intent.action.MAIN -c android.intent.category.LAUNCHER
   ```

## Complete Project Startup Commands

1. Start Android emulator:
   ```bash
   /Users/liuruiqiang/Library/Android/sdk/emulator/emulator -avd Medium_Phone_API_36.1 &
   ```

2. Start Metro server:
   ```bash
   npx react-native start --port 8088 --reset-cache &
   ```

3. Wait for emulator to be ready and set up port forwarding:
   ```bash
   # Check if emulator is ready
   /Users/liuruiqiang/Library/Android/sdk/platform-tools/adb devices
   
   # Set up port forwarding
   /Users/liuruiqiang/Library/Android/sdk/platform-tools/adb reverse tcp:8088 tcp:8088
   ```

4. Install and run the app:
   ```bash
   # If adb is in PATH:
   npx react-native run-android --port 8088
   
   # If adb is not in PATH, after the app is installed:
   /Users/liuruiqiang/Library/Android/sdk/platform-tools/adb shell am start -n com.contentsecuritymonitor/.MainActivity -a android.intent.action.MAIN -c android.intent.category.LAUNCHER
   ```