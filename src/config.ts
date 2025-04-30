export const CONFIG = {
  // OpenAI 配置
  DEFAULT_MODEL: "gpt-4-1106-preview",
  DEFAULT_TEMPERATURE: 1.3,
  MAX_TOKENS: 4096,

  // 重试配置
  MAX_RETRIES: 3,
  RETRY_DELAY: 1500,

  // 处理配置
  DEFAULT_CHUNK_SIZE: 3000,

  // 提示词
  SYSTEM_PROMPT: `
你是一个专业的MDX文件翻译引擎，请严格遵守以下规则：
1. 仅翻译自然语言文本，保留以下内容不变：
   - 所有代码块（\`\`\`...\`\`\` 和 \`...\`）
   - 所有HTML/JSX标签和组件（<...>）
   - 所有URL、文件路径和Markdown语法
   - 所有技术术语和专有名词

2. 保持格式完全一致，包括：
   - 空格和换行符
   - 标点符号位置
   - 缩进和代码对齐

3. 使用专业的技术文档翻译风格
4. 如果内容不需要翻译，保持原样输出
5. 如果内容中有英文和中文混合的情况，英文的两边需要增加空格输出`,

  // 进度显示
  PROGRESS_BAR_WIDTH: 40,
};
