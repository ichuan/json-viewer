export interface ParsedJsonResult {
  success: boolean;
  data: any;
  error?: string;
  isJsonLines?: boolean;
}

/**
 * Safely handle escape characters, primarily processing newlines from Python logs while preserving escapes within JSON strings
 */
function safeHandleEscapes(jsonString: string): string {
  // First check if this string looks like valid JSON
  const trimmed = jsonString.trim();
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    // Try to parse directly, if successful no escape handling is needed
    try {
      JSON.parse(trimmed);
      return trimmed; // Return as-is if parsing succeeds
    } catch (e) {
      // Parsing failed, continue with processing
    }
  }

  // Only handle obvious Python log escapes (actual newlines, not within strings)
  let result = jsonString;

  // Only handle newlines at line start/end, not within strings
  result = result.replace(/\r?\n/g, ' ');

  return result;
}

/**
 * Attempt to fix incomplete JSON strings
 */
function attemptJsonFix(jsonString: string): string {
  let fixed = jsonString.trim();

  // Remove comments
  fixed = fixed.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

  // Use safe method to handle escape characters
  fixed = safeHandleEscapes(fixed);

  // Remove trailing commas
  fixed = fixed.replace(/,\s*([}\]])/g, '$1');

  // Fix unquoted keys
  fixed = fixed.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');

  // Only attempt to fix single quotes to double quotes when needed (more conservative approach)
  // Check if it might contain single-quoted strings (not single quotes within JSON strings)
  if (!fixed.includes('"') && (fixed.includes("'") || fixed.includes("'") || fixed.includes("'"))) {
    // Looks like JSON wrapped in single quotes, try to fix
    fixed = fixed.replace(/'/g, '"');
  }

  return fixed;
}

/**
 * Try to reconstruct JSON Lines from terminal-wrapped output
 * Terminal output often wraps long lines and pads with spaces
 */
function reconstructTerminalWrappedJsonLines(jsonString: string): string[] | null {
  const lines = jsonString.split(/\r?\n/);
  if (lines.length < 2) return null;

  const reconstructed: string[] = [];
  let currentJson = '';

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Check if this line starts a new JSON object
    if (trimmedLine.startsWith('{') && currentJson === '') {
      currentJson = trimmedLine;
    } else if (trimmedLine.startsWith('{') && currentJson !== '') {
      // New JSON object starts, save the previous one
      const merged = currentJson.replace(/\s+/g, ' ').trim();
      if (merged.endsWith('}')) {
        reconstructed.push(merged);
      }
      currentJson = trimmedLine;
    } else if (currentJson !== '') {
      // Continue appending to current JSON
      currentJson += trimmedLine;
    }
  }

  // Don't forget the last one
  if (currentJson) {
    const merged = currentJson.replace(/\s+/g, ' ').trim();
    if (merged.endsWith('}')) {
      reconstructed.push(merged);
    }
  }

  // Validate: check if we got valid JSON objects
  if (reconstructed.length === 0) return null;

  // Quick validation: try to parse first and last
  try {
    JSON.parse(reconstructed[0]);
    if (reconstructed.length > 1) {
      JSON.parse(reconstructed[reconstructed.length - 1]);
    }
    return reconstructed;
  } catch {
    return null;
  }
}

/**
 * Clean and process raw JSON Lines data copied from Python logs
 */
function cleanRawJsonLines(jsonString: string): string[] {
  // First try to reconstruct terminal-wrapped JSON Lines
  const terminalWrapped = reconstructTerminalWrappedJsonLines(jsonString);
  if (terminalWrapped && terminalWrapped.length > 0) {
    return terminalWrapped;
  }

  // First try to split by actual newlines
  let lines = jsonString.split(/\r?\n/);
  let cleanedLines: string[] = [];

  // If only one line and contains escaped newlines, split by escaped newlines
  if (lines.length === 1 && jsonString.includes('\\n')) {
    // Handle case where single line contains multiple JSON objects (like example_json.txt)
    const singleLine = lines[0].trim();

    // Split by literal \n, but be careful not to split \n within JSON strings
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

      // If not within string and encounter \n, split here
      if (!inString && char === '\\' && i + 1 < singleLine.length && singleLine[i + 1] === 'n') {
        if (current.trim()) {
          jsonArray.push(current.trim());
        }
        current = '';
        i++; // Skip 'n'
        continue;
      }

      current += char;
    }

    if (current.trim()) {
      jsonArray.push(current.trim());
    }

    // Now process each extracted line
    for (const jsonLine of jsonArray) {
      const processedLines = processJsonLine(jsonLine);
      cleanedLines.push(...processedLines);
    }
  } else {
    // Handle multi-line case
    for (const line of lines) {
      const processedLines = processJsonLine(line);
      cleanedLines.push(...processedLines);
    }
  }

  return cleanedLines.filter(line => line.length > 0);
}

/**
 * Process individual JSON line
 */
function processJsonLine(line: string): string[] {
  line = line.trim();
  if (!line) return [];

  // If line starts with number (like "1→" in file), remove line number prefix
  line = line.replace(/^\d+→/, '');

  // If line contains multiple JSON objects (possibly due to log format issues), try to split
  if (line.includes('}{')) {
    // Insert newline between }{
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
    // Ensure line starts with { or [
    if ((line.startsWith('{') && line.endsWith('}')) ||
        (line.startsWith('[') && line.endsWith(']'))) {
      return [line];
    } else if (line.includes('{') && line.includes('}')) {
      // Try to extract JSON part from the line
      const match = line.match(/(\{.*\})/);
      if (match) {
        return [match[1]];
      }
    }
  }

  return [];
}

/**
 * Parse JSON Lines format data
 */
function parseJsonLines(jsonString: string): ParsedJsonResult {
  try {
    // First try using cleaning function to process raw data
    const cleanedLines = cleanRawJsonLines(jsonString);

    // If cleaning succeeds, use cleaned lines
    if (cleanedLines.length > 0) {
      const parsedLines = [];
      for (const line of cleanedLines) {
        try {
          const fixedLine = attemptJsonFix(line);
          const parsed = JSON.parse(fixedLine);
          parsedLines.push(parsed);
        } catch (lineError) {
          // If a line fails to parse, log but continue processing other lines
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

    // If cleaning fails, fallback to original method
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
          // Try stronger fix logic
          try {
            // Remove possible prefix
            let cleanLine = trimmedLine.replace(/^\d+→/, '');
            // Extract JSON part
            const jsonMatch = cleanLine.match(/(\{[^{}]*\})/);
            if (jsonMatch) {
              const fixedLine = attemptJsonFix(jsonMatch[1]);
              const parsed = JSON.parse(fixedLine);
              parsedLines.push(parsed);
            }
          } catch (fallbackError) {
            // If still fails, skip this line
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
      error: `JSON Lines parsing failed: Could not successfully parse any JSON lines`
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: `JSON Lines parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Parse regular JSON format data
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
      error: `JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Extract all possible JSON objects from text (lenient mode)
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
          // If there was previous non-empty content, clear current
          current = '';
        }
        braceCount++;
        current += char;
      } else if (char === '}') {
        braceCount--;
        current += char;

        if (braceCount === 0 && bracketCount === 0) {
          // Found complete JSON object
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
          // Found complete JSON array
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
 * Smart parse JSON data, supporting both JSON and JSON Lines formats
 */
export function parseJson(input: string): ParsedJsonResult {
  if (!input || !input.trim()) {
    return {
      success: false,
      data: null,
      error: 'Input cannot be empty'
    };
  }

  const trimmedInput = input.trim();

  // First try regular JSON (prioritize single object)
  const regularJsonResult = parseRegularJson(trimmedInput);
  if (regularJsonResult.success) {
    return regularJsonResult;
  }

  // Try to extract JSON objects (lenient mode)
  const extractedObjects = extractJsonObjects(trimmedInput);
  if (extractedObjects.length > 0) {
    const parsedObjects = [];

    for (const jsonObj of extractedObjects) {
      try {
        const fixed = attemptJsonFix(jsonObj);
        const parsed = JSON.parse(fixed);
        parsedObjects.push(parsed);
      } catch (error) {
        // Skip objects that cannot be parsed
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

  // Check if it's JSON Lines format
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
    error: 'Unable to parse input, please check if JSON format is correct'
  };
}
