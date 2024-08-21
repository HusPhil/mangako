
import React, {useCallback, useEffect, useState} from 'react';
import {StyleSheet, Text, ToastAndroid, TouchableOpacity, View} from 'react-native';
import DragList, {DragListRenderItemInfo} from 'react-native-draglist';
import NumericRange from '../../components/NumericRange';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import colors from '../../constants/colors';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlashList } from '@shopify/flash-list';

const download = () => {
  const params = useLocalSearchParams()
  const [downloadQueue, setDownloadQueue] = useState([]);

  const AsyncEffect = useCallback(async () => {
    console.log(params)
    if(Object.keys(params).length === 0) {
      ToastAndroid.show(
        "No selected chapters",
        ToastAndroid.SHORT
      )
      return
    }

    const chaptersToDownloadAsJsonString =  await AsyncStorage.getItem(params.selectedChaptersCacheKey)
    const chaptersToDownload = JSON.parse(chaptersToDownloadAsJsonString)

    setDownloadQueue(chaptersToDownload)

    if(!chaptersToDownload) {
      ToastAndroid.show(
        "No selected chapters",
        ToastAndroid.SHORT
      )
    }

    console.log(chaptersToDownload[0])

    await AsyncStorage.removeItem(params.selectedChaptersCacheKey)

  }, [])

  useEffect(() => {
    AsyncEffect()
  }, [])

  const renderItem = useCallback(({ item, index }) => {
    if(item) {
      return (
        <Text className="text-white font-pregular text-xl">{`[${index}] ${item.chapterUrl}`}</Text>
      )
    }
  }, [])

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <View className="flex-1 bg-primary">
        <FlashList 
          data={downloadQueue}
          renderItem={renderItem}
          estimatedItemSize={500}
        />
      </View>
    </SafeAreaView>
  );
}

export default download
