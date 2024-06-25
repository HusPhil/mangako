import { FlatList, ScrollView, TouchableWithoutFeedback, View,  } from 'react-native';
import React, {useImperativeHandle, forwardRef, useCallback} from 'react';
import ChapterPage from '../ChapterPage';
import { FlashList } from '@shopify/flash-list';

const VerticalReaderMode = forwardRef(({ chapterUrls, onTap }, ref) => {
  useImperativeHandle(ref, () => ({
    onReadmodeChange: () => {
      console.log("Read mode  in ver")
    }
  }));
  const renderItem = useCallback(({ item, index }) => (
    <TouchableWithoutFeedback onPress={onTap}>
      <View>
        <ChapterPage pageUrl={item}/>
      </View>
    </TouchableWithoutFeedback>
  ), [chapterUrls, onTap]);
  return (
    <FlatList 
      disableIntervalMomentum
      disableVirtualization
      data={chapterUrls}
      renderItem={renderItem}
      keyExtractor={(item) => item}
      on
    />
  );
});

export default VerticalReaderMode;