import React, { useState } from 'react';
import { Image, useWindowDimensions } from 'react-native';
import { getAspectRatioSize } from 'react-native-zoom-toolkit';

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
      resizeMethod={'scale'}
      resizeMode={'cover'}
      onLoad={(e) => {
        setResolution({
          width: e.nativeEvent.source.width,
          height: e.nativeEvent.source.height,
        });
      }}
    />
  );
};

export default GalleryImage;
