import ChatCompletionMessageParam from "openai";

export interface ProcessOptions {
  model: string;
  temperature: number;
  chunkSize: number;
}

export interface ContentChunk {
  text: string;
  isCodeBlock: boolean;
}

export type TranslationResult = {
  success: boolean;
  content?: string;
  error?: string;
};

export type TranslationTask = {
  chunk: string;
  retries: number;
  messages: ChatCompletionMessageParam[];
};
