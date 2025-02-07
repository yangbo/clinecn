import * as vscode from "vscode"

/**
 * 检测给定文件内容中潜在的 AI 生成代码遗漏。
 * @param originalFileContent 文件的原始内容。
 * @param newFileContent 要检查的文件的新内容。
 * @returns 如果检测到潜在遗漏则返回 true，否则返回 false。
 */
function detectCodeOmission(originalFileContent: string, newFileContent: string): boolean {
	const originalLines = originalFileContent.split("\n")
	const newLines = newFileContent.split("\n")
	const omissionKeywords = ["remain", "remains", "unchanged", "rest", "previous", "existing", "..."]

	const commentPatterns = [
		/^\s*\/\//, // 大多数语言的单行注释
		/^\s*#/, // Python、Ruby 等的单行注释
		/^\s*\/\*/, // 多行注释开始
		/^\s*{\s*\/\*/, // JSX 注释开始
		/^\s*<!--/, // HTML 注释开始
	]

	for (const line of newLines) {
		if (commentPatterns.some((pattern) => pattern.test(line))) {
			const words = line.toLowerCase().split(/\s+/)
			if (omissionKeywords.some((keyword) => words.includes(keyword))) {
				if (!originalLines.includes(line)) {
					return true
				}
			}
		}
	}

	return false
}

/**
 * 如果检测到潜在的代码遗漏，在 VSCode 中显示警告。
 * @param originalFileContent 文件的原始内容。
 * @param newFileContent 要检查的文件的新内容。
 */
export function showOmissionWarning(originalFileContent: string, newFileContent: string): void {
	if (detectCodeOmission(originalFileContent, newFileContent)) {
		vscode.window
			.showWarningMessage("检测到潜在的代码截断。这种情况发生在 AI 达到其最大输出限制时。", "查看修复指南")
			.then((selection) => {
				if (selection === "查看修复指南") {
					vscode.env.openExternal(
						vscode.Uri.parse(
							"https://github.com/cline/cline/wiki/Troubleshooting-%E2%80%90-Cline-Deleting-Code-with-%22Rest-of-Code-Here%22-Comments",
						),
					)
				}
			})
	}
}
