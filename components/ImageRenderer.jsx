import React, { useEffect, useState } from 'react';
import { WebView } from 'react-native-webview';

const ImageRenderer = ({ imageData }) => {
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    if (imageData) {
      const content = `
        <html>
          <head>
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
            <img src="data:image/jpeg;base64,${imageData}" alt="Rendered Image" />
          </body>
        </html>
      `;
      setHtmlContent(content);
    }
  }, [imageData]);

  return (
    <WebView
      originWhitelist={['*']}
      source={{ html: htmlContent }}
      style={{ flex: 1 }}
      scrollEnabled={false}
    />
  );
};

export default ImageRenderer;
