import React, { useMemo, useRef, useState } from 'react';
import { Dimensions, View, StatusBar } from 'react-native';
import { Image } from 'expo-image';
import ImageZoom from 'react-native-image-pan-zoom';

const ExpoImage = ({ imgSrc, imgWidth, imgAR, }) => {
  const imageStyles = useMemo(() => ({
    width: imgWidth,
    height: undefined,
    aspectRatio: imgAR,
  }), [imgWidth, imgAR]);


  return (
          <Image 
            source={imgSrc} 
            style={imageStyles} 
            cachePolicy='none' 
            key={`${imgSrc}-${imgWidth}-${imgAR}`}
          />
  );
};

export default React.memo(ExpoImage);
