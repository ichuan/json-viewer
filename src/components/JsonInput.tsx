import React from 'react';

interface JsonInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const JsonInput: React.FC<JsonInputProps> = ({ value, onChange }) => {
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');

    // 获取选中的文本范围
    const start = e.currentTarget.selectionStart;
    const end = e.currentTarget.selectionEnd;

    // 替换选中的内容，如果没有选中则在光标位置插入
    const newValue = value.substring(0, start) + pastedText + value.substring(end);
    onChange(newValue);

    // 设置新的光标位置到粘贴内容的末尾
    // 使用 requestAnimationFrame 而不是 setTimeout，并保存元素引用
    requestAnimationFrame(() => {
      const textarea = e.currentTarget;
      if (textarea) {
        textarea.selectionStart = textarea.selectionEnd = start + pastedText.length;
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);

      e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2;
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="input-header">
        <label htmlFor="json-input" className="input-label">
          JSON 输入
        </label>
        <div className="input-controls">
          <span className="input-hint">
            支持普通 JSON 和 JSON Lines 格式
          </span>
          <button
            onClick={() => onChange('')}
            className="clear-button"
          >
            清空
          </button>
        </div>
      </div>

      <div
        className="textarea-wrapper"
        style={{
          flex: 1,
          position: 'relative',
          minHeight: 0,
          overflow: 'hidden',
          backgroundColor: 'white'
        }}
      >
      <textarea
        id="json-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        className="json-textarea"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          outline: 'none',
          resize: 'none',
          background: 'transparent',
          fontFamily: 'SF Mono, Monaco, Cascadia Code, Roboto Mono, Consolas, Courier New, monospace',
          fontSize: '0.875rem',
          color: 'inherit',
          padding: '16px',
          boxSizing: 'border-box',
          lineHeight: '1.5',
          overflow: 'auto'
        }}
        placeholder="粘贴或输入 JSON 数据..."
        spellCheck={false}
      />
    </div>
    </div>
  );
};