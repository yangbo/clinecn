import * as fs from "fs/promises"
import * as path from "path"
import { listFiles } from "../glob/list-files"
import { LanguageParser, loadRequiredLanguageParsers } from "./languageParser"
import { fileExistsAtPath } from "../../utils/fs"
import { ClineIgnoreController } from "../../core/ignore/ClineIgnoreController"

// TODO: implement caching behavior to avoid having to keep analyzing project for new tasks.
export async function parseSourceCodeForDefinitionsTopLevel(
	dirPath: string,
	clineIgnoreController?: ClineIgnoreController,
): Promise<string> {
	// check if the path exists
	const dirExists = await fileExistsAtPath(path.resolve(dirPath))
	if (!dirExists) {
		return "该目录不存在或您没有访问权限。"
	}

	// 获取顶层的所有文件（不包括 gitignored 文件）
	const [allFiles, _] = await listFiles(dirPath, false, 200)

	let result = ""

	// 分离需要解析的文件和剩余文件
	const { filesToParse, remainingFiles } = separateFiles(allFiles)

	const languageParsers = await loadRequiredLanguageParsers(filesToParse)

	// 解析我们有语言解析器的特定文件
	// const filesWithoutDefinitions: string[] = []

	// Filter filepaths for access if controller is provided
	const allowedFilesToParse = clineIgnoreController ? clineIgnoreController.filterPaths(filesToParse) : filesToParse

	for (const filePath of allowedFilesToParse) {
		const definitions = await parseFile(filePath, languageParsers, clineIgnoreController)
		if (definitions) {
			result += `${path.relative(dirPath, filePath).toPosix()}\n${definitions}\n`
		}
		// else {
		// 	filesWithoutDefinitions.push(file)
		// }
	}

	// 列出剩余文件的路径
	// let didFindUnparsedFiles = false
	// filesWithoutDefinitions
	// 	.concat(remainingFiles)
	// 	.sort()
	// 	.forEach((file) => {
	// 		if (!didFindUnparsedFiles) {
	// 			result += "# 未解析的文件\n\n"
	// 			didFindUnparsedFiles = true
	// 		}
	// 		result += `${path.relative(dirPath, file)}\n`
	// 	})

	return result ? result : "未找到源代码定义。"
}

function separateFiles(allFiles: string[]): {
	filesToParse: string[]
	remainingFiles: string[]
} {
	const extensions = [
		"js",
		"jsx",
		"ts",
		"tsx",
		"py",
		// Rust
		"rs",
		"go",
		// C
		"c",
		"h",
		// C++
		"cpp",
		"hpp",
		// C#
		"cs",
		// Ruby
		"rb",
		"java",
		"php",
		"swift",
	].map((e) => `.${e}`)
	const filesToParse = allFiles.filter((file) => extensions.includes(path.extname(file))).slice(0, 50) // 50 files max
	const remainingFiles = allFiles.filter((file) => !filesToParse.includes(file))
	return { filesToParse, remainingFiles }
}

/*
使用 tree-sitter 解析文件

1. 使用适当的语言语法（定义语言组件如关键字、表达式和语句如何组合以创建有效程序的规则集）将文件内容解析为 AST（抽象语法树）。
2. 使用特定语言的查询字符串创建查询，并针对 AST 的根节点运行它以捕获特定的语法元素。
    - 我们使用标签查询来识别程序中的命名实体，然后使用语法捕获来标记实体及其名称。这方面的一个典型例子是 GitHub 的基于搜索的代码导航。
	- 我们的自定义标签查询基于 tree-sitter 的默认标签查询，但修改为仅捕获定义。
3. 按文件中的位置对捕获进行排序，输出定义的名称，并通过添加 "|----\n" 等方式格式化捕获部分之间的间隔。

这种方法使我们能够专注于代码的最相关部分（由我们的特定语言查询定义），并提供文件结构和关键元素的简明而信息丰富的视图。

- https://github.com/tree-sitter/node-tree-sitter/blob/master/test/query_test.js
- https://github.com/tree-sitter/tree-sitter/blob/master/lib/binding_web/test/query-test.js
- https://github.com/tree-sitter/tree-sitter/blob/master/lib/binding_web/test/helper.js
- https://tree-sitter.github.io/tree-sitter/code-navigation-systems
*/
async function parseFile(
	filePath: string,
	languageParsers: LanguageParser,
	clineIgnoreController?: ClineIgnoreController,
): Promise<string | null> {
	if (clineIgnoreController && !clineIgnoreController.validateAccess(filePath)) {
		return null
	}
	const fileContent = await fs.readFile(filePath, "utf8")
	const ext = path.extname(filePath).toLowerCase().slice(1)

	const { parser, query } = languageParsers[ext] || {}
	if (!parser || !query) {
		return `不支持的文件类型：${filePath}`
	}

	let formattedOutput = ""

	try {
		// 将文件内容解析为抽象语法树（AST），这是代码的树状表示
		const tree = parser.parse(fileContent)

		// 将查询应用于 AST 并获取捕获
		// 捕获是 AST 中匹配我们查询模式的特定部分，每个捕获代表我们感兴趣的 AST 中的一个节点。
		const captures = query.captures(tree.rootNode)

		// 按起始位置对捕获进行排序
		captures.sort((a, b) => a.node.startPosition.row - b.node.startPosition.row)

		// 将文件内容分割成单独的行
		const lines = fileContent.split("\n")

		// 跟踪我们处理过的最后一行
		let lastLine = -1

		captures.forEach((capture) => {
			const { node, name } = capture
			// 获取当前 AST 节点的起始和结束行
			const startLine = node.startPosition.row
			const endLine = node.endPosition.row
			// 一旦我们通过语言查询检索到我们关心的节点，我们就只过滤出包含定义名称的行。
			// name.startsWith("name.reference.") > 引用可用于排名目的，但我们不需要它们用于输出
			// 之前我们使用 `name.startsWith("name.definition.")` 但这太严格，排除了一些相关的定义

			// 如果捕获之间有间隔，添加分隔符
			if (lastLine !== -1 && startLine > lastLine + 1) {
				formattedOutput += "|----\n"
			}
			// 只添加定义的第一行
			// 查询捕获包括定义名称和定义实现，但我们只想要名称（我发现各种语言的命名结构有差异，例如 javascript 名称是 'name'，而 typescript 名称是 'name.definition'）
			if (name.includes("name") && lines[startLine]) {
				formattedOutput += `│${lines[startLine]}\n`
			}
			// 添加所有捕获的行
			// for (let i = startLine; i <= endLine; i++) {
			// 	formattedOutput += `│${lines[i]}\n`
			// }
			//}

			lastLine = endLine
		})
	} catch (error) {
		console.log(`解析文件时出错：${error}\n`)
	}

	if (formattedOutput.length > 0) {
		return `|----\n${formattedOutput}|----\n`
	}
	return null
}
