import React, { useEffect, useState } from 'react';
import { WebView } from 'react-native-webview';
import { View, Dimensions, Image } from 'react-native';

const ImageRenderer = ({ imageData }) => {
  const [htmlContent, setHtmlContent] = useState('');
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (imageData) {
      const screenWidth = Dimensions.get('window').width;
      const imageSrc = `data:image/jpeg;base64,${imageData}`;
      
      Image.getSize(imageSrc, (width, height) => {
        const calculatedHeight = screenWidth / (width / height);

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
                  width: 100%;
                  height: auto;
                }
              </style>
            </head>
            <body>
              <img id="renderedImage" src="${imageSrc}" alt="Rendered Image" />
              <script>
                const img = document.getElementById('renderedImage');
                img.onload = function() {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ height: img.offsetHeight }));
                }
              </script>
            </body>
          </html>
        `;

        setDimensions({ width: screenWidth, height: calculatedHeight });
        setHtmlContent(content);
      });
    }
  }, [imageData]);

  const onMessage = event => {
    const { height } = JSON.parse(event.nativeEvent.data);
    setDimensions(prevDimensions => ({ ...prevDimensions, height }));
  };

  return (
    <View style={{ height: dimensions.height, width: dimensions.width }}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={{ height: dimensions.height, width: dimensions.width }}
        scrollEnabled={false}
        onMessage={onMessage}
      />
    </View>
  );
};

export default ImageRenderer;
