import React, { useCallback, useRef } from 'react';
import { View, Dimensions, TouchableWithoutFeedback, FlatList, Image } from 'react-native';
import ChapterPage from '../ChapterPage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const HorizontalReaderMode = ({ chapterUrls, onLongPress }) => {
  const flRef = useRef(null)

  const renderItem = useCallback(({ item, index }) => (
    <View className="m-0 p-0" >
        <ChapterPage pageUrl={item} handleSwipe={
          (swipeRight) => {
            if(swipeRight) {
              swipeToItem(index + 1)
            }
            else {
              swipeToItem(index - 1)
            }
        }}
        maxPanFunc={()=>{
          const scroller = flRef.current.getNativeScrollRef()
        }}
        />
    </View>
  ), [onLongPress]);
 
  const swipeToItem = (index) => {
    if (flRef.current) {
      flRef.current.scrollToIndex({ animated: true, index: index });
    }
  };

  return (
    <FlatList
    onStartShouldSetResponder={()=>{
      return true
    }}
      ref={flRef}
      data={chapterUrls}
      renderItem={renderItem}
      keyExtractor={(item, index) => `${item}-${index}`}
      horizontal
      pagingEnabled
      inverted
    />
  );
};

export default HorizontalReaderMode;