import React, { useEffect, useState } from 'react';
import { Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSimpleScraper } from '../manga/[id]/components/manga_reader/useHTMLScraper'; // Adjust import path

const SimpleScraperTest: React.FC = () => {
  const { html, loading, error, logs, webViewProps, scrapeHTML, clearLogs } = useSimpleScraper();
  const [url, setUrl] = useState<string>('https://mangabuddy.com/the-eminence-in-shadow/vol-2-chapter-5'); // Simple test URL

  const testUrls = [
    { name: 'Simple HTML', url: 'https://httpbin.org/html' },
    { name: 'Google', url: 'https://www.google.com' },
    { name: 'Example.com', url: 'https://example.com' },
    { name: 'Your Manga URL', url: 'https://mangapark.net/title/74886-en-the-eminence-in-shadow/1784196-ch-1' }
  ];

  useEffect(() => {
    const testWebView = async () => {
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
    }
    testWebView();
    
  }, [html]);

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* URL Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>URL to Scrape:</Text>
          <TextInput
            style={styles.input}
            value={url}
            onChangeText={setUrl}
            placeholder="Enter URL"
            autoCapitalize="none"
          />
          <Button 
            title={loading ? 'Scraping...' : 'Scrape'} 
            onPress={() => scrapeHTML(url)}
            disabled={loading}
          />
        </View>

        {/* Quick Test URLs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Tests:</Text>
          {testUrls.map((test, index) => (
            <View key={index} style={styles.testButton}>
              <Button
                title={test.name}
                onPress={() => {
                  setUrl(test.url);
                  scrapeHTML(test.url);
                }}
                disabled={loading}
              />
            </View>
          ))}
        </View>

        {/* Logs Section */}
        <View style={styles.section}>
          <View style={styles.logHeader}>
            <Text style={styles.sectionTitle}>Debug Logs:</Text>
            <Button title="Clear" onPress={clearLogs} />
          </View>
          <ScrollView style={styles.logContainer} nestedScrollEnabled>
            {logs.map((log: string, index: number) => (
              <Text key={index} style={styles.logText}>{log}</Text>
            ))}
            {logs.length === 0 && (
              <Text style={styles.emptyLog}>No logs yet...</Text>
            )}
          </ScrollView>
        </View>

        {/* Error Section */}
        {error && (
          <View style={styles.errorSection}>
            <Text style={styles.errorTitle}>❌ Error:</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Success Section */}
        {html && (
          <View style={styles.successSection}>
            <Text style={styles.successTitle}>✅ Success!</Text>
            <Text style={styles.statsText}>HTML Length: {html.length} characters</Text>
            <Text style={styles.statsText}>Title tags: {(html.match(/<title>/gi) || []).length}</Text>
            <Text style={styles.statsText}>Body content: {html.includes('<body>') ? 'Yes' : 'No'}</Text>
            
            {/* Show first 500 characters of HTML */}
            <Text style={styles.sectionTitle}>HTML Preview:</Text>
            <ScrollView style={styles.htmlPreview} nestedScrollEnabled>
              <Text style={styles.htmlText} selectable>
                {html.substring(0, 500)}...
              </Text>
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* The actual WebView (slightly visible for debugging) */}
      {webViewProps && (
        <View style={styles.webViewDebug}>
          <Text style={styles.webViewLabel}>WebView (for debugging):</Text>
          <WebView {...webViewProps} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
    fontSize: 12,
  },
  testButton: {
    marginBottom: 8,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logContainer: {
    maxHeight: 200,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    padding: 8,
  },
  logText: {
    fontSize: 10,
    fontFamily: 'monospace',
    marginBottom: 2,
    color: '#666',
  },
  emptyLog: {
    fontStyle: 'italic',
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },
  errorSection: {
    backgroundColor: '#ffebee',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#c62828',
    marginBottom: 8,
  },
  errorText: {
    color: '#c62828',
  },
  successSection: {
    backgroundColor: '#e8f5e8',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  statsText: {
    color: '#2e7d32',
    marginBottom: 4,
  },
  htmlPreview: {
    maxHeight: 150,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    padding: 8,
    marginTop: 8,
  },
  htmlText: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
  webViewDebug: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 100,
    height: 60,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
  },
  webViewLabel: {
    fontSize: 8,
    textAlign: 'center',
    padding: 2,
  },
});

export default SimpleScraperTest;