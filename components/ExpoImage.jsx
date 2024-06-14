import React, { useMemo } from 'react';
import { Image } from 'expo-image';

const ExpoImage = ({ imgSrc, imgWidth, imgAR }) => {
  const imageStyles = useMemo(() => ({
    width: imgWidth,
    height: undefined,
    aspectRatio: imgAR,
  }), [imgWidth, imgAR]);

  return (
    <Image source={imgSrc} style={imageStyles} cachePolicy={'memory'} />
  );
};

export default React.memo(ExpoImage);
