import { useState, useEffect, useRef } from 'react';
import { fetchPageData, getImageDimensions } from "./_reader";

const useLoadPageImages = (currentManga, initialSize) => {
  const [pageImages, setPageImages] = useState(initialSize > 0 ? Array(initialSize).fill(undefined) : 21);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadPageImages = async (pageNum, pageUrl, signal) => {
    try {
      const fetchedImgSrc = await fetchPageData(currentManga.manga, currentManga.chapter, pageUrl, signal);
      if (fetchedImgSrc.error) {
        setPageImages(prev => {
          const newPageImages = [...prev];
          newPageImages[pageNum] = { imgUri: undefined, imgSize: null, error: fetchedImgSrc.error };
          return newPageImages;
        });
        throw fetchedImgSrc.error;
      }

      const imgSize = await getImageDimensions(fetchedImgSrc.data);
      if (isMounted.current) {
        setPageImages(prev => {
          const newPageImages = [...prev];
          newPageImages[pageNum] = { imgUri: fetchedImgSrc.data, imgSize };
          return newPageImages;
        });
      }
    } catch (error) {
      console.log("Error loading pages:", error);
    }
  };

  return { pageImages, loadPageImages };
};

export default useLoadPageImages;
