# 开发者手册

本文档将介绍开发本扩展的相关方法，包括环境准备、编译、调试和打包等任务。

## 环境准备

执行脚本 `npm run install:all` 安装依赖包。

执行脚本 `npm run compile` 编译本扩展。

执行脚本 `npm run build:webview` 生成 webview 内容。

到这里就可以 debug 扩展了。

## Debug 扩展

要debug本扩展，需要创建 .vscode/launch.json 文件，内容如下：

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "运行扩展",
            "type": "extensionHost",
            "request": "launch",
            "args": [
                "--extensionDevelopmentPath=${workspaceFolder}"
            ],
            "outFiles": [
                "${workspaceFolder}/dist/**/*.js"
            ],
            "preLaunchTask": "npm: compile"
        },
        {
            "name": "扩展测试",
            "type": "extensionHost",
            "request": "launch",
            "args": [
                "--extensionDevelopmentPath=${workspaceFolder}",
                "--extensionTestsPath=${workspaceFolder}/out/test/suite/index"
            ],
            "outFiles": [
                "${workspaceFolder}/out/test/**/*.js"
            ],
            "preLaunchTask": "npm: compile"
        }
    ]
}
```

然后选择`运行扩展`，或按 F5 开始调试本扩展。

## 打包

执行脚本 `vsce package` 打包本扩展。


## 调试 webview 内容的方法

在终端中执行脚本 `npm run watch` 会自动构建 webview-ui/ 目录，并且监视其中的 *.tsx 文件，一旦有修改会触发自动编译命令，这样就可以在 vscode 中生效了，但需要在 vscode 扩展调试窗口中按 Control+R 刷新一下。

还需要进一步研究如何更方便地热重载 *.tsx 文件而不重新编译。

## 编辑图标

使用 [boxy svg](https://boxy-svg.com/) 软件编辑图标。
