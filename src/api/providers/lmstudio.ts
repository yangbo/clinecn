import { Anthropic } from "@anthropic-ai/sdk"
import OpenAI from "openai"
import { ApiHandler } from "../"
import { ApiHandlerOptions, ModelInfo, openAiModelInfoSaneDefaults } from "../../shared/api"
import { convertToOpenAiMessages } from "../transform/openai-format"
import { ApiStream } from "../transform/stream"

export class LmStudioHandler implements ApiHandler {
	private options: ApiHandlerOptions
	private client: OpenAI

	constructor(options: ApiHandlerOptions) {
		this.options = options
		this.client = new OpenAI({
			baseURL: (this.options.lmStudioBaseUrl || "http://localhost:1234") + "/v1",
			apiKey: "noop",
		})
	}

	async *createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): ApiStream {
		const openAiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
			{ role: "system", content: systemPrompt },
			...convertToOpenAiMessages(messages),
		]

		try {
			const stream = await this.client.chat.completions.create({
				model: this.getModel().id,
				messages: openAiMessages,
				temperature: 0,
				stream: true,
			})
			for await (const chunk of stream) {
				const delta = chunk.choices[0]?.delta
				if (delta?.content) {
					yield {
						type: "text",
						text: delta.content,
					}
				}
			}
		} catch (error) {
			// LM Studio 目前不返回错误代码/正文
			throw new Error("请检查 LM Studio 开发者日志以调试问题。您可能需要加载具有更大上下文长度的模型以使用 Cline 的提示。")
		}
	}

	getModel(): { id: string; info: ModelInfo } {
		return {
			id: this.options.lmStudioModelId || "",
			info: openAiModelInfoSaneDefaults,
		}
	}
}
