import React, { useMemo, useRef, useState } from 'react';
import { Dimensions, View, StatusBar } from 'react-native';
import { Image } from 'expo-image';
import ImageZoom from 'react-native-image-pan-zoom';

const ExpoImage = ({ imgSrc, imgWidth, imgHeight, imgAR, handleSwipe, onMove, maxPanFunc }) => {
  const imageStyles = useMemo(() => ({
    width: imgWidth,
    height: undefined,
    aspectRatio: imgAR,
  }), [imgWidth, imgAR]);

  const viewRef = useRef(null);

  return (
    <View ref={viewRef} className="h-full w-full justify-center">
          <Image 
            source={imgSrc} 
            style={imageStyles} 
            cachePolicy='none' 
            key={`${imgSrc}-${imgWidth}-${imgAR}`}
          />
    </View> 
  );
};

export default React.memo(ExpoImage);
