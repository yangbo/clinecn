/**
 * 修复 AI 模型输出中不正确转义的 HTML 实体
 * @param text 可能包含 AI 模型不正确转义的 HTML 实体的字符串
 * @returns 将 HTML 实体转换回正常字符的字符串
 */
export function fixModelHtmlEscaping(text: string): string {
	return text
		.replace(/&gt;/g, ">")
		.replace(/&lt;/g, "<")
		.replace(/&quot;/g, '"')
		.replace(/&amp;/g, "&")
		.replace(/&apos;/g, "'")
}

/**
 * 从字符串中删除无效字符（如替换字符）
 * @param text 可能包含无效字符的字符串
 * @returns 删除无效字符后的字符串
 */
export function removeInvalidChars(text: string): string {
	return text.replace(/\uFFFD/g, "")
}
