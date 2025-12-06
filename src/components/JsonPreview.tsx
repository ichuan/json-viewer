import React, { useState, useCallback, useMemo } from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import { ChevronRightIcon, ChevronDownIcon } from '@radix-ui/react-icons';
import { ParsedJsonResult } from '../utils/jsonParser';

interface JsonPreviewProps {
  result: ParsedJsonResult;
}

// 判断值是否可折叠
const isExpandable = (value: unknown): boolean =>
  (Array.isArray(value) && value.length > 0) ||
  (typeof value === 'object' && value !== null && Object.keys(value).length > 0);

// 获取预览文本
const getPreviewText = (value: unknown): string => {
  if (Array.isArray(value)) return `Array(${value.length})`;
  if (typeof value === 'object' && value !== null) return `Object(${Object.keys(value).length})`;
  return '';
};

// 原始值渲染
const PrimitiveValue: React.FC<{ value: unknown }> = ({ value }) => {
  if (value === null) return <span className="jv-null">null</span>;
  if (value === undefined) return <span className="jv-null">undefined</span>;
  if (typeof value === 'string') return <span className="jv-string">"{value}"</span>;
  if (typeof value === 'number') return <span className="jv-number">{value}</span>;
  if (typeof value === 'boolean') return <span className="jv-boolean">{String(value)}</span>;
  return <span>{String(value)}</span>;
};

// 单个 JSON 节点
const JsonNode: React.FC<{
  keyName?: string | number;
  value: unknown;
  isLast: boolean;
  defaultExpanded?: boolean;
}> = ({ keyName, value, isLast, defaultExpanded = true }) => {
  const [open, setOpen] = useState(defaultExpanded);
  const expandable = isExpandable(value);
  const isArray = Array.isArray(value);
  const comma = isLast ? '' : ',';

  // 渲染 key 部分
  const keyPart = keyName !== undefined && (
    <>
      {typeof keyName === 'string' ? (
        <span className="jv-key">"{keyName}"</span>
      ) : (
        <span className="jv-index">{keyName}</span>
      )}
      <span className="jv-colon">: </span>
    </>
  );

  // 原始值直接渲染
  if (!expandable) {
    return (
      <div className="jv-line">
        {keyPart}
        <PrimitiveValue value={value} />
        {comma}
      </div>
    );
  }

  // 空数组/对象
  const entries = isArray ? (value as unknown[]) : Object.entries(value as object);
  if (entries.length === 0) {
    return (
      <div className="jv-line">
        {keyPart}
        <span className="jv-bracket">{isArray ? '[]' : '{}'}</span>
        {comma}
      </div>
    );
  }

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <div className="jv-line">
        <Collapsible.Trigger className="jv-trigger">
          {open ? <ChevronDownIcon /> : <ChevronRightIcon />}
        </Collapsible.Trigger>
        {keyPart}
        <span className="jv-bracket">{isArray ? '[' : '{'}</span>
        {!open && (
          <>
            <span className="jv-preview">{getPreviewText(value)}</span>
            <span className="jv-bracket">{isArray ? ']' : '}'}</span>
            {comma}
          </>
        )}
      </div>
      <Collapsible.Content className="jv-content">
        {isArray
          ? (value as unknown[]).map((item, idx) => (
              <JsonNode
                key={idx}
                keyName={idx}
                value={item}
                isLast={idx === (value as unknown[]).length - 1}
                defaultExpanded={defaultExpanded}
              />
            ))
          : Object.entries(value as object).map(([k, v], idx, arr) => (
              <JsonNode
                key={k}
                keyName={k}
                value={v}
                isLast={idx === arr.length - 1}
                defaultExpanded={defaultExpanded}
              />
            ))}
        <div className="jv-line jv-closing">
          <span className="jv-bracket">{isArray ? ']' : '}'}</span>
          {comma}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
};

// 主组件
export const JsonPreview: React.FC<JsonPreviewProps> = ({ result }) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [expandKey, setExpandKey] = useState(0);
  const [defaultExpanded, setDefaultExpanded] = useState(true);

  const hasExpandable = useMemo(
    () => result.success && isExpandable(result.data),
    [result]
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(result.data, null, 2));
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  const expandAll = useCallback(() => {
    setDefaultExpanded(true);
    setExpandKey(k => k + 1);
  }, []);

  const collapseAll = useCallback(() => {
    setDefaultExpanded(false);
    setExpandKey(k => k + 1);
  }, []);

  // 空输入提示
  if (!result.success && result.error === 'Input cannot be empty') {
    return (
      <div className="jv-empty">
        Please paste or enter JSON data in the left input field...
      </div>
    );
  }

  // 错误展示
  if (!result.success) {
    return (
      <div className="jv-error-container">
        <div className="jv-error-box">
          <svg className="jv-error-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="jv-error-title">Parse Error</h3>
            <p className="jv-error-msg">{result.error}</p>
          </div>
        </div>
      </div>
    );
  }

  const isJsonLines = result.isJsonLines && Array.isArray(result.data);

  return (
    <div className="jv-wrapper">
      <div className="jv-header">
        <div className="jv-title">
          <span className="jv-label">{isJsonLines ? 'JSON Lines' : 'JSON'}</span>
          {isJsonLines && (
            <span className="jv-badge">{(result.data as unknown[]).length} lines</span>
          )}
          {hasExpandable && (
            <div className="jv-actions">
              <button onClick={expandAll} className="jv-btn" title="Expand all">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
                Expand
              </button>
              <button onClick={collapseAll} className="jv-btn" title="Collapse all">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="4 14 10 14 10 20" />
                  <polyline points="20 10 14 10 14 4" />
                  <line x1="14" y1="10" x2="21" y2="3" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
                Collapse
              </button>
            </div>
          )}
        </div>
        <button onClick={handleCopy} className={`jv-copy-btn ${copySuccess ? 'success' : ''}`}>
          {copySuccess ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      <div className="jv-scroll">
        <div className="jv-tree" key={expandKey}>
          <JsonNode value={result.data} isLast defaultExpanded={defaultExpanded} />
        </div>
      </div>
    </div>
  );
};
