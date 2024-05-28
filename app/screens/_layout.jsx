import { View, Text } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'

const ScreensLayout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="mangaInfo" options={{headerShown:false, headerTitle: "Information"}}
      />
      <Stack.Screen
        name="mangaReader" options={{headerShown: false}}
      />
    </Stack>
  )
}

export default ScreensLayout