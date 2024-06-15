import React, { useCallback } from 'react';
import { View, Dimensions, TouchableWithoutFeedback, FlatList, Text } from 'react-native';
import ChapterPage from '../ChapterPage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const HorizontalReaderMode = ({ chapterUrls, onLongPress }) => {
  const renderItem = useCallback(({ item }) => (
    <View style={{ flex: 1, justifyContent: 'center' }}>
      <TouchableWithoutFeedback onLongPress={onLongPress}>
        <ChapterPage pageUrl={item} />
      </TouchableWithoutFeedback>
      <View>
        <Text style={{ fontWeight: 'bold', fontSize: 36 }}>Hello</Text>
      </View>
    </View>
  ), [onLongPress]);

  return (
    <FlatList
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
