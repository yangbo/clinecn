import { Anthropic } from "@anthropic-ai/sdk"
import * as path from "path"
import * as diff from "diff"

export const formatResponse = {
	toolDenied: () => `用户拒绝了此操作。`,

	toolDeniedWithFeedback: (feedback?: string) => `用户拒绝了此操作并提供了以下反馈：\n<feedback>\n${feedback}\n</feedback>`,

	toolError: (error?: string) => `工具执行失败，错误信息如下：\n<e>\n${error}\n</e>`,

	noToolsUsed: () =>
		`[错误] 您在上一个响应中没有使用任何工具！请使用工具重试。

${toolUseInstructionsReminder}

# 下一步

如果您已完成用户的任务，请使用 attempt_completion 工具。
如果您需要用户提供更多信息，请使用 ask_followup_question 工具。
否则，如果您尚未完成任务且不需要额外信息，请继续执行任务的下一步。
（这是一条自动消息，请不要以对话方式回复。）`,

	tooManyMistakes: (feedback?: string) =>
		`看起来您在继续操作时遇到了困难。用户提供了以下反馈来帮助指导您：\n<feedback>\n${feedback}\n</feedback>`,

	missingToolParameterError: (paramName: string) =>
		`缺少必需参数 '${paramName}'。请使用完整的响应重试。\n\n${toolUseInstructionsReminder}`,

	invalidMcpToolArgumentError: (serverName: string, toolName: string) =>
		`${serverName} 的 ${toolName} 使用了无效的 JSON 参数。请使用格式正确的 JSON 参数重试。`,

	toolResult: (text: string, images?: string[]): string | Array<Anthropic.TextBlockParam | Anthropic.ImageBlockParam> => {
		if (images && images.length > 0) {
			const textBlock: Anthropic.TextBlockParam = { type: "text", text }
			const imageBlocks: Anthropic.ImageBlockParam[] = formatImagesIntoBlocks(images)
			// 将图片放在文本后面会得到更好的结果
			return [textBlock, ...imageBlocks]
		} else {
			return text
		}
	},

	imageBlocks: (images?: string[]): Anthropic.ImageBlockParam[] => {
		return formatImagesIntoBlocks(images)
	},

	formatFilesList: (absolutePath: string, files: string[], didHitLimit: boolean): string => {
		const sorted = files
			.map((file) => {
				// 将绝对路径转换为相对路径
				const relativePath = path.relative(absolutePath, file).toPosix()
				return file.endsWith("/") ? relativePath + "/" : relativePath
			})
			// 将文件按目录排序，以便清楚地显示哪些文件属于哪些目录。
			// 由于我们是自上而下构建文件列表，即使文件列表被截断，它也会显示 cline 可以进一步探索的目录。
			.sort((a, b) => {
				const aParts = a.split("/") // 仅在使用 toPosix 后有效
				const bParts = b.split("/")
				for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
					if (aParts[i] !== bParts[i]) {
						// 如果在这一级别上一个是目录而另一个不是，则目录排在前面
						if (i + 1 === aParts.length && i + 1 < bParts.length) {
							return -1
						}
						if (i + 1 === bParts.length && i + 1 < aParts.length) {
							return 1
						}
						// 否则，按字母顺序排序
						return aParts[i].localeCompare(bParts[i], undefined, {
							numeric: true,
							sensitivity: "base",
						})
					}
				}
				// 如果所有部分在较短路径的长度范围内都相同，
				// 则较短的排在前面
				return aParts.length - bParts.length
			})
		if (didHitLimit) {
			return `${sorted.join("\n")}\n\n(文件列表已截断。如果需要进一步探索，请对特定子目录使用 list_files。)`
		} else if (sorted.length === 0 || (sorted.length === 1 && sorted[0] === "")) {
			return "未找到文件。"
		} else {
			return sorted.join("\n")
		}
	},

	createPrettyPatch: (filename = "file", oldStr?: string, newStr?: string) => {
		// 字符串不能为 undefined，否则 diff 会抛出异常
		const patch = diff.createPatch(filename.toPosix(), oldStr || "", newStr || "")
		const lines = patch.split("\n")
		const prettyPatchLines = lines.slice(4)
		return prettyPatchLines.join("\n")
	},
}

// 避免循环依赖
const formatImagesIntoBlocks = (images?: string[]): Anthropic.ImageBlockParam[] => {
	return images
		? images.map((dataUrl) => {
				// data:image/png;base64,base64string
				const [rest, base64] = dataUrl.split(",")
				const mimeType = rest.split(":")[1].split(";")[0]
				return {
					type: "image",
					source: {
						type: "base64",
						media_type: mimeType,
						data: base64,
					},
				} as Anthropic.ImageBlockParam
			})
		: []
}

const toolUseInstructionsReminder = `# 提醒：工具使用说明

工具使用采用 XML 风格的标签格式。工具名称包含在开始和结束标签中，每个参数也同样包含在自己的标签集中。结构如下：

<tool_name>
<parameter1_name>value1</parameter1_name>
<parameter2_name>value2</parameter2_name>
...
</tool_name>

例如：

<attempt_completion>
<r>
我已完成任务...
</r>
</attempt_completion>

请始终遵循此格式进行所有工具使用，以确保正确的解析和执行。`
