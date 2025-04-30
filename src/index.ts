#!/usr/bin/env node
import path from "path";
import { fileURLToPath } from "url";
import { OpenAI } from "openai";
import { program } from "commander";
import chalk from "chalk";
import dotenv from "dotenv";
import fs from "fs-extra";
import { splitContent, translateChunk } from "./utils.js";
import { ProcessOptions, TranslationResult } from "./types";
import { CONFIG } from "./config.js";

/**
 * 延迟函数
 * @param ms 毫秒数
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 初始化环境
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// 主处理函数
const processFile = async (
  inputPath: string,
  outputPath: string,
  options: ProcessOptions,
  openaiClient: OpenAI,
) => {
  try {
    const content = await fs.readFile(inputPath, "utf8");
    const chunks = splitContent(content, options.chunkSize);
    let translated = "";

    for (const [index, chunk] of chunks.entries()) {
      process.stdout.write(
        chalk.gray(`  处理块 ${index + 1}/${chunks.length}... `),
      );

      let result: TranslationResult;
      let retries = 0;

      do {
        result = await translateChunk(chunk, options, openaiClient);
        if (!result.success) {
          await delay(CONFIG.RETRY_DELAY * ++retries);
        }
      } while (!result.success && retries < CONFIG.MAX_RETRIES);

      if (result.success) {
        translated += result.content!;
        process.stdout.write(chalk.green("✓\n"));
      } else {
        process.stdout.write(chalk.red("✗\n"));
        throw new Error(result.error);
      }
    }

    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, translated, "utf8");
  } catch (error) {
    console.error(chalk.red(`\n❌ 文件处理失败: ${(error as Error).message}`));
    process.exit(1);
  }
};

// CLI 配置
program
  .name("mdx-ai-translator")
  .description("MDX 文件AI翻译工具")
  .version("1.0.0")
  .requiredOption("-i, --input <dir>", "输入目录")
  .requiredOption("-o, --output <dir>", "输出目录")
  .option(
    "--model <model>",
    `AI模型 (默认: ${CONFIG.DEFAULT_MODEL})`,
    CONFIG.DEFAULT_MODEL,
  )
  .option(
    "--temperature <number>",
    "生成温度 (0-2)",
    parseFloat,
    CONFIG.DEFAULT_TEMPERATURE,
  )
  .option(
    "--chunk-size <number>",
    "分块大小",
    parseInt,
    CONFIG.DEFAULT_CHUNK_SIZE,
  )
  .option("--apikey <key>", "OpenAI API Key (替代 OPENAI_API_KEY 环境变量)")
  .option(
    "--url <url>",
    "OpenAI API Base URL (替代 OPENAI_API_BASE_URL 环境变量)",
  )
  .action(async (options) => {
    const apiKey = options.apikey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error(
        chalk.red(
          "错误: 需要通过 --apikey 参数或 OPENAI_API_KEY 环境变量设置 API Key",
        ),
      );
      process.exit(1);
    }

    // 初始化 OpenAI
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL:
        options.url ||
        process.env.OPENAI_API_BASE_URL ||
        "https://api.openai.com/v1",
    });

    try {
      console.log(chalk.blue("🚀 开始翻译处理..."));
      await processDirectory(
        path.resolve(options.input),
        path.resolve(options.output),
        {
          model: options.model,
          temperature: options.temperature,
          chunkSize: options.chunkSize,
        },
        openai,
      );
      console.log(chalk.green("\n✅ 全部文件处理完成！"));
    } catch (error) {
      console.error(chalk.red("\n❌ 处理失败:"), error);
      process.exit(1);
    }
  });

// 启动程序
program.parseAsync(process.argv).catch((error) => {
  console.error(chalk.red("未捕获的错误:"), error);
  process.exit(1);
});

async function processDirectory(
  inputDir: string,
  outputDir: string,
  options: { model: string; temperature: number; chunkSize: number },
  openaiClient: OpenAI,
) {
  try {
    const files = await fs.readdir(inputDir);

    for (const file of files) {
      const inputFilePath = path.join(inputDir, file);
      const outputFilePath = path.join(outputDir, file);

      const stats = await fs.stat(inputFilePath);

      if (stats.isDirectory()) {
        await processDirectory(
          inputFilePath,
          outputFilePath,
          options,
          openaiClient,
        );
      } else if (
        stats.isFile() &&
        (path.extname(file) === ".mdx" || path.extname(file) === ".md")
      ) {
        console.log(chalk.blue(`处理文件: ${inputFilePath}`));
        await processFile(inputFilePath, outputFilePath, options, openaiClient);
      }
    }
  } catch (error) {
    console.error(chalk.red(`处理目录时出错: ${(error as Error).message}`));
    throw error;
  }
}
