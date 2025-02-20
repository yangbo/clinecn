import { VSCodeButton, VSCodeLink, VSCodeTextField } from "@vscode/webview-ui-toolkit/react"
import { useEffect, useState, useCallback } from "react"
import { useExtensionState } from "../../context/ExtensionStateContext"
import { validateApiConfiguration } from "../../utils/validate"
import { vscode } from "../../utils/vscode"
import ApiOptions from "../settings/ApiOptions"
import { useEvent } from "react-use"
import { ExtensionMessage } from "../../../../src/shared/ExtensionMessage"

const WelcomeView = () => {
	const { apiConfiguration } = useExtensionState()

	const [apiErrorMessage, setApiErrorMessage] = useState<string | undefined>(undefined)
	const [email, setEmail] = useState("")
	const [isSubscribed, setIsSubscribed] = useState(false)

	const disableLetsGoButton = apiErrorMessage != null

	const handleSubmit = () => {
		vscode.postMessage({ type: "apiConfiguration", apiConfiguration })
	}

	const handleSubscribe = () => {
		if (email) {
			vscode.postMessage({ type: "subscribeEmail", text: email })
		}
	}

	useEffect(() => {
		setApiErrorMessage(validateApiConfiguration(apiConfiguration))
	}, [apiConfiguration])

	// Add message handler for subscription confirmation
	const handleMessage = useCallback((e: MessageEvent) => {
		const message: ExtensionMessage = e.data
		if (message.type === "emailSubscribed") {
			setIsSubscribed(true)
			setEmail("")
		}
	}, [])

	useEvent("message", handleMessage)

	return (
		<div
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
			}}>
			<div
				style={{
					height: "100%",
					padding: "0 20px",
					overflow: "auto",
				}}>
				<h2>你好，我是 Cline</h2>
				<p>
					感谢{" "}
					<VSCodeLink
						href="https://www.deepseek.com/"
						style={{ display: "inline" }}>
						DeepSeek
					</VSCodeLink>{" "}为我们带来了改变世界的一个开源大语言模型，让AI编程可以惠及每一个中国人。
				</p>
				<p>
					感谢{" "}
					<VSCodeLink
						href="https://www-cdn.anthropic.com/fed9cc193a14b84131812372d8d5857f8f304c52/Model_Card_Claude_3_Addendum.pdf"
						style={{ display: "inline" }}>
						Claude 3.5 Sonnet 的代理编码能力
					</VSCodeLink>{" "}
					和各种工具的支持，让我可以创建和编辑文件、探索复杂项目、使用浏览器，以及执行终端命令（当然，需要你的许可）。
					我甚至可以使用“模型上下文协议（MCP）”来创建新工具，扩展能力。
				</p>

				<b>要开始使用，此扩展需要一个 DeepSeek-R1 级别的大语言模型 API 提供者。</b>

				{/* <div
					style={{
						marginTop: "15px",
						padding: isSubscribed ? "5px 15px 5px 15px" : "12px",
						background: "var(--vscode-textBlockQuote-background)",
						borderRadius: "6px",
						fontSize: "0.9em",
					}}>
					{isSubscribed ? (
						<p style={{ display: "flex", alignItems: "center", gap: "8px" }}>
							<span style={{ color: "var(--vscode-testing-iconPassed)", fontSize: "1.5em" }}>✓</span>
							感谢订阅！我们会及时通知你新功能的更新。
						</p>
					) : (
						<>
							<p style={{ margin: 0, marginBottom: "8px" }}>
								虽然 ClineCN 目前需要你提供自己的 API 密钥，
								但我们正在开发一个具有额外功能的官方账户系统。订阅我们的邮件列表以获取更新！
							</p>
							<div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
								<VSCodeTextField
									type="email"
									value={email}
									onInput={(e: any) => setEmail(e.target.value)}
									placeholder="输入你的邮箱"
									style={{ flex: 1 }}
								/>
								<VSCodeButton appearance="secondary" onClick={handleSubscribe} disabled={!email}>
									订阅
								</VSCodeButton>
							</div>
						</>
					)}
				</div> */}

				<div style={{ marginTop: "15px" }}>
					<ApiOptions showModelOptions={false} />
					<VSCodeButton onClick={handleSubmit} disabled={disableLetsGoButton} style={{ marginTop: "3px" }}>
						开始使用
					</VSCodeButton>
				</div>
			</div>
		</div>
	)
}

export default WelcomeView
