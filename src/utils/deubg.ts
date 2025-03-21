import * as vscode from 'vscode';

export class Debugger {

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
}