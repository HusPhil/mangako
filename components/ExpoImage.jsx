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
  const imgZoomRef = useRef(null);
  const scaleValue = useRef(1); 
  const [maxPan, setMaxPan] = useState(false)

  return (
    <View ref={viewRef}>
      <ImageZoom 
        ref={imgZoomRef}
        cropWidth={Dimensions.get('window').width}
        cropHeight={Dimensions.get('window').height + StatusBar.currentHeight}
        imageWidth={imgWidth}
        imageHeight={imgWidth / imgAR} 
        minScale={1}
        useNativeDriver
        onStartShouldSetPanResponder={(e) => {
          return (e.nativeEvent.touches.length === 2 || scaleValue.current > 1) && !maxPan;
        }}
        onPanResponderTerminationRequest={()=>{
          return true
        }}
        onMove={(e) => {
          console.log(e)
          scaleValue.current = e.scale;
          onMove && onMove(e);
        }}
        responderRelease={(e) => {
          console.log(e)
        }}
        horizontalOuterRangeOffset={(offSetX)=>{
          if(offSetX === 100 || offSetX === -100) {
            const right = offSetX > 0
            handleSwipe(right)
          }
        }}
      >
        
          <Image 
            source={imgSrc} 
            style={imageStyles} 
            cachePolicy='none' 
            key={`${imgSrc}-${imgWidth}-${imgAR}`}
          />
      </ImageZoom>
    </View> 
  );
};

export default React.memo(ExpoImage);
