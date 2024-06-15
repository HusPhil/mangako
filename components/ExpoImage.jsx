import React, { useMemo } from 'react';
import { Dimensions } from 'react-native';
import { Image } from 'expo-image';
import ImageZoom from 'react-native-image-pan-zoom';


const ExpoImage = ({ imgSrc, imgWidth, imgHeight, imgAR, }) => {
  const imageStyles = useMemo(() => ({
    width: imgWidth,
    height: undefined,
    aspectRatio: imgAR,
  }), [imgWidth, imgAR]);

  return (
    <ImageZoom 
      cropWidth={Dimensions.get('window').width}
      cropHeight={Dimensions.get('window').height}
      imageWidth={imgWidth}
      imageHeight={Dimensions.get('window').height}
      minScale={1}
    >
    <Image 
      source={imgSrc} 
      style={imageStyles} 
      cachePolicy={'none'} 
      key={`${imgSrc}-${imgWidth}-${imgAR}`}
      />
    </ImageZoom>
  );
};

export default React.memo(ExpoImage);
