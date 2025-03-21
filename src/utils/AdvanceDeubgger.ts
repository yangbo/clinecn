import * as vscode from 'vscode';

/**
 * 高级调试工具类，用于实现“高级调试”功能。
 * 我们称这个技术为“高级vscode扩展开发技术”，
 * 简称 **“高级扩展DEBUG技术（ADET，Advanced Debug Extension Technology）”**，可以读作 [Adit]。
 */
export class AdvanceDebugger {

    /**
     * 初始化 webview-ui-toolkit 调试工具，实现“高级调试”功能
     */
    static initWebview(webview: vscode.Webview) {
        // 打包时会将 IS_DEV = true 替换为 IS_DEV = false
        const IS_DEV = true;
        if (IS_DEV) {
            // 侦听 theme 变化，通知 webview
            vscode.window.onDidChangeActiveColorTheme(theme => {
                let kind;
                if (theme.kind === vscode.ColorThemeKind.Dark) {
                    console.log('切换到深色主题');
                    kind = 'dark';
                } else if (theme.kind === vscode.ColorThemeKind.Light) {
                    console.log('切换到浅色主题');
                    kind = 'light';
                } else {
                    console.log('切换到未知主题');
                    kind = 'unknown';
                }
                webview.postMessage({ type: 'toggle-theme', theme: kind });
            });
        }
    }

    /**
     * 返回用于调试的 webview html 内容
     * @param url 调试的 url 地址，通常就是 vite server 地址，例如 http://localhost:3000
     */
    static getDebugHtml(url: string) {
        // 用 iframe 方法访问
        return /*html*/`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Debug 模式的 Webview 主页面</title>
            <meta charset="utf-8">
            <meta name="viewport" content="height=device-height,width=device-width,initial-scale=1,shrink-to-fit=no">
            <meta name="theme-color" content="#000000">
            <style>
            html, body {
                height: 100%; /* 确保父容器占据整个视口高度 */
                margin: 0;
                padding: 0;
                border: none;
                overflow-y: hidden; /* 隐藏容器的滚动条 */
            }
            iframe {
                width: 100%;
                height: 100%;
                border: none; /* 移除 iframe 边框 */
            }
            </style>
        </head>
        <body>
            <iframe id="myIframe" src="${url}" width="100%" height="100%" scrolling="no" 
            sandbox="allow-modals allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-orientation-lock allow-presentation allow-pointer-lock allow-same-origin allow-storage-access-by-user-activation allow-top-navigation allow-top-navigation-by-user-activation"
            allow="cross-origin-isolated; autoplay; clipboard-read; clipboard-write;"></iframe> 
            <script>
            // 创建 main frame 和 iframe 之间的 Message Channel，用来实现 WebView.postMessage()、getState()和setState() 函数代理
            let channelPostMessage;
            let channelSetState;
            let channelGetState;
        
            /**
                * 创建 main frame 和 iframe 之间的 Message Channel，
                * 实现 WebView.postMessage() 函数代理。
                * 要在 iframe 装载(onload)之后调用才行。
                */
            function proxyVscode(iframe, vscode){
                console.log("[main frame] 执行 proxyVscode()");
                channelPostMessage = new MessageChannel();
                channelSetState = new MessageChannel();
                channelGetState = new MessageChannel();

                // 代理 vscode.postMesssage() 函数
                console.log("[main frame] 创建消息通道，实现 postMessage 函数代理");
                iframe.contentWindow.postMessage({
                    command: 'createChannel',
                    api: "postMessage"
                }, '*', [channelPostMessage.port2]);
                // 侦听通道收到的消息
                channelPostMessage.port1.onmessage = function(event) {
                    console.log("[main frame] 收到 iframe postMessage 消息: ");
                    console.log(event.data);
                    vscode.postMessage(event.data);
                };
        
                // 代理 vscode.getState() 函数
                console.log("[main frame] 创建消息通道，实现 getState 函数代理");
                iframe.contentWindow.postMessage({
                    command: 'createChannel',
                    api: "getState"
                }, '*', [channelGetState.port2]);
                // 侦听通道收到的消息
                channelGetState.port1.onmessage = function(event) {
                    console.log("[main frame] 收到 iframe getState 消息: ");
                    console.log(event.data);
                    const state = vscode.getState();
                    // 发送 getState() 结果到 iframe
                    channelGetState.port1.postMessage(state);
                }
        
                // 代理 vscode.setState() 函数
                console.log("[main frame] 创建消息通道，实现 setState 函数代理");
                iframe.contentWindow.postMessage({
                    command: 'createChannel',
                    api: "setState"
                }, '*', [channelSetState.port2]);
                // 侦听通道收到的消息
                channelSetState.port1.onmessage = function(event) {
                    console.log("[main frame] 收到 iframe setState 消息: ");
                    console.log(event.data);
                    const state = vscode.setState(event.data);
                }
            }
        
            // 还没有获取过 vscode api，需要获取
            if (!window.vsCodeApi){
                window.vsCodeApi = acquireVsCodeApi();
                console.log("[main frame] 获取到 window.vsCodeApi: ");
                console.log(window.vsCodeApi);
            } else {
                // 已经获取过 vscode api，不需要再获取
                console.log("[main frame] window.vsCodeApi 已经存在，不需要重新获取:");
                console.log(window.vsCodeApi);
            }
            const iframe = document.getElementById('myIframe');
        
            // 传递 vscode 的 css 样式, 它是 <html> 元素上的 style 属性
            function sendVscodeCssVariablesToIframe() {
                console.log("[main frame] 发送 html.style 属性(即vscode css 变量) 和 body.style 到 iframe");
                // 获取 <html> 元素的 style 属性，其中有 --vscode-* CSS变量
                const htmlElement = document.documentElement;
                const inlineStyle = htmlElement.getAttribute("style") || "";
                // 获取 body 元素的属性，因为 webview-ui-toolkit 是靠侦听 body 属性的变化来修改主题颜色的
                const bodyElement = document.body;
                const bodyAttributes = {};
                const attributes = bodyElement.attributes;
                console.log("[main frame] body 元素的属性: ", attributes);
                for (let i = 0; i < attributes.length; i++) {
                    const attr = attributes[i];
                    console.log("[main frame] body attribute > ", attr);
                    bodyAttributes[attr.name] = attr.value;
                }
                const bodyInlineStyle = bodyElement.getAttribute("style") || "";
                iframe.contentWindow.postMessage({ type: 'vscodeInlineStyles', styles: inlineStyle, bodyAttributes: bodyAttributes }, '*');
            }
            iframe.removeEventListener('load', sendVscodeCssVariablesToIframe);		// 支持重新执行
            iframe.addEventListener('load', sendVscodeCssVariablesToIframe);

            // 复制动态添加的扩展样式到 iframe 去，它是 <style id='_defaultStyles'> 元素的内容
            const copyDefaultStyles = () => {
                console.log("[main frame] 复制 vscode extension 样式表到 iframe 去");
                const styleElement = document.getElementById('_defaultStyles');
                const styleContent = styleElement.textContent;
                // console.log(styleContent);
                // 这里不能直接设置，要通过 postMessage 方式设置，在 webview-ui/vscode.ts 中响应
                iframe.contentWindow.postMessage({ type: 'vscodeSetDefaultStyles', styles: styleContent }, '*');
            };
            iframe.removeEventListener('load', copyDefaultStyles);		// 支持重新执行
            iframe.addEventListener('load', copyDefaultStyles);

            // 将收到的 message 传递给 iframe,或者拦截并处理
            const onMessage = event => {
                // 拦截 iframe 发送的 'iframe-loaded' 消息
                if (event.data === 'iframe-loaded') {
                    console.log("[main frame] iframe 加载完成，开始初始化 proxy 工作");
                    if (window.vsCodeApi) {
                        // 准备接收 iframe 的 vscode api 消息
                        proxyVscode(iframe, window.vsCodeApi);
                    }
                } else if (event.data.type === 'toggle-theme') {
                    console.log("切换主题到: ", event.data.theme);
                    // 当 debug 过程中切换主题颜色时，扩展会发送 'toggle-theme' 消息，webview html 页面需要接收并处理
                    sendVscodeCssVariablesToIframe();
                    copyDefaultStyles();
                    // 继续转给 iframe
                    iframe.contentWindow.postMessage(event.data, '*');
                } else {
                    console.log("[main frame] 将收到的 message 传递给 iframe：");
                    console.log(event);
                    iframe.contentWindow.postMessage(event.data, '*');
                }
            };
            window.removeEventListener('message', onMessage);		// 支持重新执行
            window.addEventListener('message', onMessage);

            </script>
        </body>
        </html>
        `;
    }
}