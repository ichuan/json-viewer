import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { JsonInput } from './components/JsonInput';
import { JsonPreview } from './components/JsonPreview';
import { parseJson } from './utils/jsonParser';

const App: React.FC = () => {
  const [jsonInput, setJsonInput] = useState<string>('');
  const [parsedResult, setParsedResult] = useState(parseJson(''));

  // Optimize parse function with useCallback
  const parseJsonCallback = useCallback((input: string) => {
    const result = parseJson(input);
    setParsedResult(result);
  }, []);

  // Use debounce to optimize real-time preview
  useEffect(() => {
    const timer = setTimeout(() => {
      parseJsonCallback(jsonInput);
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timer);
  }, [jsonInput, parseJsonCallback]);

  return (
    <div className="app">
      <Header />

      <main className="main-content">
        {/* Left input area */}
        <div className="left-panel">
          <JsonInput
            value={jsonInput}
            onChange={setJsonInput}
          />
        </div>

        {/* Right preview area */}
        <div className="right-panel">
          <JsonPreview result={parsedResult} />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default App;
