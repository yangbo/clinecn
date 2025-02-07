import AnthropicBedrock from "@anthropic-ai/bedrock-sdk"
import { Anthropic } from "@anthropic-ai/sdk"
import { ApiHandler } from "../"
import { ApiHandlerOptions, bedrockDefaultModelId, BedrockModelId, bedrockModels, ModelInfo } from "../../shared/api"
import { ApiStream } from "../transform/stream"

// https://docs.anthropic.com/en/api/claude-on-amazon-bedrock
export class AwsBedrockHandler implements ApiHandler {
	private options: ApiHandlerOptions
	private client: AnthropicBedrock

	constructor(options: ApiHandlerOptions) {
		this.options = options
		this.client = new AnthropicBedrock({
			// 可以通过提供以下密钥进行身份验证，或使用默认的 AWS 凭证提供程序，
			// 例如使用 ~/.aws/credentials 或 "AWS_SECRET_ACCESS_KEY" 和 "AWS_ACCESS_KEY_ID" 环境变量。
			...(this.options.awsAccessKey ? { awsAccessKey: this.options.awsAccessKey } : {}),
			...(this.options.awsSecretKey ? { awsSecretKey: this.options.awsSecretKey } : {}),
			...(this.options.awsSessionToken ? { awsSessionToken: this.options.awsSessionToken } : {}),

			// awsRegion 更改请求发送到的 AWS 区域。默认情况下，我们读取 AWS_REGION，
			// 如果不存在，则默认为 us-east-1。注意，我们不会从 ~/.aws/config 读取区域。
			awsRegion: this.options.awsRegion,
		})
	}

	async *createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): ApiStream {
		// 跨区域推理需要在模型 ID 前加上区域前缀
		let modelId: string
		if (this.options.awsUseCrossRegionInference) {
			let regionPrefix = (this.options.awsRegion || "").slice(0, 3)
			switch (regionPrefix) {
				case "us-":
					modelId = `us.${this.getModel().id}`
					break
				case "eu-":
					modelId = `eu.${this.getModel().id}`
					break
				default:
					// 此区域不支持跨区域推理，回退到默认模型
					modelId = this.getModel().id
					break
			}
		} else {
			modelId = this.getModel().id
		}

		const stream = await this.client.messages.create({
			model: modelId,
			max_tokens: this.getModel().info.maxTokens || 8192,
			temperature: 0,
			system: systemPrompt,
			messages,
			stream: true,
		})
		for await (const chunk of stream) {
			switch (chunk.type) {
				case "message_start":
					const usage = chunk.message.usage
					yield {
						type: "usage",
						inputTokens: usage.input_tokens || 0,
						outputTokens: usage.output_tokens || 0,
					}
					break
				case "message_delta":
					yield {
						type: "usage",
						inputTokens: 0,
						outputTokens: chunk.usage.output_tokens || 0,
					}
					break

				case "content_block_start":
					switch (chunk.content_block.type) {
						case "text":
							if (chunk.index > 0) {
								yield {
									type: "text",
									text: "\n",
								}
							}
							yield {
								type: "text",
								text: chunk.content_block.text,
							}
							break
					}
					break
				case "content_block_delta":
					switch (chunk.delta.type) {
						case "text_delta":
							yield {
								type: "text",
								text: chunk.delta.text,
							}
							break
					}
					break
			}
		}
	}

	getModel(): { id: BedrockModelId; info: ModelInfo } {
		const modelId = this.options.apiModelId
		if (modelId && modelId in bedrockModels) {
			const id = modelId as BedrockModelId
			return { id, info: bedrockModels[id] }
		}
		return {
			id: bedrockDefaultModelId,
			info: bedrockModels[bedrockDefaultModelId],
		}
	}
}
