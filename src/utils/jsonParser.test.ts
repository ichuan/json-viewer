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
});
