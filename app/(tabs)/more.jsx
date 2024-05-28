import { View, Text } from 'react-native'
import React from 'react'

import colors from '../../constants/colors'
import { useLocalSearchParams } from 'expo-router'

const more = () => {
  const params = useLocalSearchParams();
  console.log(params)
  return (
    <View>
      <Text>more</Text>
    </View>
  )
}

export default more