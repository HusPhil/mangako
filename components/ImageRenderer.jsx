import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { WebView } from 'react-native-webview';
import { View, Dimensions } from 'react-native';
import {Image} from 'expo-image'
const ImageRenderer = React.memo(({ imageData }) => {
  const [htmlContent, setHtmlContent] = useState('');
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const screenWidth = useMemo(() => Dimensions.get('window').width, []);

  const generateHtmlContent = useCallback((imageSrc) => `
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
  `, []);

  useEffect(() => {
    if (imageData) {
      const imageSrc = `data:image/jpeg;base64,${imageData}`;
      
      Image.getSize(imageSrc, (width, height) => {
        const calculatedHeight = screenWidth / (width / height);
        
        setDimensions({ width: screenWidth, height: calculatedHeight });
        setHtmlContent(generateHtmlContent(imageSrc));
      });
    }
  }, [imageData, screenWidth, generateHtmlContent]);

  const onMessage = useCallback((event) => {
    const { height } = JSON.parse(event.nativeEvent.data);
    setDimensions(prevDimensions => ({ ...prevDimensions, height }));
  }, []);

  return (
    <View style={{ height: dimensions.height, width: dimensions.width }}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={{ height: dimensions.height, width: dimensions.width }}
        scrollEnabled={false}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        renderToHardwareTextureAndroid
        androidHardwareAccelerationDisabled={false}
        startInLoadingState={false}
        scalesPageToFit
        useWebKit
        cacheEnabled={false}
      />
    </View>
  );
});

export default ImageRenderer;
