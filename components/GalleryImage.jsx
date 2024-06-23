import React, { useState } from 'react';
import {  useWindowDimensions } from 'react-native';
import { getAspectRatioSize } from 'react-native-zoom-toolkit';
import { Image } from 'expo-image';

const GalleryImage = ({ uri, index }) => {
  const { width, height } = useWindowDimensions();
  const [resolution, setResolution] = useState({
    width: 1,
    height: 1,
  });

  

  const size = getAspectRatioSize({
    aspectRatio: resolution.width / resolution.height,
    width: height > width ? width : undefined,
    height: height > width ? undefined : height,
  });

  return (
    <Image
      source={{ uri }}
      style={size}

    />
  );
};

export default GalleryImage;
