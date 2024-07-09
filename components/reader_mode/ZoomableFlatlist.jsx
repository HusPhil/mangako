import { View, Text, FlatList } from 'react-native'
import React from 'react'
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

const ZoomableFlatlist = ({currentManga, chapterPages}) => {

  const filePaths = [
    "file:///data/user/0/host.exp.exponent/cache/xNGG5/p5gIw/chapterPageImages/1MPtRs",
    "file:///data/user/0/host.exp.exponent/cache/xNGG5/p5gIw/chapterPageImages/pcQ1v",
    "file:///data/user/0/host.exp.exponent/cache/xNGG5/p5gIw/chapterPageImages/hi7YL",
    "file:///data/user/0/host.exp.exponent/cache/xNGG5/p5gIw/chapterPageImages/1YK2bT"
];

  const renderItem = React.useCallback(
    ({ item }) => {
      return (
        <View>
          <Image
            source={item}
            style={{
              width: 400,
              height: 400,
            }}
          />
        </View>
      );
    },
    []
  );
  return (
    <View
      className="flex-1"
    >
      <FlashList
        data={filePaths}
        pagingEnabled
        // horizontal
        keyExtractor={(item) => item}
        renderItem={renderItem}
        estimatedItemSize={500}
      />
    </View>
  )
}

export default ZoomableFlatlist