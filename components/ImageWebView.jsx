import React from 'react';
import { WebView } from 'react-native-webview';

const Base64ImageRenderer = ({ imgSlice }) => {
  // Assuming imgSlice is an array containing base64 encoded image strings

  // Construct the HTML content with the base64 image data
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

export default Base64ImageRenderer;
