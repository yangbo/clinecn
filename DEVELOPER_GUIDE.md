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

执行脚本 `npm run package` 打包本扩展。


## 调试 webview 内容的方法

目前只能 F5 调试插件，然后在其中查看 webview 的内容。

当前在根目录下执行 `npm run start:webview`，启动 react app依然会失败，报告：

```
ERROR in ./src/utils/validate.ts 3:0-67
Module not found: Error: You attempted to import ../../../src/shared/api which falls outside of the project src/ directory. Relative imports outside of src/ are not supported.
You can either move it inside src/, or add a symlink to it from project's node_modules/.
```

还没有找到解决方法。

