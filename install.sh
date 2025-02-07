#!/bin/bash

echo "🚀 开始构建和安装 Cline Chinese 扩展..."

# 检查是否安装了必要的工具
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到 npm，请先安装 Node.js"
    exit 1
fi

if ! command -v vsce &> /dev/null; then
    echo "📦 安装 vsce..."
    npm install -g @vscode/vsce
fi

# 安装依赖
echo "📥 安装项目依赖..."
npm run install:all

# 构建项目
echo "🛠️ 构建项目..."
npm run package

# 获取 package.json 中的版本号
VERSION=$(node -p "require('./package.json').version")
VSIX_FILE="cline-chinese-${VERSION}.vsix"

# 检查 .vsix 文件是否生成成功
if [ ! -f "$VSIX_FILE" ]; then
    echo "❌ 错误: VSIX 文件生成失败"
    exit 1
fi

echo "✅ 构建完成！VSIX 文件已生成: $VSIX_FILE"

# 安装扩展
echo "📦 正在安装扩展..."
code --install-extension "$VSIX_FILE"

echo "🎉 安装完成！请重启 VS Code 以激活扩展。" 