import { VSCodeButton, VSCodeLink, VSCodeTextArea } from "@vscode/webview-ui-toolkit/react"
import { memo, useEffect, useState } from "react"
import { useExtensionState } from "../../context/ExtensionStateContext"
import { validateApiConfiguration, validateModelId } from "../../utils/validate"
import { vscode } from "../../utils/vscode"
import ApiOptions from "./ApiOptions"
import SettingsButton from "../common/SettingsButton"
const IS_DEV = true // FIXME: use flags when packaging

type SettingsViewProps = {
	onDone: () => void
}

const SettingsView = ({ onDone }: SettingsViewProps) => {
	const { apiConfiguration, version, customInstructions, setCustomInstructions, openRouterModels } = useExtensionState()
	const [apiErrorMessage, setApiErrorMessage] = useState<string | undefined>(undefined)
	const [modelIdErrorMessage, setModelIdErrorMessage] = useState<string | undefined>(undefined)

	const handleSubmit = () => {
		const apiValidationResult = validateApiConfiguration(apiConfiguration)
		const modelIdValidationResult = validateModelId(apiConfiguration, openRouterModels)

		setApiErrorMessage(apiValidationResult)
		setModelIdErrorMessage(modelIdValidationResult)

		if (!apiValidationResult && !modelIdValidationResult) {
			vscode.postMessage({ type: "apiConfiguration", apiConfiguration })
			vscode.postMessage({
				type: "customInstructions",
				text: customInstructions,
			})
			onDone()
		}
	}

	useEffect(() => {
		setApiErrorMessage(undefined)
		setModelIdErrorMessage(undefined)
	}, [apiConfiguration])

	// validate as soon as the component is mounted
	/*
	useEffect will use stale values of variables if they are not included in the dependency array. so trying to use useEffect with a dependency array of only one value for example will use any other variables' old values. In most cases you don't want this, and should opt to use react-use hooks.
	
	useEffect(() => {
		// uses someVar and anotherVar
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [someVar])

	If we only want to run code once on mount we can use react-use's useEffectOnce or useMount
	*/

	const handleResetState = () => {
		vscode.postMessage({ type: "resetState" })
	}

	return (
		<div
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				padding: "10px 0px 0px 20px",
				display: "flex",
				flexDirection: "column",
				overflow: "hidden",
			}}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: "17px",
					paddingRight: 17,
				}}>
				<h3 style={{ color: "var(--vscode-foreground)", margin: 0 }}>设置</h3>
				<VSCodeButton onClick={handleSubmit}>完成</VSCodeButton>
			</div>
			<div
				style={{
					flexGrow: 1,
					overflowY: "scroll",
					paddingRight: 8,
					display: "flex",
					flexDirection: "column",
				}}>
				<div style={{ marginBottom: 5 }}>
					<ApiOptions
						showModelOptions={true}
						apiErrorMessage={apiErrorMessage}
						modelIdErrorMessage={modelIdErrorMessage}
					/>
				</div>

				<div style={{ marginBottom: 5 }}>
					<VSCodeTextArea
						value={customInstructions ?? ""}
						style={{ width: "100%" }}
						resize="vertical"
						rows={4}
						placeholder={'例如："运行单元测试", "使用 TypeScript 和 async/await", "用中文交流"'}
						onInput={(e: any) => setCustomInstructions(e.target?.value ?? "")}>
						<span style={{ fontWeight: "500" }}>自定义指令</span>
					</VSCodeTextArea>
					<p
						style={{
							fontSize: "12px",
							marginTop: "5px",
							color: "var(--vscode-descriptionForeground)",
						}}>
						这些指令会被添加到每个请求发送的系统提示的末尾。
					</p>
				</div>

				{IS_DEV && (
					<>
						<div style={{ marginTop: "10px", marginBottom: "4px" }}>调试</div>
						<VSCodeButton onClick={handleResetState} style={{ marginTop: "5px", width: "auto" }}>
							重置状态
						</VSCodeButton>
						<p
							style={{
								fontSize: "12px",
								marginTop: "5px",
								color: "var(--vscode-descriptionForeground)",
							}}>
							这将重置扩展中的所有全局状态和密钥存储。
						</p>
					</>
				)}

				<div
					style={{
						marginTop: "auto",
						paddingRight: 8,
						display: "flex",
						justifyContent: "center",
					}}>
					<SettingsButton
						onClick={() => vscode.postMessage({ type: "openExtensionSettings" })}
						style={{
							margin: "0 0 16px 0",
						}}>
						<i className="codicon codicon-settings-gear" />
						高级设置
					</SettingsButton>
				</div>
				<div
					style={{
						textAlign: "center",
						color: "var(--vscode-descriptionForeground)",
						fontSize: "12px",
						lineHeight: "1.2",
						padding: "0 8px 15px 0",
					}}>
					<p
						style={{
							wordWrap: "break-word",
							margin: 0,
							padding: 0,
						}}>
						如果您有任何问题或反馈，欢迎在{" "}
						<VSCodeLink href="https://gitee.com/terawin/clinecn" style={{ display: "inline" }}>
						https://gitee.com/terawin/clinecn
						</VSCodeLink>{" "}提出来。
					</p>
					<p
						style={{
							fontStyle: "italic",
							margin: "10px 0 0 0",
							padding: 0,
						}}>
						v{version}
					</p>
				</div>
			</div>
		</div>
	)
}

export default memo(SettingsView)
