import React, { useRef, useEffect } from 'react';

interface JsonInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const JsonInput: React.FC<JsonInputProps> = ({ value, onChange }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumberRef = useRef<HTMLDivElement>(null);

  // Synchronized scrolling
  useEffect(() => {
    const textarea = textareaRef.current;
    const lineNumber = lineNumberRef.current;

    if (textarea && lineNumber) {
      const handleScroll = () => {
        lineNumber.scrollTop = textarea.scrollTop;
        lineNumber.scrollLeft = textarea.scrollLeft;
      };

      // Also sync based on content height
      const syncHeight = () => {
        // Ensure line number column is at least as tall as textarea content
        const textareaHeight = textarea.scrollHeight;
        const lineNumberHeight = lineNumber.scrollHeight;

        // If textarea content is taller than line number column, expand line number column
        if (textareaHeight > lineNumberHeight) {
          lineNumber.style.height = `${textareaHeight}px`;
        }
      };

      textarea.addEventListener('scroll', handleScroll);
      textarea.addEventListener('input', syncHeight);
      textarea.addEventListener('keyup', syncHeight);

      // Initial sync
      syncHeight();

      return () => {
        textarea.removeEventListener('scroll', handleScroll);
        textarea.removeEventListener('input', syncHeight);
        textarea.removeEventListener('keyup', syncHeight);
      };
    }
  }, []);

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');

    // Get selected text range
    const start = e.currentTarget.selectionStart;
    const end = e.currentTarget.selectionEnd;

    // Replace selected content, or insert at cursor position if nothing selected
    const newValue = value.substring(0, start) + pastedText + value.substring(end);
    onChange(newValue);

    // Set new cursor position to the end of pasted content
    // Use requestAnimationFrame instead of setTimeout and save element reference
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

  // Calculate line count and line numbers
  const lines = value.split('\n');
  const lineCount = lines.length;
  const lineNumberWidth = Math.max(2, String(lineCount).length);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="input-header">
        <label htmlFor="json-input" className="input-label">
          JSON Input
        </label>
        <div className="input-controls">
          <span className="input-hint">
            Supports JSON and JSON Lines formats
          </span>
          <button
            onClick={() => onChange('')}
            className="clear-button"
          >
            Clear
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
          backgroundColor: 'var(--bg-primary)'
        }}
      >
        <div
          style={{
            display: 'flex',
            height: '100%',
            width: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
        >
            {/* Line number column */}
            <div
              ref={lineNumberRef}
              className="input-line-numbers"
              style={{
                width: `${lineNumberWidth * 0.6 + 1}em`,
                backgroundColor: 'var(--bg-tertiary)',
                borderRight: '1px solid var(--border-color)',
                padding: '16px 8px',
                fontFamily: 'SF Mono, Monaco, Cascadia Code, Roboto Mono, Consolas, Courier New, monospace',
                fontSize: '0.8rem',
                lineHeight: '1.5',
                color: 'var(--text-muted)',
                textAlign: 'right',
                userSelect: 'none',
                flexShrink: 0,
                overflow: 'hidden',
                pointerEvents: 'none',
                height: '100%'
              }}
            >
              {lines.map((_, index) => (
                <div
                  key={index}
                  style={{
                    height: '1.5em',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end'
                  }}
                >
                  {index + 1}
                </div>
              ))}
              {/* Fill empty area to ensure line number column height matches textarea */}
              <div style={{ height: '100%' }}></div>
            </div>

            {/* Content area */}
            <textarea
              ref={textareaRef}
              id="json-input"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={handleKeyDown}
              className="json-textarea"
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                resize: 'none',
                background: 'transparent',
                fontFamily: 'SF Mono, Monaco, Cascadia Code, Roboto Mono, Consolas, Courier New, monospace',
                fontSize: '0.8rem',
                color: 'var(--text-primary)',
                padding: '16px 16px 16px 16px',
                boxSizing: 'border-box',
                lineHeight: '1.5',
                overflow: 'auto',
                minHeight: 0
              }}
              placeholder="Paste or enter JSON data..."
              spellCheck={false}
            />
        </div>
    </div>
    </div>
  );
};
