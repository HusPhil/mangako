import React, { useMemo, useRef, useState } from 'react';
import { Dimensions, View } from 'react-native';
import { Image } from 'expo-image';
import ImageZoom from 'react-native-image-pan-zoom';

const ExpoImage = ({ imgSrc, imgWidth, imgHeight, imgAR, handleSwipe, onMove }) => {
  const imageStyles = useMemo(() => ({
    width: imgWidth,
    height: undefined,
    aspectRatio: imgAR,
  }), [imgWidth, imgAR]);

  const viewRef = useRef(null);
  const imgZoomRef = useRef(null);
  const scaleValue = useRef(1); 
  const [maxPan, setMaxPan] = useState(false);

  const handleHorizontalOuterRangeOffset = (offsetX) => {
    if (Math.abs(offsetX) > Dimensions.get('window').width / 2) {
      handleSwipe(offsetX > 0 ? 'right' : 'left');
      setMaxPan(false); // Reset maxPan after swipe
    }
  };

  return (
    <View ref={viewRef}>
      <ImageZoom 
        ref={imgZoomRef}
        cropWidth={Dimensions.get('window').width}
        cropHeight={Dimensions.get('window').height}
        imageWidth={imgWidth}
        imageHeight={imgWidth / imgAR}
        minScale={1}
        useNativeDriver
        onStartShouldSetPanResponder={(e) => {
          return (e.nativeEvent.touches.length === 2 || scaleValue.current > 1) && !maxPan;
        }}
        onMove={({ scale }) => {
          scaleValue.current = scale;
          onMove && onMove({ scale });
        }}
        horizontalOuterRangeOffset={handleHorizontalOuterRangeOffset}
      >
        <View
          style={{ width: '100%', height: '100%' }}
          onStartShouldSetResponder={(e) => {
            const maxPanHolder = maxPan;
            setMaxPan(false);
            return e.nativeEvent.touches.length < 2 && maxPanHolder;
          }}
        >
          <Image 
            source={imgSrc} 
            style={imageStyles} 
            cachePolicy='none' 
            key={`${imgSrc}-${imgWidth}-${imgAR}`}
          />
        </View>
      </ImageZoom>
    </View> 
  );
};

export default React.memo(ExpoImage);
