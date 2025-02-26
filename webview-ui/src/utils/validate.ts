import { ApiConfiguration, openRouterDefaultModelId } from "../../../src/shared/api"
import { ModelInfo } from "../../../src/shared/api"
export function validateApiConfiguration(apiConfiguration?: ApiConfiguration): string | undefined {
	if (apiConfiguration) {
		switch (apiConfiguration.apiProvider) {
			case "anthropic":
				if (!apiConfiguration.apiKey) {
					return "您必须提供一个有效的 API 密钥或选择不同的提供商。"
				}
				break
			case "bedrock":
				if (!apiConfiguration.awsRegion) {
					return "您必须选择一个区域用于 AWS Bedrock。"
				}
				break
			case "openrouter":
				if (!apiConfiguration.openRouterApiKey) {
					return "您必须提供一个有效的 API 密钥或选择不同的提供商。"
				}
				break
			case "vertex":
				if (!apiConfiguration.vertexProjectId || !apiConfiguration.vertexRegion) {
					return "您必须提供一个有效的 Google Cloud 项目ID 和区域。"
				}
				break
			case "gemini":
				if (!apiConfiguration.geminiApiKey) {
					return "您必须提供一个有效的 API 密钥或选择不同的提供商。"
				}
				break
			case "openai-native":
				if (!apiConfiguration.openAiNativeApiKey) {
					return "您必须提供一个有效的 API 密钥或选择不同的提供商。"
				}
				break
			case "deepseek":
				if (!apiConfiguration.deepSeekApiKey) {
					return "您必须提供一个有效的 API 密钥或选择不同的提供商。"
				}
				break
			case "qwen":
				if (!apiConfiguration.qwenApiKey) {
					return "您必须提供一个有效的 API 密钥或选择不同的提供商。"
				}
				break
			case "mistral":
				if (!apiConfiguration.mistralApiKey) {
					return "您必须提供一个有效的 API 密钥或选择不同的提供商。"
				}
				break
			case "openai":
				if (!apiConfiguration.openAiBaseUrl || !apiConfiguration.openAiApiKey || !apiConfiguration.openAiModelId) {
					return "您必须提供一个有效的 base URL、API密钥和模型ID。"
				}
				break
			case "requesty":
				if (!apiConfiguration.requestyApiKey || !apiConfiguration.requestyModelId) {
					return "您必须提供一个有效的 API 密钥或选择不同的提供商。"
				}
				break
			case "together":
				if (!apiConfiguration.togetherApiKey || !apiConfiguration.togetherModelId) {
					return "您必须提供一个有效的 API 密钥或选择不同的提供商。"
				}
				break
			case "ollama":
				if (!apiConfiguration.ollamaModelId) {
					return "您必须提供一个有效的模型ID。"
				}
				break
			case "lmstudio":
				if (!apiConfiguration.lmStudioModelId) {
					return "您必须提供一个有效的模型ID。"
				}
				break
			case "vscode-lm":
				if (!apiConfiguration.vsCodeLmModelSelector) {
					return "您必须提供一个有效的模型选择器。"
				}
				break
		}
	}
	return undefined
}

export function validateModelId(
	apiConfiguration?: ApiConfiguration,
	openRouterModels?: Record<string, ModelInfo>,
): string | undefined {
	if (apiConfiguration) {
		switch (apiConfiguration.apiProvider) {
			case "openrouter":
				const modelId = apiConfiguration.openRouterModelId || openRouterDefaultModelId // in case the user hasn't changed the model id, it will be undefined by default
				if (!modelId) {
					return "您必须提供一个模型ID。"
				}
				if (openRouterModels && !Object.keys(openRouterModels).includes(modelId)) {
					// even if the model list endpoint failed, extensionstatecontext will always have the default model info
					return "您提供的模型ID不可用。请选择不同的模型。"
				}
				break
		}
	}
	return undefined
}
