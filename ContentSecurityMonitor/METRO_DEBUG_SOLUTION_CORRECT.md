# Metro Bundler Debugging Solution - CORRECTED VERSION

## Issue
"unable to load script, make sure you are either running metro (run npx react-native start) or that your bundle 'index.android.bundle' is packaged correctly for release"

## Root Cause Analysis
The error occurs when the React Native app cannot connect to the Metro development server. Common causes include:
1. Port conflicts with other applications (McAfee, AliLang, etc.)
2. Incorrect port forwarding setup
3. Cache issues with Metro bundler
4. ADB path issues

## Solution Steps

### 1. Identify Port Conflicts
First, check what processes are using common Metro ports:
```bash
# Check ports 8081 and 8088
lsof -t -i :8081
lsof -t -i :8088
```

### 2. Kill Conflicting Processes
If other applications are using these ports, kill them:
```bash
# Kill process using port 8081 (example)
kill -9 [process_id_from_lsof]

# Kill process using port 8088 (example)
kill -9 [process_id_from_lsof]
```

### 3. Start Metro on a Clean Port
Use port 8082 which is less likely to be occupied:
```bash
npx react-native start --port 8082 --reset-cache &
```

### 4. Verify Emulator is Running
```bash
/Users/liuruiqiang/Library/Android/sdk/platform-tools/adb devices
```

If no devices are listed:
```bash
# Start emulator
/Users/liuruiqiang/Library/Android/sdk/emulator/emulator -avd Medium_Phone_API_36.1 &
```

Wait for emulator to start, then check again:
```bash
sleep 10 && /Users/liuruiqiang/Library/Android/sdk/platform-tools/adb devices
```

### 5. Set Up Port Forwarding
```bash
/Users/liuruiqiang/Library/Android/sdk/platform-tools/adb reverse tcp:8082 tcp:8082
```

### 6. Install and Run the App
```bash
npx react-native run-android --port 8082
```

If you get an ADB error, launch manually:
```bash
/Users/liuruiqiang/Library/Android/sdk/platform-tools/adb shell am start -n com.contentsecuritymonitor/.MainActivity -a android.intent.action.MAIN -c android.intent.category.LAUNCHER
```

## Commands Used - WORKING SOLUTION

1. Kill existing Metro processes:
   ```bash
   pkill -f "react-native start"
   ```

2. Check for port conflicts:
   ```bash
   lsof -t -i :8081
   lsof -t -i :8088
   ```

3. Kill conflicting processes:
   ```bash
   kill -9 [process_id]
   ```

4. Start Metro server on clean port with cache reset:
   ```bash
   npx react-native start --port 8082 --reset-cache &
   ```

5. Check connected devices:
   ```bash
   /Users/liuruiqiang/Library/Android/sdk/platform-tools/adb devices
   ```

6. Set up port forwarding:
   ```bash
   /Users/liuruiqiang/Library/Android/sdk/platform-tools/adb reverse tcp:8082 tcp:8082
   ```

7. Install and run the app:
   ```bash
   npx react-native run-android --port 8082
   ```

8. If ADB command not found, use full path:
   ```bash
   /Users/liuruiqiang/Library/Android/sdk/platform-tools/adb shell am start -n com.contentsecuritymonitor/.MainActivity -a android.intent.action.MAIN -c android.intent.category.LAUNCHER
   ```

## Common Issues and Solutions

### Issue: "Address already in use" error
**Solution**: Use a different port (8082, 8083, etc.) that isn't occupied by other applications.

### Issue: "adb: no devices/emulators found"
**Solution**: 
1. Wait for emulator to fully start
2. Check with: `sleep 5 && /Users/liuruiqiang/Library/Android/sdk/platform-tools/adb devices`
3. Restart emulator if needed

### Issue: ADB command not found
**Solution**: Use full path to ADB:
```bash
/Users/liuruiqiang/Library/Android/sdk/platform-tools/adb
```

## Complete Working Project Startup Commands

1. Start Android emulator:
   ```bash
   /Users/liuruiqiang/Library/Android/sdk/emulator/emulator -avd Medium_Phone_API_36.1 &
   ```

2. Wait for emulator and start Metro server:
   ```bash
   sleep 10 && /Users/liuruiqiang/Library/Android/sdk/platform-tools/adb devices && npx react-native start --port 8082 --reset-cache &
   ```

3. Set up port forwarding:
   ```bash
   /Users/liuruiqiang/Library/Android/sdk/platform-tools/adb reverse tcp:8082 tcp:8082
   ```

4. Install and run the app:
   ```bash
   npx react-native run-android --port 8082
   ```

5. If ADB error, launch manually:
   ```bash
   /Users/liuruiqiang/Library/Android/sdk/platform-tools/adb shell am start -n com.contentsecuritymonitor/.MainActivity -a android.intent.action.MAIN -c android.intent.category.LAUNCHER
   ```

## Ports Used by Common Applications
- McAfee: 8081
- AliLang: 8081, 8088
- Recommended for React Native: 8082 or higher unused ports