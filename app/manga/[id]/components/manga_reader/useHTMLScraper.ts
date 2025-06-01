import { useCallback, useState } from 'react';
import { WebViewMessageEvent, WebViewProps } from 'react-native-webview';

interface UseSimpleScraperReturn {
  html: string;
  loading: boolean;
  error: string | null;
  logs: string[];
  webViewProps: Partial<WebViewProps> | null;
  scrapeHTML: (url: string) => void;
  clearLogs: () => void;
}

export const useSimpleScraper = (): UseSimpleScraperReturn => {
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [webViewProps, setWebViewProps] = useState<Partial<WebViewProps> | null>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[Scraper] ${message}`);
  };

  const handleMessage = useCallback((event: WebViewMessageEvent): void => {
    try {
      addLog(`Received message: ${event.nativeEvent.data.substring(0, 100)}...`);
      
      const message = JSON.parse(event.nativeEvent.data);
      
      if (message.type === 'log') {
        addLog(`WebView Log: ${message.data}`);
      } else if (message.type === 'success') {
        addLog(`Success! HTML length: ${message.data.length}`);
        setHtml(message.data);
        setLoading(false);
        setWebViewProps(null);
      } else if (message.type === 'error') {
        addLog(`Error: ${message.data}`);
        setError(message.data);
        setLoading(false);
        setWebViewProps(null);
      }
    } catch (err) {
      addLog(`Message parsing error: ${err}`);
      setError('Failed to parse WebView message');
      setLoading(false);
      setWebViewProps(null);
    }
  }, []);

  const handleError = useCallback((syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    addLog(`WebView error: ${nativeEvent?.description || 'Unknown error'}`);
    setError(`WebView failed to load: ${nativeEvent?.description || 'Unknown error'}`);
    setLoading(false);
    setWebViewProps(null);
  }, []);

  const handleLoadStart = useCallback(() => {
    addLog('WebView started loading...');
  }, []);

  const handleLoad = useCallback(() => {
    addLog('WebView finished loading');
  }, []);

  const scrapeHTML = useCallback((url: string): void => {
    addLog(`Starting scrape of: ${url}`);
    setLoading(true);
    setError(null);
    setHtml('');

    // Super simple injected JavaScript for testing
    const injectedJS = `
      (function() {
        try {
          // Log that script is running
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'log',
            data: 'Injected script started'
          }));

          // Wait a short time for page to settle
          setTimeout(() => {
            try {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'log',
                data: 'Getting HTML after 2 second delay'
              }));

              // Get the HTML
              const html = document.documentElement.outerHTML;
              
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'log',
                data: \`HTML length: \${html.length}\`
              }));

              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'success',
                data: html
              }));

            } catch (innerError) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'error',
                data: 'Inner error: ' + innerError.message
              }));
            }
          }, 2000);

        } catch (error) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'error',
            data: 'Script error: ' + error.message
          }));
        }
      })();
      true;
    `;

    setWebViewProps({
      source: { uri: url },
      injectedJavaScript: injectedJS,
      onMessage: handleMessage,
      onError: handleError,
      onLoadStart: handleLoadStart,
      onLoad: handleLoad,
      style: { height: 1, opacity: 0.1 }, // Make slightly visible for debugging
      javaScriptEnabled: true,
      domStorageEnabled: true,
      startInLoadingState: true,
      mixedContentMode: 'compatibility',
      allowsInlineMediaPlayback: false,
      mediaPlaybackRequiresUserAction: true,
    });
  }, [handleMessage, handleError, handleLoadStart, handleLoad]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    html,
    loading,
    error,
    logs,
    webViewProps,
    scrapeHTML,
    clearLogs
  };
};