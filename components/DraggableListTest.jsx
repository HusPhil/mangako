import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  PanResponder,
  Animated,
} from 'react-native';

// Initial list of items
const initialData = [
  { id: '1', label: 'Item 1', backgroundColor: '#FF5733' },
  { id: '2', label: 'Item 2', backgroundColor: '#33FF57' },
  { id: '3', label: 'Item 3', backgroundColor: '#3357FF' },
  { id: '4', label: 'Item 4', backgroundColor: '#FF33A1' },
  { id: '5', label: 'Item 5', backgroundColor: '#33FFA1' },
];

const DraggableList = () => {
  const [data, setData] = useState(initialData);
  const scrollY = useRef(new Animated.Value(0)).current;
  const currentIndex = useRef(null);
  const currentY = useRef(new Animated.Value(0)).current;
  const scrollOffset = useRef(0);

  // Function to handle moving an item
  const moveItem = (fromIndex, toIndex) => {
    const updatedData = [...data];
    const movedItem = updatedData.splice(fromIndex, 1)[0];
    updatedData.splice(toIndex, 0, movedItem);
    setData(updatedData);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event(
        [null, { dy: currentY }],
        { useNativeDriver: false }
      ),
      onPanResponderGrant: (_, gestureState) => {
        const index = Math.floor((gestureState.y0 + scrollOffset.current) / ITEM_HEIGHT);
        currentIndex.current = index;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (currentIndex.current !== null) {
          const toIndex = Math.floor((gestureState.moveY + scrollOffset.current) / ITEM_HEIGHT);
          moveItem(currentIndex.current, toIndex);
        }
        currentY.setValue(0);
      },
    })
  ).current;

  const onScroll = (e) => {
    scrollOffset.current = e.nativeEvent.contentOffset.y;
    scrollY.setValue(scrollOffset.current);
  };

  const renderItem = ({ item, index }) => {
    const isDragging = currentIndex.current === index;
    const translateY = isDragging ? currentY : new Animated.Value(0);

    return (
      <Animated.View
        style={[
          styles.item,
          { backgroundColor: item.backgroundColor, transform: [{ translateY }] },
          isDragging && styles.draggingItem,
        ]}
        {...panResponder.panHandlers}
      >
        <Text style={styles.text}>{item.label}</Text>
      </Animated.View>
    );
  };

  return (
    <FlatList
      data={data}
      onScroll={onScroll}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
    />
  );
};

const ITEM_HEIGHT = 70;

const styles = StyleSheet.create({
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
    marginHorizontal: 16,
    borderRadius: 5,
  },
  text: {
    fontSize: 18,
    color: 'white',
  },
  draggingItem: {
    opacity: 0.8,
  },
});

export default DraggableList;
