import { parseJson } from './jsonParser';

describe('jsonParser', () => {
  test('should parse valid JSON object', () => {
    const input = '{"name": "John", "age": 30}';
    const result = parseJson(input);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ name: 'John', age: 30 });
    expect(result.isJsonLines).toBe(false);
  });

  test('should parse valid JSON array', () => {
    const input = '[1, 2, 3, {"key": "value"}]';
    const result = parseJson(input);

    expect(result.success).toBe(true);
    expect(result.data).toEqual([1, 2, 3, { key: 'value' }]);
    expect(result.isJsonLines).toBe(false);
  });

  test('should parse JSON Lines format', () => {
    const input = `{"name": "John", "age": 30}
{"name": "Jane", "age": 25}`;
    const result = parseJson(input);

    expect(result.success).toBe(true);
    expect(result.data).toEqual([
      { name: 'John', age: 30 },
      { name: 'Jane', age: 25 }
    ]);
    expect(result.isJsonLines).toBe(true);
  });

  test('should fix trailing commas in JSON', () => {
    const input = '{"name": "John", "age": 30,}';
    const result = parseJson(input);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ name: 'John', age: 30 });
  });

  test('should fix unquoted keys in JSON', () => {
    const input = '{name: "John", age: 30}';
    const result = parseJson(input);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ name: 'John', age: 30 });
  });

  test('should fix single quotes in JSON', () => {
    const input = "{'name': 'John', 'age': 30}";
    const result = parseJson(input);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ name: 'John', age: 30 });
  });

  test('should handle empty input', () => {
    const input = '';
    const result = parseJson(input);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Input cannot be empty');
  });

  test('should handle whitespace only input', () => {
    const input = '   \n\t   ';
    const result = parseJson(input);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Input cannot be empty');
  });

  test('should handle invalid JSON', () => {
    const input = '{invalid json}';
    const result = parseJson(input);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unable to parse input');
  });

  test('should handle null and undefined values', () => {
    const input = '{"nullValue": null, "undefinedValue": null}';
    const result = parseJson(input);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ nullValue: null, undefinedValue: null });
  });

  test('should handle nested objects', () => {
    const input = '{"user": {"name": "John", "details": {"age": 30, "city": "NYC"}}}';
    const result = parseJson(input);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      user: {
        name: 'John',
        details: {
          age: 30,
          city: 'NYC'
        }
      }
    });
  });

  test('should handle mixed JSON Lines with empty lines', () => {
    const input = `{"name": "John"}

{"name": "Jane"}

`;
    const result = parseJson(input);

    expect(result.success).toBe(true);
    expect(result.data).toEqual([
      { name: 'John' },
      { name: 'Jane' }
    ]);
    expect(result.isJsonLines).toBe(true);
  });

  test('should handle Python log format JSON Lines with line numbers', () => {
    const input = `1→{"event": "test", "data": {"value": 1}}
2→{"event": "test", "data": {"value": 2}}
3→{"event": "test", "data": {"value": 3}}`;
    const result = parseJson(input);

    expect(result.success).toBe(true);
    expect(result.isJsonLines).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data).toHaveLength(3);
    expect(result.data[0]).toEqual({ event: 'test', data: { value: 1 } });
    expect(result.data[1]).toEqual({ event: 'test', data: { value: 2 } });
    expect(result.data[2]).toEqual({ event: 'test', data: { value: 3 } });
  });

  test('should handle escaped characters in Python log JSON', () => {
    const input = `{"event": "monitor.log.progress", "timestamp": "2025-11-29T08:42:59.857419Z", "data": {"content": "Initializing new project at /home/dev/workspace"}}`;
    const result = parseJson(input);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      event: 'monitor.log.progress',
      timestamp: '2025-11-29T08:42:59.857419Z',
      data: {
        content: 'Initializing new project at /home/dev/workspace'
      }
    });
  });

  test('should handle complex JSON Lines with nested objects and arrays', () => {
    const input = `{"event": "monitor.stage.update", "timestamp": "2025-11-29T08:43:06.284807Z", "data": {"stages": [{"name": "requirements", "status": "in_progress"}, {"name": "architect", "status": "pending"}]}, "metadata": {"session_id": "sess_5ab20d50"}}`;
    const result = parseJson(input);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      event: 'monitor.stage.update',
      timestamp: '2025-11-29T08:43:06.284807Z',
      data: {
        stages: [
          { name: 'requirements', status: 'in_progress' },
          { name: 'architect', status: 'pending' }
        ]
      },
      metadata: {
        session_id: 'sess_5ab20d50'
      }
    });
  });

  test('should handle terminal-wrapped JSON Lines with line breaks', () => {
    // Simulates terminal output where long JSON lines are wrapped
    const input = `{"event": "monitor.log.progress", "timestamp": "2025-12-06T17:22:16.805136Z", "data": {"current_stage": "requirements", "content": "test
 message"}, "metadata": {"session_id": "sess_993c1db6"}}
{"event": "monitor.log.success", "timestamp": "2025-12-06T17:22:36.958087Z", "data": {"content": "Consistency check passed", "current_stage": "requirements"},
 "metadata": {"session_id": "sess_993c1db6"}}`;
    const result = parseJson(input);

    expect(result.success).toBe(true);
    expect(result.isJsonLines).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].event).toBe('monitor.log.progress');
    expect(result.data[1].event).toBe('monitor.log.success');
  });

  test('should handle terminal-wrapped JSON with multiple continuation lines', () => {
    const input = `{"event": "test", "data": {"very_long_field": "this is a very long value that would wrap in
 a terminal window and continue on the next
 line"}}
{"event": "test2", "data": {"short": "value"}}`;
    const result = parseJson(input);

    expect(result.success).toBe(true);
    expect(result.isJsonLines).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].event).toBe('test');
    expect(result.data[1].event).toBe('test2');
  });

  test('should handle JSON with trailing non-JSON content (separator lines)', () => {
    // Real-world example: JSON followed by separator lines like "---"
    const input = `{"event": "monitor.log.progress", "timestamp": "2025-12-22T07:40:02.036464Z", "data": {"current_stage": "architect", "content": "Tool use:\\nid:  call_61t1t0ns5eg\\nname:  Write\\ninput:  {'file_path': '/home/dev/tmp/test.js', 'content': \\"console.log('test');\\"}\\n-----------------------"}, "metadata": {"session_id": "sess_3d62f068"}}`;
    const result = parseJson(input);

    expect(result.success).toBe(true);
    expect(result.data.event).toBe('monitor.log.progress');
    expect(result.data.timestamp).toBe('2025-12-22T07:40:02.036464Z');
    expect(result.data.data.current_stage).toBe('architect');
    expect(result.data.data.content).toContain('Tool use:');
    expect(result.data.data.content).toContain('-----------------------');
    expect(result.data.metadata.session_id).toBe('sess_3d62f068');
  });

  test('should handle JSON with Markdown code blocks containing backticks', () => {
    // Real-world example: JSON containing Markdown with code blocks (backticks)
    const input = '{"time": "2025-12-25T13:17:32.712214", "event": "result_message", "message": "", "data": {"subtype": "success", "is_error": false, "result": "现在让我回答您的问题：**为什么之前没有做运行测试？**\\n\\n## 问题分析\\n\\n之前的实现过程中存在以下问题：\\n\\n### 1. **只运行了单元测试，没有启动应用**\\n```bash\\nnpm test      #\\n✅ 运行了单元测试\\nnpm run build # ✅ 运行了构建\\n```\\n但我们**从来没有运行过**：\\n```bash\\nnpm run dev   # ❌ 没有启动开发服务器\\n```\\n\\n### 2. **缺少 React Router v7 的关键文件**\\nReact Router v7 Framework Mode **必须**要有 `app/routes/root.tsx` 文件，但我们在整个实现过程中都忽略了这一点。\\n\\n### 3. **package.json 包含了冲突的依赖**\\n- `react-scripts` (Create React App) 与 React Router v7 冲突\\n- 这导致 npm install 失败，但我们没有及时发现\\n\\n### 4. **为什么构建成功了但应用不能运行？**\\n因为：\\n- **构建**只检查 TypeScript 语法和模块解析\\n- **运行时错误**（如缺少 root.tsx）只有在浏览器中才能发现\\n- React Router 的 `useContext` 错误是运行时错误，不是构建时错误\\n\\n### 教训\\n\\n对于 **React Router v7 Framework Mode** 项目，应该：\\n\\n1. ✅ 创建项目时立即添加 `root.tsx`\\n2. ✅ 第一次提交前运行 `npm run dev` 测试\\n3. ✅ 确保 package.json 没有冲突的依赖（如 react-scripts）\\n4. ✅ 使用 `react-router dev` 而不是 `vite`\\n\\n现在应用应该可以正常\\n运行了。您可以运行：\\n\\n```bash\\nnpm run dev\\n```\\n\\n然后访问 http://localhost:5173 测试所有功能。", "usage": {"input_tokens": 177137, "cache_creation_input_tokens": 0, "cache_read_input_tokens": 2081152, "output_tokens": 4455, "server_tool_use": {"web_search_requests": 0, "web_fetch_requests": 0}, "service_tier": "standard", "cache_creation": {"ephemeral_1h_input_tokens": 0, "ephemeral_5m_input_tokens": 0}}, "cost": 1.2441318000000001, "duration_ms": 222984}, "session_id": "a8bafda5-be18-4759-bc29-6f9f6fc54973"}';
    const result = parseJson(input);

    expect(result.success).toBe(true);
    expect(result.data.event).toBe('result_message');
    expect(result.data.data.result).toContain('```bash');
    expect(result.data.data.result).toContain('npm test');
    expect(result.data.data.usage.input_tokens).toBe(177137);
  });
});
