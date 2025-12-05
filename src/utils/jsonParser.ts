export interface ParsedJsonResult {
  success: boolean;
  data: any;
  error?: string;
  isJsonLines?: boolean;
}

/**
 * 安全处理转义字符，主要处理 Python 日志中的换行符，保持 JSON 字符串内的转义不变
 */
function safeHandleEscapes(jsonString: string): string {
  // 首先检查这个字符串是否看起来像有效的 JSON
  const trimmed = jsonString.trim();
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    // 尝试直接解析，如果成功就不需要处理转义
    try {
      JSON.parse(trimmed);
      return trimmed; // 如果解析成功，返回原样
    } catch (e) {
      // 解析失败，继续处理
    }
  }

  // 只处理明显的 Python 日志转义（真实的换行符，而不是字符串内的）
  let result = jsonString;

  // 只处理行尾和行首的换行符，不处理字符串内的
  result = result.replace(/\r?\n/g, ' ');

  return result;
}

/**
 * 尝试修复不完整的 JSON 字符串
 */
function attemptJsonFix(jsonString: string): string {
  let fixed = jsonString.trim();

  // 移除注释
  fixed = fixed.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

  // 使用安全的方法处理转义字符
  fixed = safeHandleEscapes(fixed);

  // 移除尾随逗号
  fixed = fixed.replace(/,\s*([}\]])/g, '$1');

  // 修复未引用的键名
  fixed = fixed.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');

  // 只有在需要时才尝试修复单引号为双引号（更保守的方法）
  // 检查是否可能包含单引号包围的字符串（而非JSON字符串内的单引号）
  if (!fixed.includes('"') && (fixed.includes("'") || fixed.includes("‘") || fixed.includes("’"))) {
    // 看起来像是用单引号包围的JSON，尝试修复
    fixed = fixed.replace(/'/g, '"');
  }

  return fixed;
}

/**
 * 清理和处理从 Python 日志拷贝的原始 JSON Lines 数据
 */
function cleanRawJsonLines(jsonString: string): string[] {
  // 首先尝试按实际换行符分割
  let lines = jsonString.split(/\r?\n/);
  let cleanedLines: string[] = [];

  // 如果只有一行，并且包含转义的换行符，按转义的换行符分割
  if (lines.length === 1 && jsonString.includes('\\n')) {
    // 处理单行中包含多个 JSON 对象的情况（如你的 example_json.txt）
    const singleLine = lines[0].trim();

    // 按字面值的 \n 分割，但要注意不要分割 JSON 字符串内的 \n
    let jsonArray: string[] = [];
    let current = '';
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < singleLine.length; i++) {
      const char = singleLine[i];

      if (escapeNext) {
        current += char;
        escapeNext = false;
        continue;
      }

      if (char === '\\') {
        escapeNext = true;
        current += char;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        current += char;
        continue;
      }

      // 如果不在字符串内，遇到 \n 就分割
      if (!inString && char === '\\' && i + 1 < singleLine.length && singleLine[i + 1] === 'n') {
        if (current.trim()) {
          jsonArray.push(current.trim());
        }
        current = '';
        i++; // 跳过 'n'
        continue;
      }

      current += char;
    }

    if (current.trim()) {
      jsonArray.push(current.trim());
    }

    // 现在处理提取出的每一行
    for (const jsonLine of jsonArray) {
      const processedLines = processJsonLine(jsonLine);
      cleanedLines.push(...processedLines);
    }
  } else {
    // 处理多行情况
    for (const line of lines) {
      const processedLines = processJsonLine(line);
      cleanedLines.push(...processedLines);
    }
  }

  return cleanedLines.filter(line => line.length > 0);
}

/**
 * 处理单个 JSON 行
 */
function processJsonLine(line: string): string[] {
  line = line.trim();
  if (!line) return [];

  // 如果行以数字开头（像文件中的 "1→"），移除行号前缀
  line = line.replace(/^\d+→/, '');

  // 如果行包含多个 JSON 对象（可能由于日志格式问题），尝试分割
  if (line.includes('}{')) {
    // 在 }{ 之间插入换行符
    line = line.replace(/}{/g, '}\n{');
    const subLines = line.split('\n');
    const result: string[] = [];
    for (const subLine of subLines) {
      const trimmed = subLine.trim();
      if (trimmed && (trimmed.startsWith('{') || trimmed.startsWith('['))) {
        result.push(trimmed);
      }
    }
    return result;
  } else {
    // 确保行以 { 或 [ 开始
    if ((line.startsWith('{') && line.endsWith('}')) ||
        (line.startsWith('[') && line.endsWith(']'))) {
      return [line];
    } else if (line.includes('{') && line.includes('}')) {
      // 尝试提取行中的 JSON 部分
      const match = line.match(/(\{.*\})/);
      if (match) {
        return [match[1]];
      }
    }
  }

  return [];
}

/**
 * 解析 JSON Lines 格式的数据
 */
function parseJsonLines(jsonString: string): ParsedJsonResult {
  try {
    // 首先尝试使用清理函数处理原始数据
    const cleanedLines = cleanRawJsonLines(jsonString);

    // 如果清理成功，使用清理后的行
    if (cleanedLines.length > 0) {
      const parsedLines = [];
      for (const line of cleanedLines) {
        try {
          const fixedLine = attemptJsonFix(line);
          const parsed = JSON.parse(fixedLine);
          parsedLines.push(parsed);
        } catch (lineError) {
          // 如果某一行解析失败，记录但继续处理其他行
          console.warn('Failed to parse line:', line, lineError);
        }
      }

      if (parsedLines.length > 0) {
        return {
          success: true,
          data: parsedLines,
          isJsonLines: true
        };
      }
    }

    // 如果清理失败，回退到原始方法
    const lines = jsonString.trim().split('\n').filter(line => line.trim());
    const parsedLines = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        try {
          const fixedLine = attemptJsonFix(trimmedLine);
          const parsed = JSON.parse(fixedLine);
          parsedLines.push(parsed);
        } catch (lineError) {
          // 尝试更强的修复逻辑
          try {
            // 移除可能的前缀
            let cleanLine = trimmedLine.replace(/^\d+→/, '');
            // 提取 JSON 部分
            const jsonMatch = cleanLine.match(/(\{[^{}]*\})/);
            if (jsonMatch) {
              const fixedLine = attemptJsonFix(jsonMatch[1]);
              const parsed = JSON.parse(fixedLine);
              parsedLines.push(parsed);
            }
          } catch (fallbackError) {
            // 如果还是失败，跳过这一行
          }
        }
      }
    }

    if (parsedLines.length > 0) {
      return {
        success: true,
        data: parsedLines,
        isJsonLines: true
      };
    }

    return {
      success: false,
      data: null,
      error: `JSON Lines 解析失败: 未能成功解析任何 JSON 行`
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: `JSON Lines 解析失败: ${error instanceof Error ? error.message : '未知错误'}`
    };
  }
}

/**
 * 解析普通 JSON 格式的数据
 */
function parseRegularJson(jsonString: string): ParsedJsonResult {
  try {
    const fixedJson = attemptJsonFix(jsonString);
    const parsed = JSON.parse(fixedJson);

    return {
      success: true,
      data: parsed,
      isJsonLines: false
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: `JSON 解析失败: ${error instanceof Error ? error.message : '未知错误'}`
    };
  }
}

/**
 * 从文本中提取所有可能的 JSON 对象（宽松模式）
 */
function extractJsonObjects(text: string): string[] {
  const jsonObjects: string[] = [];
  let current = '';
  let braceCount = 0;
  let bracketCount = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (escapeNext) {
      current += char;
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      current += char;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      current += char;
      continue;
    }

    if (!inString) {
      if (char === '{') {
        if (braceCount === 0 && bracketCount === 0 && current.trim()) {
          // 如果之前有非空内容，清空当前
          current = '';
        }
        braceCount++;
        current += char;
      } else if (char === '}') {
        braceCount--;
        current += char;

        if (braceCount === 0 && bracketCount === 0) {
          // 找到完整的 JSON 对象
          const trimmed = current.trim();
          if (trimmed && (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
            jsonObjects.push(trimmed);
          }
          current = '';
        }
      } else if (char === '[') {
        if (braceCount === 0 && bracketCount === 0 && current.trim()) {
          current = '';
        }
        bracketCount++;
        current += char;
      } else if (char === ']') {
        bracketCount--;
        current += char;

        if (braceCount === 0 && bracketCount === 0) {
          // 找到完整的 JSON 数组
          const trimmed = current.trim();
          if (trimmed && (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
            jsonObjects.push(trimmed);
          }
          current = '';
        }
      } else if (braceCount > 0 || bracketCount > 0) {
        current += char;
      }
    } else {
      current += char;
    }
  }

  return jsonObjects;
}

/**
 * 智能解析 JSON 数据，支持 JSON 和 JSON Lines 格式
 */
export function parseJson(input: string): ParsedJsonResult {
  if (!input || !input.trim()) {
    return {
      success: false,
      data: null,
      error: '输入不能为空'
    };
  }

  const trimmedInput = input.trim();

  // 首先尝试普通 JSON（优先单个对象）
  const regularJsonResult = parseRegularJson(trimmedInput);
  if (regularJsonResult.success) {
    return regularJsonResult;
  }

  // 尝试提取 JSON 对象（宽松模式）
  const extractedObjects = extractJsonObjects(trimmedInput);
  if (extractedObjects.length > 0) {
    const parsedObjects = [];

    for (const jsonObj of extractedObjects) {
      try {
        const fixed = attemptJsonFix(jsonObj);
        const parsed = JSON.parse(fixed);
        parsedObjects.push(parsed);
      } catch (error) {
        // 跳过无法解析的对象
        console.warn('Failed to parse extracted JSON:', jsonObj.substring(0, 100));
      }
    }

    if (parsedObjects.length > 0) {
      return {
        success: true,
        data: parsedObjects.length === 1 ? parsedObjects[0] : parsedObjects,
        isJsonLines: parsedObjects.length > 1
      };
    }
  }

  // 检查是否是 JSON Lines 格式
  const lines = trimmedInput.split('\n').filter(line => line.trim());
  if (lines.length > 1) {
    const jsonLinesResult = parseJsonLines(trimmedInput);
    if (jsonLinesResult.success) {
      return jsonLinesResult;
    }
  }

  return {
    success: false,
    data: null,
    error: '无法解析输入，请检查 JSON 格式是否正确'
  };
}