# Cline-Chinese (Cline中文汉化版) 🌏

[![Version](https://img.shields.io/visual-studio-marketplace/v/HybridTalentComputing.cline-chinese)](https://marketplace.visualstudio.com/items?itemName=HybridTalentComputing.cline-chinese)
[![Downloads](https://img.shields.io/visual-studio-marketplace/d/HybridTalentComputing.cline-chinese)](https://marketplace.visualstudio.com/items?itemName=HybridTalentComputing.cline-chinese)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/HybridTalentComputing.cline-chinese)](https://marketplace.visualstudio.com/items?itemName=HybridTalentComputing.cline-chinese)

## 简介

这个项目是基于 [Cline](https://github.com/cline/cline) 的汉化版本。旨在优化由于英文 prompt 导致 Cline 在中文输入下+国产大模型（如：deepseek）表现不佳的问题, 并提供更符合中文用户习惯的UI界面和功能。目前已测试[DeepSeek-R1/DeepSeek-V3](https://github.com/deepseek-ai/DeepSeek-R1)工作良好。

日常使用cline等编程助手时发现使用某些模型推理速度较慢（如deepseek-R1, Claude-3.5-Sonnet），这个项目优先尝试在中文输入下，对轻量化LLM进行实验（如Deepseek-R1-Distill-Qwen-7B/14B），优化中文prompt, 以提升推理速度，大大减少等待的时间，目前仍在尝试中，如果有小伙伴已经试验出一套优质的中文prompt，欢迎提交PR或issue。

## 背景

本人是一名AI爱好者+从业者，在使用Cline时，发现Cline的UI界面和提示词均为英文，使用中文输入时，有时会出现奇奇怪怪的输出，影响体验。因此，决定自己动手，汉化Cline。
另外，秉着学习的态度，未来将着手修改Cline的核心代码，增加新的功能，以提升体验。

## 版本说明

- 首个版本基于Cline 3.2.13 版本进行汉化，没有对cline核心代码进行任何修改，以保证原滋原味的cline体验。
- 未来cline主仓更新后，会及时同步到本项目中。且版本号与Cline对于版本号保持一致。
- 本着学习的态度，这个仓库会长期维护，并持续更新。

## 安装使用

Cline-Chinese已发布到VSCode插件市场，欢迎感兴趣的小伙伴们下载体验。

## 反馈与贡献

如果您在使用过程中遇到任何问题，或有任何建议，欢迎：

- 提交 [Issue](https://github.com/HybridTalentComputing/cline-chinese/issues)
- 提交 [Pull Request](https://github.com/HybridTalentComputing/cline-chinese/pulls)

---

> 注：本项目是个人维护的汉化版本，与原版 Cline 团队无关。如果您喜欢这个项目，也请给原版 [Cline](https://github.com/cline/cline) 一个 star ⭐️

## 免责声明

1. **使用风险**：本项目是一个开源的VSCode插件，用户在使用过程中可能会遇到的任何问题或风险，开发者不承担任何责任。

2. **数据安全**：本插件不会收集或存储任何用户数据。但在使用过程中，用户应注意保护自己的敏感信息和代码安全。

3. **知识产权**：
   - 本项目是基于Cline的汉化版本，原版权归属于Cline团队。
   - 汉化部分的内容采用与原版Cline相同的Apache-2.0许可证。
   - 用户在使用过程中应遵守相关的开源协议。

4. **免责声明**：
   - 本项目不提供任何明示或暗示的保证，包括但不限于适销性和特定用途适用性的保证。
   - 开发者不对任何直接或间接损失负责，包括但不限于利润损失、数据丢失等。
   - 用户使用本插件即表示同意承担使用过程中的所有风险。

5. **更新和维护**：
   - 开发者将努力维护本项目，但不保证及时更新或修复所有问题。
   - 本项目可能随时变更或终止，会及时同步到本项目中。





