# Changelog

## [3.3.3]

- 将 Cline 中的 command、menu、view 等组件的id都从 'cline' 改为了 'clinecn'，避免同时安装 clinecn 和 cline 扩展时的冲突问题。

- 支持阿里千问大语言模型的中国和国际线路。国内用户现在可以使用‘中国’线路了。

- 将 vscode workspace 的 section 从 'cline' 改为 'clinecn'，避免和 cline 扩展冲突。

- 将扩展的 output 面板名改为 'ClineCN'，并将常见的输出日志改为中文。

- 给‘自动批准的设置框’添加了关闭按钮，方便用户关闭设置界面。

- 给‘模型选择弹出框’添加关了闭按钮，方便用户关闭设置界面。

## [3.3.2]
    合入cline 3.30-3.3.2版本修改，并进行汉化。
    修复了一些汉化问题
    
    cline更新内容：
    ## [3.3.2]
    -   修复 OpenRouter 请求偶尔不返回成本/令牌统计信息的问题，这会导致上下文窗口限制错误
    -   使检查点更加可见并跟踪已恢复的检查点

    ## [3.3.0]

    -   添加 .clineignore 功能以阻止 Cline 访问指定的文件模式
    -   为计划/执行切换添加键盘快捷键和工具提示
    -   修复新文件不会在文件下拉列表中显示的问题
    -   为限速请求添加自动重试功能（感谢 @ViezeVingertjes！）
    -   在高级设置中添加 o3-mini 的推理努力度支持
    -   添加使用 AWS CLI 创建配置文件的 AWS 提供商配置文件支持，实现与 AWS bedrock 的长期连接
    -   添加 Requesty API 提供商
    -   添加 Together API 提供商
    -   添加阿里巴巴 Qwen API 提供商（感谢 @aicccode！）

## [3.2.13]

- 基于cline 3.2.13 初始化项目
- 汉化 Cline 的 UI 界面
- 汉化 Cline 的 提示词
- 汉化 Cline 的 快捷键
- 汉化 Cline 的 设置
- 汉化 Cline 的 命令
- 汉化 Cline 的 配置
- 汉化 Cline 的 日志
