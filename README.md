# MD AI Translator

一个使用 AI 技术翻译 Markdown/MDX 文档的命令行工具。

*Read this in [English](#md-ai-translator-1)*

## 📖 简介

MD AI Translator 是一个专为技术文档设计的翻译工具，它利用 OpenAI API 来翻译 Markdown 和 MDX 文件，同时保留原始文档的格式和结构，确保代码块、标签和专业术语不被错误翻译。

## ✨ 特性

- 保留代码块、HTML/JSX 标签、URL 和 Markdown 语法
- 保持文档格式完整，包括空格、换行和缩进
- 支持批量处理整个目录
- 可配置的 AI 模型参数
- 智能分块处理大文档
- 自动重试失败的翻译任务

## 🚀 安装

确保你已安装 Node.js（>= 22.0.0）:

```bash
# 使用 npm 安装
npm install -g md-ai-translator

# 或使用 yarn
yarn global add md-ai-translator

# 或使用 pnpm
pnpm add -g md-ai-translator
```

## 🛠️ 使用方法

```bash
# 基本用法
md-ai-translator -i ./input-folder -o ./output-folder

# 使用自定义配置
md-ai-translator -i ./input-folder -o ./output-folder --model gpt-4-turbo --temperature 1.2 --chunk-size 4000

# 使用 API 参数
md-ai-translator -i ./input-folder -o ./output-folder --apikey YOUR_API_KEY --url https://custom-api-endpoint.com/v1
```

### 命令行参数

| 参数 | 描述 | 默认值 |
|------|------|--------|
| `-i, --input <dir>` | 输入目录（必需） | - |
| `-o, --output <dir>` | 输出目录（必需） | - |
| `--model <model>` | AI 模型 | gpt-4-1106-preview |
| `--temperature <number>` | 生成温度 (0-2) | 1.3 |
| `--chunk-size <number>` | 分块大小 | 3000 |
| `--apikey <key>` | OpenAI API 密钥 | 从环境变量获取 |
| `--url <url>` | OpenAI API 基础 URL | https://api.openai.com/v1 |

## ⚙️ 配置

你可以通过 `.env` 文件设置默认参数：

```properties
OPENAI_API_KEY=your_api_key_here
OPENAI_API_BASE_URL=https://api.openai.com/v1
```

## 📄 许可证

MIT

---

# MD AI Translator

A command-line tool that uses AI to translate Markdown/MDX documents.

## 📖 Introduction

MD AI Translator is a translation tool specifically designed for technical documentation. It uses the OpenAI API to translate Markdown and MDX files while preserving the original document's format and structure, ensuring that code blocks, tags, and technical terms are not incorrectly translated.

## ✨ Features

- Preserves code blocks, HTML/JSX tags, URLs, and Markdown syntax
- Maintains complete document formatting, including spaces, line breaks, and indentation
- Supports batch processing of entire directories
- Configurable AI model parameters
- Intelligent chunking for large documents
- Automatic retry of failed translation tasks

## 🚀 Installation

Ensure you have Node.js (>= 22.0.0) installed:

```bash
# Install using npm
npm install -g md-ai-translator

# Or using yarn
yarn global add md-ai-translator

# Or using pnpm
pnpm add -g md-ai-translator
```

## 🛠️ Usage

```bash
# Basic usage
md-ai-translator -i ./input-folder -o ./output-folder

# With custom configuration
md-ai-translator -i ./input-folder -o ./output-folder --model gpt-4-turbo --temperature 1.2 --chunk-size 4000

# With API parameters
md-ai-translator -i ./input-folder -o ./output-folder --apikey YOUR_API_KEY --url https://custom-api-endpoint.com/v1
```

### Command-line Arguments

| Argument | Description | Default |
|----------|-------------|---------|
| `-i, --input <dir>` | Input directory (required) | - |
| `-o, --output <dir>` | Output directory (required) | - |
| `--model <model>` | AI model | gpt-4-1106-preview |
| `--temperature <number>` | Generation temperature (0-2) | 1.3 |
| `--chunk-size <number>` | Chunk size | 3000 |
| `--apikey <key>` | OpenAI API key | From environment variable |
| `--url <url>` | OpenAI API base URL | https://api.openai.com/v1 |

## ⚙️ Configuration

You can set default parameters using a `.env` file:

```properties
OPENAI_API_KEY=your_api_key_here
OPENAI_API_BASE_URL=https://api.openai.com/v1
```

## 📄 License

MIT
