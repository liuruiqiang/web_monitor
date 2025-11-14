#!/bin/bash
# 启动开发服务器的自定义脚本，使用8082端口避免冲突

echo "Starting Metro server on port 8082..."
export RCT_METRO_PORT=8082
npx react-native start --port 8082 --reset-cache