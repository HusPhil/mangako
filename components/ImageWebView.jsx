import React from 'react';
import { WebView } from 'react-native-webview';

const ImageWebView = ({ imgSlice }) => {

  const htmlContent = `
  <html>
    <body style="padding:0; margin:0;">
      ${imgSlice.map((image, index) => `
        <img src="data:image/jpeg;base64,${image}" alt="Base64 Image" style="width:100%" key=${index}>
      `).join('')}
    </body>
  </html>
`;


  return (
    <WebView
      originWhitelist={['*']}
      source={{ html: htmlContent }}
      style={{ flex: 1 }}
    />
  );
};

export default ImageWebView;
