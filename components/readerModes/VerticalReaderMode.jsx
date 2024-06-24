import { ScrollView, TouchableWithoutFeedback, View,  } from 'react-native';
import React, {useImperativeHandle, forwardRef} from 'react';
import ChapterPage from '../ChapterPage';

const VerticalReaderMode = forwardRef(({ chapterUrls, onTap }, ref) => {
  useImperativeHandle(ref, () => ({
    onReadmodeChange: () => {
      console.log("Hello world")
    }
  }));
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
});

export default VerticalReaderMode;