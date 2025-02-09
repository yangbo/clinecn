#!/bin/bash

# 设置错误时退出
set -e

# 清理函数
cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        echo "❌ 安装过程中出现错误，退出代码: $exit_code"
        # 清理临时文件和构建产物
        if [ -d "dist" ]; then
            rm -rf dist
        fi
        if [ -d "webview-ui/build" ]; then
            rm -rf webview-ui/build
        fi
    fi
    exit $exit_code
}

# 设置清理钩子
trap cleanup EXIT

# 检查 Node.js 和 npm
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到 npm，请确保 Node.js 安装正确"
    exit 1
fi

# 检查 Node.js 版本
NODE_VERSION=$(node -v | cut -d 'v' -f2)
NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d '.' -f1)
if [ $NODE_MAJOR_VERSION -lt 16 ]; then
    echo "❌ 错误: Node.js 版本过低，需要 v16 或更高版本"
    echo "当前版本: v$NODE_VERSION"
    exit 1
fi

# 检查并安装 vsce
if ! command -v vsce &> /dev/null; then
    echo "📦 安装 vsce..."
    npm install -g @vscode/vsce
    if [ $? -ne 0 ]; then
        echo "❌ vsce 安装失败"
        exit 1
    fi
    echo "✅ vsce 安装完成"
fi

# 检查并安装 VS Code CLI
if ! command -v code &> /dev/null; then
    echo "⚠️ 警告: 未找到 VS Code 命令行工具"
    echo "提示: 请在 VS Code 中按下 Command+Shift+P (macOS) 或 Ctrl+Shift+P (Windows/Linux)"
    echo "      输入 'code' 并选择 '安装 code 命令' 选项"
    echo "      安装完成后重新运行此脚本"
    echo "继续执行构建流程..."
else
    echo "🔍 检查是否存在旧版本扩展..."
    if code --list-extensions | grep -q "cline-chinese"; then
        echo "🗑️ 卸载旧版本扩展..."
        code --uninstall-extension cline-chinese
        if [ $? -ne 0 ]; then
            echo "❌ 卸载旧版本失败，请手动卸载后重试"
            exit 1
        fi
        echo "✅ 旧版本卸载完成"
    fi
fi

echo "🚀 开始构建和安装 Cline Chinese 扩展..."

# 清理旧的构建文件
if [ -f "*.vsix" ]; then
    rm *.vsix
fi

# 安装依赖
echo "📥 安装项目依赖..."
npm run install:all
if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

# 构建项目
echo "🛠️ 构建项目..."
npm run package
if [ $? -ne 0 ]; then
    echo "❌ 项目构建失败"
    exit 1
fi
vsce package
# 获取 package.json 中的版本号
VERSION=$(node -p "require('./package.json').version")
VSIX_FILE="cline-chinese-${VERSION}.vsix"

# 检查 .vsix 文件是否生成成功
if [ ! -f "$VSIX_FILE" ]; then
    echo "❌ 错误: VSIX 文件生成失败"
    exit 1
fi

echo "✅ 构建完成！VSIX 文件已生成: $VSIX_FILE"

# 检查是否可以安装扩展
if command -v code &> /dev/null; then
    echo "📦 正在安装扩展..."
    code --install-extension "$VSIX_FILE"
    if [ $? -ne 0 ]; then
        echo "❌ 扩展安装失败"
        exit 1
    fi
    echo "🎉 安装完成！请重启 VS Code 以激活扩展。"
else
    echo "⚠️ 由于未安装 VS Code 命令行工具，请手动安装扩展："
    echo "   1. 打开 VS Code"
    echo "   2. 按下 Command+Shift+P (macOS) 或 Ctrl+Shift+P (Windows/Linux)"
    echo "   3. 输入 'Install from VSIX'"
    echo "   4. 选择文件: $VSIX_FILE"
fi