import { ScrollView, TouchableWithoutFeedback, View } from 'react-native';
import React from 'react';
import ChapterPage from '../ChapterPage';

const VerticalReaderMode = ({ chapterUrls, onTap }) => {
  const renderItem = (item, index) => (
    <TouchableWithoutFeedback key={`${item}-${index}`} onPress={onTap}>
      <View className="w-full self-center">
            <ChapterPage pageUrl={item}/>
      </View>
    </TouchableWithoutFeedback>
);
  return (
    <ScrollView>
        {chapterUrls.map(renderItem)}
    </ScrollView>
  );
};

export default VerticalReaderMode;