import { useCallback, useRef, useState } from 'react';
import { WebViewMessageEvent, WebViewProps } from 'react-native-webview';

interface UseSimpleScraperReturn {
  html: string;
  loading: boolean;
  error: string | null;
  logs: string[];
  webViewProps: Partial<WebViewProps> | null;
  scrapeHTML: (url: string, options?: ScrapeOptions) => void;
  clearLogs: () => void;
  reset: () => void;
}

interface ScrapeOptions {
  waitTime?: number;
  timeout?: number;
  waitForSelector?: string;
  blockImages?: boolean;
  enableScrolling?: boolean;    // New option
  scrollSpeed?: number;         // New option
}

export const useSimpleScraper = (): UseSimpleScraperReturn => {
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [webViewProps, setWebViewProps] = useState<Partial<WebViewProps> | null>(null);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isScrapingRef = useRef<boolean>(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[Scraper] ${message}`);
  };

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    isScrapingRef.current = false;
  }, []);

  const finishScraping = useCallback((success: boolean, data?: string, errorMsg?: string) => {
    if (!isScrapingRef.current) return; // Prevent duplicate calls
    
    cleanup();
    setLoading(false);
    
    if (success && data) {
      addLog(`Success! HTML length: ${data.length}`);
      setHtml(data);
      setError(null);
    } else {
      addLog(`Failed: ${errorMsg || 'Unknown error'}`);
      setError(errorMsg || 'Scraping failed');
    }
    
    // Keep WebView props for a moment to allow final rendering
    setTimeout(() => {
      setWebViewProps(null);
    }, 1000);
  }, [cleanup]);

  const handleMessage = useCallback((event: WebViewMessageEvent): void => {
    if (!isScrapingRef.current) return;
    
    try {
      const rawData = event.nativeEvent.data;
      addLog(`Received message: ${rawData.substring(0, 100)}...`);
      
      const message = JSON.parse(rawData);
      
      if (message.type === 'log') {
        addLog(`WebView: ${message.data}`);
      } else if (message.type === 'success') {
        finishScraping(true, message.data);
      } else if (message.type === 'error') {
        finishScraping(false, undefined, message.data);
      } else if (message.type === 'progress') {
        addLog(`Progress: ${message.data}`);
      }
    } catch (err) {
      addLog(`Message parsing error: ${err}`);
      finishScraping(false, undefined, 'Failed to parse WebView message');
    }
  }, [finishScraping]);

  const handleError = useCallback((syntheticEvent: any) => {
    if (!isScrapingRef.current) return;
    
    const { nativeEvent } = syntheticEvent;
    const errorMsg = nativeEvent?.description || 'Unknown WebView error';
    addLog(`WebView error: ${errorMsg}`);
    finishScraping(false, undefined, `WebView failed to load: ${errorMsg}`);
  }, [finishScraping]);

  const handleLoadStart = useCallback(() => {
    if (isScrapingRef.current) {
      addLog('WebView started loading...');
    }
  }, []);

  const handleLoad = useCallback(() => {
    if (isScrapingRef.current) {
      addLog('WebView finished loading');
    }
  }, []);

  const handleLoadEnd = useCallback(() => {
    if (isScrapingRef.current) {
      addLog('WebView load ended - JavaScript should execute now');
    }
  }, []);

  const createInjectedJS = (options: ScrapeOptions) => {
    const { waitTime = 3000, waitForSelector, blockImages = false } = options;
    
    return `
      (function() {
        try {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'log',
            data: 'Injected script started - URL: ' + window.location.href
          }));

          // Function to scroll and load lazy content
          function scrollToLoadContent() {
            return new Promise((resolve) => {
              let totalHeight = 0;
              const distance = 1000;
              const scrollDelay = 10;
              
              const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'progress',
                  data: \`Scrolling... \${totalHeight}/\${scrollHeight}px\`
                }));

                if(totalHeight >= scrollHeight) {
                  clearInterval(timer);
                  // Scroll back to top
                  window.scrollTo(0, 0);
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'log',
                    data: 'Finished scrolling, content should be loaded'
                  }));
                  resolve();
                }
              }, scrollDelay);
            });
          }

          // Block images if requested (after scrolling)
          function blockImagesIfNeeded() {
            ${blockImages ? `
            const images = document.querySelectorAll('img');
            images.forEach(img => img.style.display = 'none');
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'log',
              data: 'Blocked ' + images.length + ' images after loading'
            }));
            ` : ''}
          }

          let attempts = 0;
          const maxAttempts = ${Math.ceil(waitTime / 500)};

          async function checkAndExtract() {
            attempts++;
            
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'progress',
              data: \`Attempt \${attempts}/\${maxAttempts} - Document ready: \${document.readyState}\`
            }));

            // Wait for document to be ready first
            if (document.readyState !== 'complete' && attempts < maxAttempts) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'log',
                data: 'Document not ready yet, waiting...'
              }));
              setTimeout(checkAndExtract, 500);
              return;
            }

            // On first complete load, scroll to load lazy content
            if (attempts === 1 || (document.readyState === 'complete' && attempts <= 3)) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'log',
                data: 'Starting scroll to load lazy content...'
              }));
              
              try {
                await scrollToLoadContent();
                blockImagesIfNeeded();
                
                // Wait a bit more for lazy loaded content to render
                await new Promise(resolve => setTimeout(resolve, 1000));
                
              } catch (scrollError) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'log',
                  data: 'Scroll error (continuing anyway): ' + scrollError.message
                }));
              }
            }

            // Check if we should wait for a specific selector
            ${waitForSelector ? `
            const targetElement = document.querySelector('${waitForSelector}');
            if (!targetElement && attempts < maxAttempts) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'log',
                data: 'Waiting for selector: ${waitForSelector}'
              }));
              setTimeout(checkAndExtract, 500);
              return;
            }
            ` : ''}

            // Check if we have content
            const hasContent = document.body && document.body.children.length > 0;
            
            if (!hasContent && attempts < maxAttempts) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'log',
                data: 'No content found yet, retrying...'
              }));
              setTimeout(checkAndExtract, 500);
              return;
            }

            // Extract HTML
            try {
              const html = document.documentElement.outerHTML;
              
              if (html.length < 100) {
                throw new Error('HTML too short, might not be fully loaded');
              }

              // Count loaded images for verification
              const allImages = document.querySelectorAll('img');
              const loadedImages = Array.from(allImages).filter(img => 
                img.complete && img.naturalHeight !== 0
              ).length;

              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'log',
                data: \`Extracted HTML - Length: \${html.length}, Title: "\${document.title}", Images: \${loadedImages}/\${allImages.length}\`
              }));

              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'success',
                data: html
              }));

            } catch (extractError) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'error',
                data: 'Extraction error: ' + extractError.message
              }));
            }
          }

          // Start checking after a brief delay
          setTimeout(checkAndExtract, 500);

        } catch (error) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'error',
            data: 'Script initialization error: ' + error.message
          }));
        }
      })();
      true;
    `;
  };

  const scrapeHTML = useCallback(async (url: string, options: ScrapeOptions = {}): Promise<void> => {
    const { timeout = 150000 } = options;
    
    // Reset state
    reset();
    
    addLog(`Starting scrape of: ${url}`);
    setLoading(true);
    setError(null);
    setHtml('');
    isScrapingRef.current = true;

    // Set timeout
    timeoutRef.current = setTimeout(() => {
      if (isScrapingRef.current) {
        addLog('Scraping timed out');
        finishScraping(false, undefined, 'Scraping timed out');
      }
    }, timeout);

    const injectedJS = createInjectedJS(options);

    setWebViewProps({
      source: { uri: url },
      injectedJavaScript: injectedJS,
      onMessage: handleMessage,
      onError: handleError,
      onLoadStart: handleLoadStart,
      onLoad: handleLoad,
      onLoadEnd: handleLoadEnd,
      style: { height: 1280, width: 800, opacity: 0.5 }, // Completely hidden
      javaScriptEnabled: true,
      domStorageEnabled: true,
      startInLoadingState: true,
      mixedContentMode: 'compatibility',
      mediaPlaybackRequiresUserAction: true,
      cacheEnabled: false, // Disable cache for fresh content
      incognito: true, // Private browsing mode
    });
    const backendUrl = 'http://192.168.8.78:8000/api/v1/scrape/testWebView';
				const response = await fetch(backendUrl, {
				  method: 'POST',
				  headers: {
					  'Content-Type': 'application/json',
				  },
				  body: JSON.stringify({ html }),
				});
				const data = await response.json();
				console.log('data', data);
  }, [handleMessage, handleError, handleLoadStart, handleLoad, handleLoadEnd, finishScraping]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const reset = useCallback(() => {
    cleanup();
    setLoading(false);
    setError(null);
    setHtml('');
    setWebViewProps(null);
  }, [cleanup]);

  return {
    html,
    loading,
    error,
    logs,
    webViewProps,
    scrapeHTML,
    clearLogs,
    reset
  };
};