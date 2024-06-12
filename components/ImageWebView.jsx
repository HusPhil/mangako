import React, { useEffect, useState, useRef } from 'react';
import { WebView } from 'react-native-webview';
import shorthash from 'shorthash';
import * as FileSystem from 'expo-file-system';
import { getChapterImage } from '../utils/MangakakalotClient';

const ImageWebView = ({ pageUrls }) => {
  const [imagePages, setImagePages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const webViewRef = useRef(null);
  const imagesPerPage = 10;

  useEffect(() => {
    const loadImages = async () => {
      try {
        const start = currentPage * imagesPerPage;
        const end = start + imagesPerPage;
        const currentUrls = pageUrls.slice(start, end);

        const imagePromises = currentUrls.map(async (pageUrl) => {
          const pageCacheKey = shorthash.unique(pageUrl);
          const pageUri = `${FileSystem.cacheDirectory}${pageCacheKey}`;
          const pageInfo = await FileSystem.getInfoAsync(pageUri);
          let imageFileData;

          if (pageInfo.exists) {
            imageFileData = await FileSystem.readAsStringAsync(pageUri, { encoding: 'base64' });
          } else {
            imageFileData = await getChapterImage(pageUrl);
            await FileSystem.writeAsStringAsync(pageUri, imageFileData, { encoding: FileSystem.EncodingType.Base64 });
          }

          return { url: pageUrl, data: imageFileData };
        });

        const images = await Promise.all(imagePromises);
        setImagePages(prevImages => [...prevImages, ...images]);
      } catch (error) {
        alert(error.message);
      }
    };

    loadImages();
  }, [currentPage]);

  const handleScroll = (event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const paddingToBottom = 20;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
      setCurrentPage(prevPage => prevPage + 1);
    }
  };

  const htmlContent = `
    <html>
      <body style="padding:0; margin:0;">
        <script>
          let scrollPosition = 0;
          
          function saveScrollPosition() {
            scrollPosition = window.scrollY;
          }

          function restoreScrollPosition() {
            window.scrollTo(0, scrollPosition);
          }

          document.addEventListener('scroll', saveScrollPosition);

          document.addEventListener('DOMContentLoaded', function() {
            const images = document.querySelectorAll('img[data-src]');
            const config = {
              rootMargin: '0px 0px',
              threshold: 0.1
            };

            let observer = new IntersectionObserver(function(entries, self) {
              entries.forEach(entry => {
                if (entry.isIntersecting) {
                  preloadImage(entry.target);
                  self.unobserve(entry.target);
                }
              });
            }, config);

            images.forEach(image => {
              observer.observe(image);
            });

            function preloadImage(img) {
              const src = img.getAttribute('data-src');
              if (!src) { return; }
              img.src = src;
              restoreScrollPosition();
            }
          });
        </script>
        ${imagePages.map((image, index) => `
          <img data-src="data:image/jpeg;base64,${image.data}" alt="Base64 Image" style="width:100%; margin:-1px;" key=${index}>
        `).join('')}
      </body>
    </html>
  `;

  return (
    <WebView
      ref={webViewRef}
      originWhitelist={['*']}
      source={{ html: htmlContent }}
      style={{ flex: 1 }}
      onScroll={handleScroll}
    />
  );
};

export default ImageWebView;
