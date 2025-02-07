// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import delay from "delay"
import * as vscode from "vscode"
import { ClineProvider } from "./core/webview/ClineProvider"
import { Logger } from "./services/logging/Logger"
import { createClineAPI } from "./exports"
import "./utils/path" // necessary to have access to String.prototype.toPosix
import { DIFF_VIEW_URI_SCHEME } from "./integrations/editor/DiffViewProvider"

/*
使用 https://github.com/microsoft/vscode-webview-ui-toolkit 构建

参考
https://github.com/microsoft/vscode-webview-ui-toolkit-samples/tree/main/default/weather-webview
https://github.com/microsoft/vscode-webview-ui-toolkit-samples/tree/main/frameworks/hello-world-react-cra
*/

let outputChannel: vscode.OutputChannel

// 当扩展第一次被激活时调用此方法
export function activate(context: vscode.ExtensionContext) {
	outputChannel = vscode.window.createOutputChannel("Cline")
	context.subscriptions.push(outputChannel)

	Logger.initialize(outputChannel)
	Logger.log("Cline 扩展已激活")

	const sidebarProvider = new ClineProvider(context, outputChannel)

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(ClineProvider.sideBarId, sidebarProvider, {
			webviewOptions: { retainContextWhenHidden: true },
		}),
	)

	context.subscriptions.push(
		vscode.commands.registerCommand("cline.plusButtonClicked", async () => {
			Logger.log("点击了加号按钮")
			await sidebarProvider.clearTask()
			await sidebarProvider.postStateToWebview()
			await sidebarProvider.postMessageToWebview({
				type: "action",
				action: "chatButtonClicked",
			})
		}),
	)

	context.subscriptions.push(
		vscode.commands.registerCommand("cline.mcpButtonClicked", () => {
			sidebarProvider.postMessageToWebview({
				type: "action",
				action: "mcpButtonClicked",
			})
		}),
	)

	const openClineInNewTab = async () => {
		Logger.log("在新标签页中打开 Cline")
		const tabProvider = new ClineProvider(context, outputChannel)
		const lastCol = Math.max(...vscode.window.visibleTextEditors.map((editor) => editor.viewColumn || 0))

		// 检查是否有可见的文本编辑器，否则在右侧打开新组
		const hasVisibleEditors = vscode.window.visibleTextEditors.length > 0
		if (!hasVisibleEditors) {
			await vscode.commands.executeCommand("workbench.action.newGroupRight")
		}
		const targetCol = hasVisibleEditors ? Math.max(lastCol + 1, 1) : vscode.ViewColumn.Two

		const panel = vscode.window.createWebviewPanel(ClineProvider.tabPanelId, "Cline", targetCol, {
			enableScripts: true,
			retainContextWhenHidden: true,
			localResourceRoots: [context.extensionUri],
		})
		// TODO: 使用更好的带有明暗变体的 svg 图标（参见 https://stackoverflow.com/questions/58365687/vscode-extension-iconpath）

		panel.iconPath = {
			light: vscode.Uri.joinPath(context.extensionUri, "assets", "icons", "robot_panel_light.png"),
			dark: vscode.Uri.joinPath(context.extensionUri, "assets", "icons", "robot_panel_dark.png"),
		}
		tabProvider.resolveWebviewView(panel)

		// 锁定编辑器组，这样点击文件时不会覆盖面板
		await delay(100)
		await vscode.commands.executeCommand("workbench.action.lockEditorGroup")
	}

	context.subscriptions.push(vscode.commands.registerCommand("cline.popoutButtonClicked", openClineInNewTab))
	context.subscriptions.push(vscode.commands.registerCommand("cline.openInNewTab", openClineInNewTab))

	context.subscriptions.push(
		vscode.commands.registerCommand("cline.settingsButtonClicked", () => {
			sidebarProvider.postMessageToWebview({
				type: "action",
				action: "settingsButtonClicked",
			})
		}),
	)

	context.subscriptions.push(
		vscode.commands.registerCommand("cline.historyButtonClicked", () => {
			sidebarProvider.postMessageToWebview({
				type: "action",
				action: "historyButtonClicked",
			})
		}),
	)

	context.subscriptions.push(
		vscode.commands.registerCommand("cline.accountLoginClicked", () => {
			sidebarProvider.postMessageToWebview({
				type: "action",
				action: "accountLoginClicked",
			})
		}),
	)

	/*
	我们使用文本文档内容提供程序 API 通过为原始内容创建虚拟文档来显示差异视图的左侧。
	这使其成为只读的，因此用户知道如果要保留更改，需要编辑右侧。

	- 此 API 允许您从任意源在 VSCode 中创建只读文档，它通过声明一个 uri-scheme 来工作，
	  提供程序随后会为该 scheme 返回文本内容。在注册提供程序时必须提供该 scheme，之后不能更改。
	- 注意提供程序不会为虚拟文档创建 uri - 它的作用是在给定 uri 的情况下提供内容。
	  作为回报，内容提供程序被集成到打开文档的逻辑中，因此提供程序总是会被考虑在内。
	https://code.visualstudio.com/api/extension-guides/virtual-documents
	*/
	const diffContentProvider = new (class implements vscode.TextDocumentContentProvider {
		provideTextDocumentContent(uri: vscode.Uri): string {
			return Buffer.from(uri.query, "base64").toString("utf-8")
		}
	})()
	context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(DIFF_VIEW_URI_SCHEME, diffContentProvider))

	// URI 处理程序
	const handleUri = async (uri: vscode.Uri) => {
		console.log("URI 处理程序被调用，参数：", {
			path: uri.path,
			query: uri.query,
			scheme: uri.scheme,
		})

		const path = uri.path
		const query = new URLSearchParams(uri.query.replace(/\+/g, "%2B"))
		const visibleProvider = ClineProvider.getVisibleInstance()
		if (!visibleProvider) {
			return
		}
		switch (path) {
			case "/openrouter": {
				const code = query.get("code")
				if (code) {
					await visibleProvider.handleOpenRouterCallback(code)
				}
				break
			}
			case "/auth": {
				const token = query.get("token")
				const state = query.get("state")

				console.log("收到认证回调：", {
					token: token,
					state: state,
				})

				// 验证状态参数
				if (!(await visibleProvider.validateAuthState(state))) {
					vscode.window.showErrorMessage("无效的认证状态")
					return
				}

				if (token) {
					await visibleProvider.handleAuthCallback(token)
				}
				break
			}
			default:
				break
		}
	}
	context.subscriptions.push(vscode.window.registerUriHandler({ handleUri }))

	return createClineAPI(outputChannel, sidebarProvider)
}

// 当扩展被停用时调用此方法
export function deactivate() {
	Logger.log("Cline 扩展已停用")
}
