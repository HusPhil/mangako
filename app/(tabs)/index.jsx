import { View, Text } from 'react-native'
import React, { useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from 'expo-router'


const index = () => {

  return (
    <SafeAreaView className="bg-primary h-full justify-center items-center">
      <Text className="text-white">index</Text>
      <View className="w-[100px] h-[100px] bg-red-700" style={{shadowColor:'white', elevation: 5}}></View>
    </SafeAreaView>
  )
}

export default index