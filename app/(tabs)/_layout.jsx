import { View, Text } from 'react-native'
import React from 'react'
import { Tabs, Redirect } from 'expo-router'

const TabsLayout = () => {
  return (
    <Tabs>
        <Tabs.Screen
            name="index"
            options={{
                title: "Home",
                headerShown: false,
            }}
        >
        </Tabs.Screen>
        <Tabs.Screen
            name="profile"
        >
        </Tabs.Screen>
    </Tabs>
  )
}

export default TabsLayout