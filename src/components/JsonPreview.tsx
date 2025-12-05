import React, { useState, useCallback, useMemo } from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import { ParsedJsonResult } from '../utils/jsonParser';

interface JsonPreviewProps {
  result: ParsedJsonResult;
}

export const JsonPreview: React.FC<JsonPreviewProps> = ({ result }) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [collapsedPaths, setCollapsedPaths] = useState<Set<string>>(new Set());

  const handleCopy = async () => {
    try {
      const jsonString = JSON.stringify(result.data, null, 2);
      await navigator.clipboard.writeText(jsonString);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const toggleCollapsed = useCallback((path: string) => {
    setCollapsedPaths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  }, []);

  const getAllPaths = useCallback((obj: any, prefix = ''): string[] => {
    const paths: string[] = [];

    // Add root path if the root object is an object or array and not null
    if ((typeof obj === 'object' && obj !== null) || Array.isArray(obj)) {
      if (prefix) {
        paths.push(prefix);
      }
    }

    if (Array.isArray(obj)) {
      obj.forEach((_, index) => {
        const currentPath = prefix ? `${prefix}[${index}]` : `[${index}]`;
        paths.push(currentPath);
        if (typeof obj[index] === 'object' && obj[index] !== null) {
          paths.push(...getAllPaths(obj[index], currentPath));
        }
      });
    } else if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        const currentPath = prefix ? `${prefix}.${key}` : key;
        paths.push(currentPath);
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          paths.push(...getAllPaths(obj[key], currentPath));
        }
      });
    }

    return paths;
  }, []);

  const allPaths = useMemo(() => getAllPaths(result.data, 'root'), [result.data, getAllPaths]);

  const expandAll = useCallback(() => {
    setCollapsedPaths(new Set());
  }, []);

  const collapseAll = useCallback(() => {
    setCollapsedPaths(new Set(allPaths));
  }, [allPaths]);

  if (!result.success) {
    // If it's empty input, show friendly prompt instead of error
    if (result.error === 'Input cannot be empty') {
      return (
        <div style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9ca3af',
          fontSize: '0.875rem',
          fontFamily: 'SF Mono, Monaco, Cascadia Code, Roboto Mono, Consolas, Courier New, monospace'
        }}>
          Please paste or enter JSON data in the left input field...
        </div>
      );
    }

    // Show error message for other parsing errors
    return (
      <div className="error-container">
        <div className="error-box">
          <div className="error-content">
            <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="error-title">Parse Error</h3>
              <p className="error-message">{result.error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderJsonValue = (value: any, depth: number = 0, path: string = ''): React.ReactElement => {
    if (value === null) {
      return <span className="json-null">null</span>;
    }

    if (value === undefined) {
      return <span className="json-undefined">undefined</span>;
    }

    if (typeof value === 'string') {
      return <span className="json-string">"{value}"</span>;
    }

    if (typeof value === 'number') {
      return <span className="json-number">{value}</span>;
    }

    if (typeof value === 'boolean') {
      return <span className="json-boolean">{value.toString()}</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="json-bracket">[]</span>;
      }

      const isCollapsed = collapsedPaths.has(path);

      return (
        <div>
          <Collapsible.Root
            open={!isCollapsed}
            onOpenChange={() => toggleCollapsed(path)}
          >
            <Collapsible.Trigger asChild>
              <button
                className="json-collapsible-trigger"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  color: 'inherit',
                  fontFamily: 'inherit',
                  fontSize: 'inherit'
                }}
              >
                {isCollapsed ?
                  <span>
                    <span className="json-bracket">[</span>
                    <span style={{ color: '#059669', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginLeft: '4px', marginRight: '4px' }}>+</span>
                    <span className="json-bracket">]</span>
                  </span> :
                  <span>
                    <span className="json-bracket">[</span>
                    <span style={{ color: '#dc2626', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginLeft: '4px', marginRight: '4px' }}>−</span>
                  </span>
                }
              </button>
            </Collapsible.Trigger>

            <Collapsible.Content>
              <div className="json-value" style={{ marginLeft: '16px' }}>
                {value.map((item, index) => (
                  <div key={index} className="json-item">
                    {renderJsonValue(item, depth + 1, path ? `${path}[${index}]` : `[${index}]`)}
                    {index < value.length - 1 && <span className="json-bracket">,</span>}
                  </div>
                ))}
                <span className="json-bracket">]</span>
              </div>
            </Collapsible.Content>
          </Collapsible.Root>
        </div>
      );
    }

    if (typeof value === 'object') {
      const keys = Object.keys(value);
      if (keys.length === 0) {
        return <span className="json-bracket">{"{}"}</span>;
      }

      const isCollapsed = collapsedPaths.has(path);

      return (
        <div>
          <Collapsible.Root
            open={!isCollapsed}
            onOpenChange={() => toggleCollapsed(path)}
          >
            <Collapsible.Trigger asChild>
              <button
                className="json-collapsible-trigger"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  color: 'inherit',
                  fontFamily: 'inherit',
                  fontSize: 'inherit'
                }}
              >
                {isCollapsed ?
                  <span>
                    <span className="json-bracket">{"{"}</span>
                    <span style={{ color: '#059669', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginLeft: '4px', marginRight: '4px' }}>+</span>
                    <span className="json-bracket">{"}"}</span>
                  </span> :
                  <span>
                    <span className="json-bracket">{"{"}</span>
                    <span style={{ color: '#dc2626', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginLeft: '4px', marginRight: '4px' }}>−</span>
                  </span>
                }
              </button>
            </Collapsible.Trigger>

            <Collapsible.Content>
              <div className="json-value" style={{ marginLeft: '16px' }}>
                {keys.map((key, index) => (
                  <div key={key} className="json-item">
                    <span className="json-property">"{key}"</span>
                    <span className="json-bracket">: </span>
                    {renderJsonValue(value[key], depth + 1, path ? `${path}.${key}` : key)}
                    {index < keys.length - 1 && <span className="json-bracket">,</span>}
                  </div>
                ))}
                <span className="json-bracket">{"}"}</span>
              </div>
            </Collapsible.Content>
          </Collapsible.Root>
        </div>
      );
    }

    return <span className="json-null">{String(value)}</span>;
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="preview-header">
        <div className="preview-title">
          <span className="preview-label">
            {result.isJsonLines ? 'JSON Lines' : 'JSON'}
          </span>
          {result.isJsonLines && (
            <span className="json-lines-badge">
              {Array.isArray(result.data) ? result.data.length : 0} lines
            </span>
          )}
          {allPaths.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
              <button
                onClick={expandAll}
                className="collapse-button"
                title="Expand All"
                style={{
                  background: 'none',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  color: '#374151'
                }}
              >
                Expand
              </button>
              <button
                onClick={collapseAll}
                className="collapse-button"
                title="Collapse All"
                style={{
                  background: 'none',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  color: '#374151'
                }}
              >
                Collapse
              </button>
            </div>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="copy-button"
          title="Copy formatted JSON"
        >
          {copySuccess ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 6H9" />
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 4v16l-4-4m4 4H4" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>

      <div
        className="preview-scrollarea"
        style={{
          flex: 1,
          position: 'relative',
          minHeight: 0,
          overflow: 'auto',
          backgroundColor: 'white'
        }}
      >
        <div className="preview-content">
          {renderJsonValue(result.data, 0, 'root')}
        </div>
      </div>
    </div>
  );
};