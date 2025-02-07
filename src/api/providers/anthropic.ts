import { Anthropic } from "@anthropic-ai/sdk"
import { Stream as AnthropicStream } from "@anthropic-ai/sdk/streaming"
import { withRetry } from "../retry"
import { anthropicDefaultModelId, AnthropicModelId, anthropicModels, ApiHandlerOptions, ModelInfo } from "../../shared/api"
import { ApiHandler } from "../index"
import { ApiStream } from "../transform/stream"

export class AnthropicHandler implements ApiHandler {
	private options: ApiHandlerOptions
	private client: Anthropic

	constructor(options: ApiHandlerOptions) {
		this.options = options
		this.client = new Anthropic({
			apiKey: this.options.apiKey,
			baseURL: this.options.anthropicBaseUrl || undefined,
		})
	}

	@withRetry()
	async *createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): ApiStream {
		const model = this.getModel()
		let stream: AnthropicStream<Anthropic.Beta.PromptCaching.Messages.RawPromptCachingBetaMessageStreamEvent>
		const modelId = model.id
		switch (modelId) {
			// 'latest' alias does not support cache_control
			case "claude-3-5-sonnet-20241022":
			case "claude-3-5-haiku-20241022":
			case "claude-3-opus-20240229":
			case "claude-3-haiku-20240307": {
				/*
				最新的消息将是新的用户消息，之前的一条将是来自上一个请求的助手消息，
				再之前的用户消息将是之前缓存的用户消息。因此，我们需要将最新的用户消息
				标记为临时消息以将其缓存用于下一个请求，并将倒数第二条用户消息标记为临时消息，
				以让服务器知道从缓存中检索当前请求的最后一条消息。
				*/
				const userMsgIndices = messages.reduce(
					(acc, msg, index) => (msg.role === "user" ? [...acc, index] : acc),
					[] as number[],
				)
				const lastUserMsgIndex = userMsgIndices[userMsgIndices.length - 1] ?? -1
				const secondLastMsgUserIndex = userMsgIndices[userMsgIndices.length - 2] ?? -1
				stream = await this.client.beta.promptCaching.messages.create(
					{
						model: modelId,
						max_tokens: model.info.maxTokens || 8192,
						temperature: 0,
						system: [
							{
								text: systemPrompt,
								type: "text",
								cache_control: { type: "ephemeral" },
							},
						], // setting cache breakpoint for system prompt so new tasks can reuse it
						messages: messages.map((message, index) => {
							if (index === lastUserMsgIndex || index === secondLastMsgUserIndex) {
								return {
									...message,
									content:
										typeof message.content === "string"
											? [
													{
														type: "text",
														text: message.content,
														cache_control: {
															type: "ephemeral",
														},
													},
												]
											: message.content.map((content, contentIndex) =>
													contentIndex === message.content.length - 1
														? {
																...content,
																cache_control: {
																	type: "ephemeral",
																},
															}
														: content,
												),
								}
							}
							return message
						}),
						// tools, // cache breakpoints go from tools > system > messages, and since tools dont change, we can just set the breakpoint at the end of system (this avoids having to set a breakpoint at the end of tools which by itself does not meet min requirements for haiku caching)
						// tool_choice: { type: "auto" },
						// tools: tools,
						stream: true,
					},
					(() => {
						// prompt caching: https://x.com/alexalbert__/status/1823751995901272068
						// https://github.com/anthropics/anthropic-sdk-typescript?tab=readme-ov-file#default-headers
						// https://github.com/anthropics/anthropic-sdk-typescript/commit/c920b77fc67bd839bfeb6716ceab9d7c9bbe7393
						switch (modelId) {
							case "claude-3-5-sonnet-20241022":
							case "claude-3-5-haiku-20241022":
							case "claude-3-opus-20240229":
							case "claude-3-haiku-20240307":
								return {
									headers: {
										"anthropic-beta": "prompt-caching-2024-07-31",
									},
								}
							default:
								return undefined
						}
					})(),
				)
				break
			}
			default: {
				stream = (await this.client.messages.create({
					model: modelId,
					max_tokens: model.info.maxTokens || 8192,
					temperature: 0,
					system: [{ text: systemPrompt, type: "text" }],
					messages,
					// tools,
					// tool_choice: { type: "auto" },
					stream: true,
				})) as any
				break
			}
		}

		for await (const chunk of stream) {
			switch (chunk.type) {
				case "message_start":
					// tells us cache reads/writes/input/output
					const usage = chunk.message.usage
					yield {
						type: "usage",
						inputTokens: usage.input_tokens || 0,
						outputTokens: usage.output_tokens || 0,
						cacheWriteTokens: usage.cache_creation_input_tokens || undefined,
						cacheReadTokens: usage.cache_read_input_tokens || undefined,
					}
					break
				case "message_delta":
					// tells us stop_reason, stop_sequence, and output tokens along the way and at the end of the message

					yield {
						type: "usage",
						inputTokens: 0,
						outputTokens: chunk.usage.output_tokens || 0,
					}
					break
				case "message_stop":
					// no usage data, just an indicator that the message is done
					break
				case "content_block_start":
					switch (chunk.content_block.type) {
						case "text":
							// we may receive multiple text blocks, in which case just insert a line break between them
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
				case "content_block_stop":
					break
			}
		}
	}

	getModel(): { id: AnthropicModelId; info: ModelInfo } {
		const modelId = this.options.apiModelId
		if (modelId && modelId in anthropicModels) {
			const id = modelId as AnthropicModelId
			return { id, info: anthropicModels[id] }
		}
		return {
			id: anthropicDefaultModelId,
			info: anthropicModels[anthropicDefaultModelId],
		}
	}
}
