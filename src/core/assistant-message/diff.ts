/**
 * 尝试在原始内容中对给定的搜索内容进行行级别的匹配。
 * 它尝试将 `searchContent` 的行与从 `lastProcessedIndex` 开始的 `originalContent` 中的一块行进行匹配。
 * 通过去除前后空格并确保它们之后完全相同来匹配行。
 *
 * 如果找到匹配，返回 [matchIndexStart, matchIndexEnd]，否则返回 false。
 */
function lineTrimmedFallbackMatch(originalContent: string, searchContent: string, startIndex: number): [number, number] | false {
	// 将两个内容分割成行
	const originalLines = originalContent.split("\n")
	const searchLines = searchContent.split("\n")

	// 如果存在尾部空行（来自 searchContent 中的尾部 \n），则删除它
	if (searchLines[searchLines.length - 1] === "") {
		searchLines.pop()
	}

	// 找到 startIndex 所在的行号
	let startLineNum = 0
	let currentIndex = 0
	while (currentIndex < startIndex && startLineNum < originalLines.length) {
		currentIndex += originalLines[startLineNum].length + 1 // +1 表示 \n
		startLineNum++
	}

	// 对于原始内容中的每个可能的起始位置
	for (let i = startLineNum; i <= originalLines.length - searchLines.length; i++) {
		let matches = true

		// 从这个位置尝试匹配所有搜索行
		for (let j = 0; j < searchLines.length; j++) {
			const originalTrimmed = originalLines[i + j].trim()
			const searchTrimmed = searchLines[j].trim()

			if (originalTrimmed !== searchTrimmed) {
				matches = false
				break
			}
		}

		// 如果我们找到了匹配，计算精确的字符位置
		if (matches) {
			// 找到起始字符索引
			let matchStartIndex = 0
			for (let k = 0; k < i; k++) {
				matchStartIndex += originalLines[k].length + 1 // +1 表示 \n
			}

			// 找到结束字符索引
			let matchEndIndex = matchStartIndex
			for (let k = 0; k < searchLines.length; k++) {
				matchEndIndex += originalLines[i + k].length + 1 // +1 表示 \n
			}

			return [matchStartIndex, matchEndIndex]
		}
	}

	return false
}

/**
 * 尝试通过使用第一行和最后一行作为锚点来匹配代码块。
 * 这是一个第三级回退策略，它可以帮助匹配那些我们可以通过匹配开始和结束来识别正确位置的块，
 * 即使具体内容略有不同。
 *
 * 匹配策略：
 * 1. 仅尝试匹配 3 行或更多行的块，以避免误报
 * 2. 从搜索内容中提取：
 *    - 第一行作为"起始锚点"
 *    - 最后一行作为"结束锚点"
 * 3. 对于原始内容中的每个位置：
 *    - 检查下一行是否匹配起始锚点
 *    - 如果匹配，则跳过搜索块的大小
 *    - 检查该行是否匹配结束锚点
 *    - 所有比较都是在去除空格后进行的
 *
 * 这种方法特别适用于匹配以下情况的代码块：
 * - 具体内容可能有细微差异
 * - 块的开始和结束足够独特，可以作为锚点
 * - 整体结构（行数）保持不变
 *
 * @param originalContent - 原始文件的完整内容
 * @param searchContent - 我们试图在原始文件中找到的内容
 * @param startIndex - 从 originalContent 中开始搜索的字符索引
 * @returns 如果找到匹配则返回 [startIndex, endIndex] 元组，否则返回 false
 */
function blockAnchorFallbackMatch(originalContent: string, searchContent: string, startIndex: number): [number, number] | false {
	const originalLines = originalContent.split("\n")
	const searchLines = searchContent.split("\n")

	// 仅对 3 行或以上的块使用此方法
	if (searchLines.length < 3) {
		return false
	}

	// 如果存在尾部空行，则删除它
	if (searchLines[searchLines.length - 1] === "") {
		searchLines.pop()
	}

	const firstLineSearch = searchLines[0].trim()
	const lastLineSearch = searchLines[searchLines.length - 1].trim()
	const searchBlockSize = searchLines.length

	// 找到 startIndex 所在的行号
	let startLineNum = 0
	let currentIndex = 0
	while (currentIndex < startIndex && startLineNum < originalLines.length) {
		currentIndex += originalLines[startLineNum].length + 1
		startLineNum++
	}

	// 寻找匹配的起始和结束锚点
	for (let i = startLineNum; i <= originalLines.length - searchBlockSize; i++) {
		// 检查第一行是否匹配
		if (originalLines[i].trim() !== firstLineSearch) {
			continue
		}

		// 检查最后一行是否在预期位置匹配
		if (originalLines[i + searchBlockSize - 1].trim() !== lastLineSearch) {
			continue
		}

		// 计算精确的字符位置
		let matchStartIndex = 0
		for (let k = 0; k < i; k++) {
			matchStartIndex += originalLines[k].length + 1
		}

		let matchEndIndex = matchStartIndex
		for (let k = 0; k < searchBlockSize; k++) {
			matchEndIndex += originalLines[i + k].length + 1
		}

		return [matchStartIndex, matchEndIndex]
	}

	return false
}

/**
 * 此函数通过将流式传输的差异（使用专门的 SEARCH/REPLACE 块格式）应用到原始文件内容来重建文件内容。
 * 它设计用于处理增量更新和处理所有块处理完成后的最终结果文件。
 *
 * 差异格式是一个使用三个标记来定义更改的自定义结构：
 *
 *   <<<<<<< SEARCH
 *   [在原始文件中要查找的精确内容]
 *   =======
 *   [要替换成的内容]
 *   >>>>>>> REPLACE
 *
 * 行为和假设：
 * 1. 文件按块处理。每个 `diffContent` 块可能包含部分或完整的 SEARCH/REPLACE 块。
 *    通过使用每个增量块调用此函数（使用 `isFinal` 指示最后一个块），生成最终重建的文件内容。
 *
 * 2. 匹配策略（按尝试顺序）：
 *    a. 精确匹配：首先尝试在原始文件中找到完全相同的 SEARCH 块文本
 *    b. 行级匹配：回退到忽略前导/尾随空格的逐行比较
 *    c. 块锚点匹配：对于 3 行以上的块，尝试使用第一行/最后一行作为锚点进行匹配
 *    如果所有匹配策略都失败，则抛出错误。
 *
 * 3. 空 SEARCH 部分：
 *    - 如果 SEARCH 为空且原始文件为空，这表示创建新文件（纯插入）。
 *    - 如果 SEARCH 为空但原始文件不为空，这表示完整文件替换（整个原始内容被视为匹配并替换）。
 *
 * 4. 应用更改：
 *    - 在遇到 "=======" 标记之前，行被累积为搜索内容。
 *    - 在 "=======" 之后和 ">>>>>>> REPLACE" 之前，行被累积为替换内容。
 *    - 一旦块完成（">>>>>>> REPLACE"），原始文件中匹配的部分被替换为累积的替换行，
 *      并且原始文件中的位置前进。
 *
 * 5. 增量输出：
 *    - 一旦找到匹配位置并且我们在 REPLACE 部分中，每个新的替换行都会被追加到结果中，
 *      这样部分更新可以被增量查看。
 *
 * 6. 部分标记：
 *    - 如果块的最后一行看起来可能是标记的一部分但不是已知标记之一，则将其删除。
 *      这可以防止不完整或部分标记破坏输出。
 *
 * 7. 完成：
 *    - 一旦所有块都处理完成（当 `isFinal` 为 true 时），最后替换部分之后的任何剩余原始内容
 *      都会被追加到结果中。
 *    - 不强制添加尾随换行符。代码尝试精确输出指定的内容。
 *
 * 错误：
 * - 如果使用任何可用的匹配策略都无法匹配搜索块，则抛出错误。
 */
export async function constructNewFileContent(diffContent: string, originalContent: string, isFinal: boolean): Promise<string> {
	let result = ""
	let lastProcessedIndex = 0

	let currentSearchContent = ""
	let currentReplaceContent = ""
	let inSearch = false
	let inReplace = false

	let searchMatchIndex = -1
	let searchEndIndex = -1

	let lines = diffContent.split("\n")

	// 如果最后一行看起来像是部分标记但未被识别，
	// 删除它，因为它可能是不完整的。
	const lastLine = lines[lines.length - 1]
	if (
		lines.length > 0 &&
		(lastLine.startsWith("<") || lastLine.startsWith("=") || lastLine.startsWith(">")) &&
		lastLine !== "<<<<<<< SEARCH" &&
		lastLine !== "=======" &&
		lastLine !== ">>>>>>> REPLACE"
	) {
		lines.pop()
	}

	for (const line of lines) {
		if (line === "<<<<<<< SEARCH") {
			inSearch = true
			currentSearchContent = ""
			currentReplaceContent = ""
			continue
		}

		if (line === "=======") {
			inSearch = false
			inReplace = true

			// 删除添加 === 标记的尾部换行符
			// if (currentSearchContent.endsWith("\r\n")) {
			// 	currentSearchContent = currentSearchContent.slice(0, -2)
			// } else if (currentSearchContent.endsWith("\n")) {
			// 	currentSearchContent = currentSearchContent.slice(0, -1)
			// }

			if (!currentSearchContent) {
				// 空搜索块
				if (originalContent.length === 0) {
					// 新文件场景：无需匹配，直接开始插入
					searchMatchIndex = 0
					searchEndIndex = 0
				} else {
					// 完整文件替换场景：将整个文件视为匹配
					searchMatchIndex = 0
					searchEndIndex = originalContent.length
				}
			} else {
				// 添加对低效全文件搜索的检查
				// if (currentSearchContent.trim() === originalContent.trim()) {
				// 	throw new Error(
				// 		"SEARCH 块包含整个文件内容。请选择以下方式之一：\n" +
				// 			"1. 使用空的 SEARCH 块来替换整个文件，或\n" +
				// 			"2. 对需要修改的文件特定部分进行有针对性的更改。",
				// 	)
				// }

				// 精确搜索匹配场景
				const exactIndex = originalContent.indexOf(currentSearchContent, lastProcessedIndex)
				if (exactIndex !== -1) {
					searchMatchIndex = exactIndex
					searchEndIndex = exactIndex + currentSearchContent.length
				} else {
					// 尝试行级别的匹配回退
					const lineMatch = lineTrimmedFallbackMatch(originalContent, currentSearchContent, lastProcessedIndex)
					if (lineMatch) {
						;[searchMatchIndex, searchEndIndex] = lineMatch
					} else {
						// 对较大的块尝试块锚点回退
						const blockMatch = blockAnchorFallbackMatch(originalContent, currentSearchContent, lastProcessedIndex)
						if (blockMatch) {
							;[searchMatchIndex, searchEndIndex] = blockMatch
						} else {
							throw new Error(`SEARCH 块：\n${currentSearchContent.trimEnd()}\n...在文件中找不到匹配项。`)
						}
					}
				}
			}

			// Output everything up to the match location
			result += originalContent.slice(lastProcessedIndex, searchMatchIndex)
			continue
		}

		if (line === ">>>>>>> REPLACE") {
			// Finished one replace block

			// // Remove the artificially added linebreak in the last line of the REPLACE block
			// if (result.endsWith("\r\n")) {
			// 	result = result.slice(0, -2)
			// } else if (result.endsWith("\n")) {
			// 	result = result.slice(0, -1)
			// }

			// Advance lastProcessedIndex to after the matched section
			lastProcessedIndex = searchEndIndex

			// Reset for next block
			inSearch = false
			inReplace = false
			currentSearchContent = ""
			currentReplaceContent = ""
			searchMatchIndex = -1
			searchEndIndex = -1
			continue
		}

		// Accumulate content for search or replace
		// (currentReplaceContent is not being used for anything right now since we directly append to result.)
		// (We artificially add a linebreak since we split on \n at the beginning. In order to not include a trailing linebreak in the final search/result blocks we need to remove it before using them. This allows for partial line matches to be correctly identified.)
		// NOTE: search/replace blocks must be arranged in the order they appear in the file due to how we build the content using lastProcessedIndex. We also cannot strip the trailing newline since for non-partial lines it would remove the linebreak from the original content. (If we remove end linebreak from search, then we'd also have to remove it from replace but we can't know if it's a partial line or not since the model may be using the line break to indicate the end of the block rather than as part of the search content.) We require the model to output full lines in order for our fallbacks to work as well.
		if (inSearch) {
			currentSearchContent += line + "\n"
		} else if (inReplace) {
			currentReplaceContent += line + "\n"
			// Output replacement lines immediately if we know the insertion point
			if (searchMatchIndex !== -1) {
				result += line + "\n"
			}
		}
	}

	// If this is the final chunk, append any remaining original content
	if (isFinal && lastProcessedIndex < originalContent.length) {
		result += originalContent.slice(lastProcessedIndex)
	}

	return result
}
