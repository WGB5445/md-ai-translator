import { CONFIG } from "./config.js";
import type { ProcessOptions, TranslationResult } from "./types.ts";
import { OpenAI } from "openai";

/**
 * Utility functions for the MD AI Translator
 */

/**
 * Sleep for a specified number of milliseconds
 * @param ms Milliseconds to sleep
 */
export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Check if a file has markdown extension
 * @param filename File name to check
 */
export const isMarkdownFile = (filename: string): boolean => {
  const lowerCaseFilename = filename.toLowerCase();
  return (
    lowerCaseFilename.endsWith(".md") || lowerCaseFilename.endsWith(".mdx")
  );
};

/**
 * Format a file path for logging
 * @param path File path to format
 */
export const formatPath = (path: string): string => {
  return path.replace(/\\/g, "/");
};

export const splitContent = (content: string, chunkSize: number): string[] => {
  const chunks: string[] = [];
  let remaining = content;

  while (remaining.length > 0) {
    let chunk = remaining.slice(0, chunkSize);

    // 优先在代码块边界分割
    const lastCodeBlock = chunk.lastIndexOf("```");
    if (lastCodeBlock > 0 && remaining.length > chunkSize) {
      const endOfBlock = remaining.indexOf("\n```", lastCodeBlock + 3);
      if (endOfBlock !== -1) {
        chunk = remaining.slice(0, endOfBlock + 4);
      }
    }
    // 其次在段落边界分割
    else {
      const lastParagraph = chunk.lastIndexOf("\n\n");
      if (lastParagraph > 0) {
        chunk = remaining.slice(0, lastParagraph + 2);
      }
    }

    chunks.push(chunk);
    remaining = remaining.slice(chunk.length);
  }

  return chunks;
};

export const translateChunk = async (
  chunk: string,
  options: ProcessOptions,
  openai: OpenAI,
): Promise<TranslationResult> => {
  try {
    const response = await openai.chat.completions.create({
      model: options.model,
      messages: [
        { role: "system", content: CONFIG.SYSTEM_PROMPT },
        {
          role: "user",
          content: `请严格遵循系统指示翻译以下内容：\n\n${chunk}`,
        },
      ],
      temperature: options.temperature,
      max_tokens: CONFIG.MAX_TOKENS,
    });

    return {
      success: true,
      content: response.choices[0]?.message?.content || chunk,
    };
  } catch (error: unknown) {
    const err = error as Error;
    return {
      success: false,
      error: `翻译失败: ${err.message}`,
    };
  }
};
