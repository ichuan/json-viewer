import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { JsonInput } from './components/JsonInput';
import { JsonPreview } from './components/JsonPreview';
import { parseJson } from './utils/jsonParser';

const App: React.FC = () => {
  const [jsonInput, setJsonInput] = useState<string>('');
  const [parsedResult, setParsedResult] = useState(parseJson(''));

  // 使用 useCallback 优化解析函数
  const parseJsonCallback = useCallback((input: string) => {
    const result = parseJson(input);
    setParsedResult(result);
  }, []);

  // 使用防抖优化实时预览
  useEffect(() => {
    const timer = setTimeout(() => {
      parseJsonCallback(jsonInput);
    }, 300); // 300ms 防抖延迟

    return () => clearTimeout(timer);
  }, [jsonInput, parseJsonCallback]);

  return (
    <div className="app">
      <Header />

      <main className="main-content">
        {/* 左侧输入区域 */}
        <div className="left-panel">
          <JsonInput
            value={jsonInput}
            onChange={setJsonInput}
          />
        </div>

        {/* 右侧预览区域 */}
        <div className="right-panel">
          <JsonPreview result={parsedResult} />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default App;
