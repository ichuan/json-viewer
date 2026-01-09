import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { JsonInput } from './components/JsonInput';
import { JsonPreview } from './components/JsonPreview';
import { parseJson } from './utils/jsonParser';

// Theme type
export type Theme = 'light' | 'dark';

// Theme context
export const ThemeContext = React.createContext<{
  theme: Theme;
  toggleTheme: () => void;
}>({
  theme: 'light',
  toggleTheme: () => {},
});

const App: React.FC = () => {
  const [jsonInput, setJsonInput] = useState<string>(() => {
    const saved = localStorage.getItem('json-viewer-input');
    return saved || '';
  });
  const [parsedResult, setParsedResult] = useState(parseJson(''));
  const [parseTime, setParseTime] = useState<number>(0);
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Theme state
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('json-viewer-theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('json-viewer-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  // Save input to localStorage
  useEffect(() => {
    localStorage.setItem('json-viewer-input', jsonInput);
  }, [jsonInput]);

  // Optimize parse function with useCallback
  const parseJsonCallback = useCallback((input: string) => {
    const startTime = performance.now();
    const result = parseJson(input);
    const endTime = performance.now();
    setParseTime(endTime - startTime);
    setParsedResult(result);
  }, []);

  // Parse initial saved input on mount
  useEffect(() => {
    if (jsonInput) {
      parseJsonCallback(jsonInput);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount with initial saved value

  // Use debounce to optimize real-time preview
  useEffect(() => {
    const timer = setTimeout(() => {
      parseJsonCallback(jsonInput);
    }, 300); // 300ms debounce delay

    return () => clearTimeout(timer);
  }, [jsonInput, parseJsonCallback]);

  // Resizer drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      setLeftPanelWidth(Math.min(Math.max(newWidth, 20), 80));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  // Calculate JSON size
  const jsonSize = new Blob([jsonInput]).size;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={`app ${theme}`}>
        <Header />

        <main className="main-content" ref={containerRef}>
          {/* Left input area */}
          <div className="left-panel" style={{ width: `calc(${leftPanelWidth}% - 2px)` }}>
            <JsonInput
              value={jsonInput}
              onChange={setJsonInput}
            />
          </div>

          {/* Resizable divider */}
          <div
            className={`resizer ${isDragging ? 'active' : ''}`}
            onMouseDown={handleMouseDown}
          >
            <div className="resizer-line" />
          </div>

          {/* Right preview area */}
          <div className="right-panel" style={{ width: `calc(${100 - leftPanelWidth}% - 2px)` }}>
            <JsonPreview result={parsedResult} />
          </div>
        </main>

        <Footer parseTime={parseTime} jsonSize={jsonSize} lineCount={jsonInput.split('\n').length} />
      </div>
    </ThemeContext.Provider>
  );
};

export default App;
