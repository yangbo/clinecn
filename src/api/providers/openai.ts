import { Anthropic } from "@anthropic-ai/sdk"
import OpenAI, { AzureOpenAI } from "openai"
import { withRetry } from "../retry"
import { ApiHandlerOptions, ApiProvider, azureOpenAiDefaultApiVersion, CustomProvider, ModelInfo, openAiModelInfoSaneDefaults } from "../../shared/api"
import { ApiHandler } from "../index"
import { convertToOpenAiMessages } from "../transform/openai-format"
import { ApiStream } from "../transform/stream"
import { convertToR1Format } from "../transform/r1-format"

/**
 * 自定义供应商处理器。
 * 目前只支持兼容 OpenAI API 形式的供应商。
 */
export class OpenAiHandler implements ApiHandler {
	private options: CustomProvider
	private client: OpenAI

	constructor(apiProvider: ApiProvider, options: ApiHandlerOptions) {
		// 自定义供应商的 options 要从字典 customProviderMap 中获取
		const customOptions = options.customProviderMap?.[apiProvider]
		if (!customOptions) {
			throw new Error(`找不到自定义供应商 ${apiProvider} 的配置`)
		}
		this.options = customOptions
		// Azure API 的形状与核心 API 形状略有不同：https://github.com/openai/openai-node?tab=readme-ov-file#microsoft-azure-openai
		if (this.options.baseUrl?.toLowerCase().includes("azure.com")) {
			this.client = new AzureOpenAI({
				baseURL: this.options.baseUrl,
				apiKey: this.options.apiKey,
				apiVersion: this.options.apiVersion || azureOpenAiDefaultApiVersion,
			})
		} else {
			this.client = new OpenAI({
				baseURL: this.options.baseUrl,
				apiKey: this.options.apiKey,
			})
		}
	}

	// TODO 独立出 action model id
	@withRetry()
	async *createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): ApiStream {
		const modelId = this.options.planModelId
		// 添加 DeepSeek Reasoner 的设置，因为模型id可能不包含 deepseek-reasoner，但模型实际上是 deepseek-reasoner
		const isDeepseekReasoner = this.options.modelMap[modelId]?.isDeepseekReasoner

		let openAiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
			{ role: "system", content: systemPrompt },
			...convertToOpenAiMessages(messages),
		]

		if (isDeepseekReasoner) {
			openAiMessages = convertToR1Format([{ role: "user", content: systemPrompt }, ...messages])
		}

		const stream = await this.client.chat.completions.create({
			model: modelId,
			messages: openAiMessages,
			temperature: 0,
			stream: true,
			stream_options: { include_usage: true },
		})
		for await (const chunk of stream) {
			const delta = chunk.choices[0]?.delta
			if (delta?.content) {
				yield {
					type: "text",
					text: delta.content,
				}
			}

			if (delta && "reasoning_content" in delta && delta.reasoning_content) {
				yield {
					type: "reasoning",
					reasoning: (delta.reasoning_content as string | undefined) || "",
				}
			}

			if (chunk.usage) {
				yield {
					type: "usage",
					inputTokens: chunk.usage.prompt_tokens || 0,
					outputTokens: chunk.usage.completion_tokens || 0,
				}
			}
		}
	}

	// TODO 区分 plan model 和 act model
	getModel(): { id: string; info: ModelInfo } {
		return {
			id: this.options.planModelId,
			info: this.options.modelMap[this.options.planModelId]
		}
	}
}
