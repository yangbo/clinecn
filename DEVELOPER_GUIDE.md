# 开发者手册

本文档将介绍开发本扩展的相关方法，包括环境准备、编译、调试和打包等任务。

## 环境准备

执行脚本 `npm run install:all` 安装依赖包。

执行脚本 `npm run compile` 编译本扩展。

## Debug 本扩展

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

执行脚本 `npm run package` 打包本扩展。
