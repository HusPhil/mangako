import React, { useEffect, useState, useRef } from 'react';
import { WebView } from 'react-native-webview';
import { View, Dimensions, Image } from 'react-native';

const ImageRenderer = ({ imageData }) => {
  const webViewRef = useRef(null);
  const [imageHeight, setImageHeight] = useState(null);
  const [imageWidth, setImageWidth] = useState(null);

  useEffect(() => {
    if (imageData) {
      const screenWidth = Dimensions.get('window').width;
      Image.getSize(`data:image/jpeg;base64,${imageData}`, (width, height) => {
        const calculatedHeight = screenWidth / (width / height);
        setImageWidth(screenWidth);
        setImageHeight(calculatedHeight);
      });
    }
  }, [imageData]);

  const generateHtmlContent = () => {
    if (!imageData) return '';

    return `
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
            }
          </style>
        </head>
        <body>
          <img src="data:image/jpeg;base64,${imageData}" alt="Rendered Image" />
        </body>
      </html>
    `;
  };

  const onMessage = event => {
    const { height } = JSON.parse(event.nativeEvent.data);
    setImageHeight(height);
  };

  return (
    <View style={{ height: imageHeight, width: imageWidth }}>
      {imageData && (
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: generateHtmlContent() }}
          style={{ flex: 1, height: imageHeight }}
          scrollEnabled={false}
          javaScriptEnabled={true}
          onMessage={onMessage}
          scalesPageToFit={true} // Enable zooming
        />
      )}
    </View>
  );
};

export default ImageRenderer;
