import React, { useMemo, useRef, useState } from 'react';
import { Dimensions, View, StatusBar } from 'react-native';
import { Image } from 'expo-image';
import ImageZoom from 'react-native-image-pan-zoom';

const ExpoImage = ({ imgSrc, imgSize, onLoad, }) => {
  const imageStyles = useMemo(() => ({
    width: imgSize.width,
    height: undefined,
    aspectRatio: imgSize.aspectRatio,
  }), [imgSize.width, imgSize.aspectRatio]);


  return (
          <Image 
            source={imgSrc} 
            style={imageStyles} 
            cachePolicy='none' 
            key={`${imgSrc}-${imgSize.width}-${imgSize.aspectRatio}`}
          />
  );
};

export default React.memo(ExpoImage);
