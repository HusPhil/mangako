import React, { useEffect, useState } from 'react';
import { WebView } from 'react-native-webview';
import { View, Image, Dimensions } from 'react-native';

const ImageRenderer = ({ imageData }) => {
  const [htmlContent, setHtmlContent] = useState('');
  const [imageHeight, setImageHeight] = useState(null);
  const [imageWidth, setImageWidth] = useState(null);

  useEffect(() => {
    if (imageData) {
      Image.getSize(`data:image/jpeg;base64,${imageData}`, (width, height) => {
        const screenWidth = Dimensions.get('window').width;
        const calculatedHeight = screenWidth / (width / height);

        setImageWidth(screenWidth);
        setImageHeight(calculatedHeight);

        const content = `
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body, html {
                  margin: 0;
                  padding: 0;
                  width: 100%;
                  height: 100%;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  overflow: hidden;
                }
                img {
                  width: auto;
                  height: auto;
                  max-width: 100%;
                  max-height: 100%;
                  animation: fade-in 0.3s ease-out;
                }
                @keyframes fade-in {
                  from { opacity: 0; }
                  to { opacity: 1; }
                }
              </style>
            </head>
            <body>
              <img id="renderedImage" src="data:image/jpeg;base64,${imageData}" alt="Rendered Image" />
              <script>
                const img = document.getElementById('renderedImage');
                img.onload = function() {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ height: img.offsetHeight }));
                }
              </script>
            </body>
          </html>
        `;
        setHtmlContent(content);
      });
    }
  }, [imageData]);

  const onMessage = event => {
    const { height } = JSON.parse(event.nativeEvent.data);
    setImageHeight(height);
  };

  return (
    <View style={{ height: imageHeight, width: imageWidth }}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={{ height: imageHeight }}
        scrollEnabled={false}
        onMessage={onMessage}
      />
    </View>
  );
};

export default ImageRenderer;
