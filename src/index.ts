#!/usr/bin/env node
import path from "path";
import { fileURLToPath } from "url";
import { OpenAI } from "openai";
import { program } from "commander";
import chalk from "chalk";
import dotenv from "dotenv";
import fs from "fs-extra";
import readline from "readline";
import { splitContent, translateChunk } from "./utils.js";
import { ProcessOptions, TranslationResult } from "./types";
import { CONFIG } from "./config.js";

/**
 * 延迟函数
 * @param ms 毫秒数
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 用户确认函数
 * @param message 提示信息
 * @returns 是否确认
 */
const confirmAction = async (message: string): Promise<boolean> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (Y/N, 默认N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y");
    });
  });
};

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
      const inputPath = path.resolve(options.input);
      const outputPath = path.resolve(options.output);
      const processingOptions = {
        model: options.model,
        temperature: options.temperature,
        chunkSize: options.chunkSize,
      };

      // 检查输入路径是否存在
      if (!await fs.pathExists(inputPath)) {
        console.error(chalk.red(`错误: 输入路径不存在: ${inputPath}`));
        process.exit(1);
      }

      // 检查输入路径是文件还是目录
      const stats = await fs.stat(inputPath);
      
      // 检查输出路径与输入路径类型是否匹配
      if (await fs.pathExists(outputPath)) {
        const outputStats = await fs.stat(outputPath);
        
        if (stats.isFile() && outputStats.isDirectory()) {
          console.error(chalk.red(`错误: 输入是文件但输出是目录`));
          process.exit(1);
        }
        
        if (stats.isDirectory() && !outputStats.isDirectory()) {
          console.error(chalk.red(`错误: 输入是目录但输出不是目录`));
          process.exit(1);
        }
      }

      if (stats.isFile()) {
        // 处理单个文件
        const ext = path.extname(inputPath);
        if (ext !== ".md" && ext !== ".mdx") {
          console.error(chalk.red("错误: 输入文件必须是 .md 或 .mdx 格式"));
          process.exit(1);
        }

        console.log(chalk.blue(`将处理以下文件:`));
        console.log(chalk.gray(`输入: ${inputPath}`));
        console.log(chalk.gray(`输出: ${outputPath}`));

        const confirmed = await confirmAction("是否继续?");
        if (!confirmed) {
          console.log(chalk.yellow("操作已取消"));
          process.exit(0);
        }

        console.log(chalk.blue("🚀 开始翻译处理..."));
        await processFile(inputPath, outputPath, processingOptions, openai);
        console.log(chalk.green("\n✅ 文件处理完成！"));
      } else if (stats.isDirectory()) {
        // 处理目录
        console.log(chalk.blue("🚀 开始扫描目录..."));
        const completed = await processDirectory(inputPath, outputPath, processingOptions, openai);
        if (completed) {
          console.log(chalk.green("\n✅ 全部文件处理完成！"));
        }
      } else {
        console.error(chalk.red("错误: 输入路径不是有效的文件或目录"));
        process.exit(1);
      }
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
): Promise<boolean> {
  try {
    const filesToProcess: { input: string; output: string }[] = [];
    
    // 递归收集所有要处理的文件
    async function collectFiles(currentInputDir: string, currentOutputDir: string) {
      const files = await fs.readdir(currentInputDir);
      
      for (const file of files) {
        const inputFilePath = path.join(currentInputDir, file);
        const outputFilePath = path.join(currentOutputDir, file);
        
        const stats = await fs.stat(inputFilePath);
        
        if (stats.isDirectory()) {
          await collectFiles(inputFilePath, outputFilePath);
        } else if (
          stats.isFile() &&
          (path.extname(file) === ".mdx" || path.extname(file) === ".md")
        ) {
          filesToProcess.push({
            input: inputFilePath,
            output: outputFilePath,
          });
        }
      }
    }
    
    await collectFiles(inputDir, outputDir);
    
    // 显示所有要处理的文件并请求确认
    if (filesToProcess.length === 0) {
      console.log(chalk.yellow("没有找到可处理的 .md 或 .mdx 文件"));
      return false;
    }
    
    console.log(chalk.blue(`找到 ${filesToProcess.length} 个要处理的文件:`));
    filesToProcess.forEach((file, index) => {
      console.log(chalk.gray(`${index + 1}. ${file.input}`));
    });
    
    const confirmed = await confirmAction("是否继续处理上述文件?");
    if (!confirmed) {
      console.log(chalk.yellow("操作已取消"));
      return false;
    }
    
    // 处理所有确认的文件
    for (const file of filesToProcess) {
      console.log(chalk.blue(`处理文件: ${file.input}`));
      await processFile(file.input, file.output, options, openaiClient);
    }
    
    return true;
  } catch (error) {
    console.error(chalk.red(`处理目录时出错: ${(error as Error).message}`));
    throw error;
  }
}
