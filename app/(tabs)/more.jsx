
import React, {useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import DragList, {DragListRenderItemInfo} from 'react-native-draglist';
import NumericRange from '../../components/NumericRange';
import { SafeAreaView } from 'react-native-safe-area-context';


const SOUND_OF_SILENCE = ['hello', 'darkness', 'my', 'old', 'friend'];

const more = () => {
  const [data, setData] = useState(SOUND_OF_SILENCE);

  function keyExtractor(str) {
    return str;
  }

  function renderItem(info) {
    const {item, onDragStart, onDragEnd, isActive} = info;

    return (
      <TouchableOpacity
        key={item}
        onPressIn={onDragStart}
        onPressOut={onDragEnd}
        className="p-2">
        <Text>{item}</Text>
      </TouchableOpacity>
    );
  }

  async function onReordered(fromIndex, toIndex) {
    const copy = [...data]; // Don't modify react data in-place
    const removed = copy.splice(fromIndex, 1);

    copy.splice(toIndex, 0, removed[0]); // Now insert at the new pos
    setData(copy);
  }

  return (
    <SafeAreaView>
      {/* <DragList
        data={data}
        keyExtractor={keyExtractor}
        onReordered={onReordered}
        renderItem={renderItem}
      /> */}
      <NumericRange />
    </SafeAreaView>
  );
}

export default more
