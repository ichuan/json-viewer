import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

// Mock the JSON parser for testing
jest.mock('./utils/jsonParser', () => ({
  parseJson: jest.fn(),
}));

import { parseJson } from './utils/jsonParser';

const mockParseJson = parseJson as jest.MockedFunction<typeof parseJson>;

describe('App Component', () => {
  beforeEach(() => {
    mockParseJson.mockClear();
  });

  test('renders header with JSON Viewer text', () => {
    mockParseJson.mockReturnValue({ success: false, data: null, error: '输入不能为空' });

    render(<App />);

    expect(screen.getByText('JSON Viewer')).toBeInTheDocument();
  });

  test('renders footer with copyright', () => {
    mockParseJson.mockReturnValue({ success: false, data: null, error: '输入不能为空' });

    render(<App />);

    expect(screen.getByText('© 2024 JSON Viewer. All rights reserved.')).toBeInTheDocument();
  });

  test('renders input and preview areas', () => {
    mockParseJson.mockReturnValue({ success: false, data: null, error: '输入不能为空' });

    render(<App />);

    expect(screen.getByLabelText('JSON 输入')).toBeInTheDocument();
  });

  test('updates preview when valid JSON is entered', async () => {
    const mockData = { name: 'John', age: 30 };
    mockParseJson.mockReturnValue({
      success: true,
      data: mockData,
      isJsonLines: false
    });

    render(<App />);

    const textarea = screen.getByLabelText('JSON 输入');
    fireEvent.change(textarea, { target: { value: '{"name": "John", "age": 30}' } });

    // Wait for debounce to complete
    await waitFor(() => {
      expect(mockParseJson).toHaveBeenCalledWith('{"name": "John", "age": 30}');
    }, { timeout: 1000 });
  });

  test('shows error message for invalid JSON', async () => {
    mockParseJson.mockReturnValue({
      success: false,
      data: null,
      error: 'JSON 解析失败'
    });

    render(<App />);

    const textarea = screen.getByLabelText('JSON 输入');
    fireEvent.change(textarea, { target: { value: 'invalid json' } });

    // Wait for debounce to complete
    await waitFor(() => {
      expect(mockParseJson).toHaveBeenCalledWith('invalid json');
    }, { timeout: 1000 });
  });

  test('clear button works correctly', () => {
    mockParseJson.mockReturnValue({ success: false, data: null, error: '输入不能为空' });

    render(<App />);

    const textarea = screen.getByLabelText('JSON 输入');
    const clearButton = screen.getByText('清空');

    // First enter some text
    fireEvent.change(textarea, { target: { value: '{"test": "data"}' } });
    expect(textarea).toHaveValue('{"test": "data"}');

    // Then click clear
    fireEvent.click(clearButton);
    expect(textarea).toHaveValue('');
  });

  test('input area uses full height after removing stats', () => {
    mockParseJson.mockReturnValue({ success: false, data: null, error: '输入不能为空' });

    render(<App />);

    const textarea = screen.getByLabelText('JSON 输入');
    expect(textarea).toBeInTheDocument();

    // Verify that character stats are no longer displayed
    expect(screen.queryByText(/字符/)).not.toBeInTheDocument();
    expect(screen.queryByText(/行/)).not.toBeInTheDocument();
  });
});
