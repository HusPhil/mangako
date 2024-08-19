import { View, Text, Image, StatusBar } from 'react-native'
import React from 'react'
import { Tabs, Redirect } from 'expo-router'
import colors from '../../constants/colors'

import icons  from "../../constants/icons"



const TabIcon = ({icon, color, name, focused}) => {
  return (
    <>
      <View className="items-center justify-center gap-1">
        <Image 
          source={icon}
          tintColor={color}
          resizeMode='contain'
          className="w-5 h-5"
        />
        <Text className={`${focused ? 'font-psemibold' : 'font-pregular'} text-xs`} style={{color:color}}>
          {name}
        </Text>
      </View>
    </>

  )
}

const TabsLayout = () => {
  return (
    <>
    <StatusBar backgroundColor={colors.secondary.DEFAULT} barStyle={'light-content'}/>
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.accent.DEFAULT,
        tabBarInactiveTintColor: "#CDCDE0",
        tabBarStyle: {
          backgroundColor: colors.secondary.DEFAULT,
          borderTopWidth: 1,
          borderTopColor: "#232533",
          height: 60,
        }
      }}
    >
        <Tabs.Screen
            name="index"
            options={{
              title: "Home",
              headerShown: false,
              tabBarIcon: ({color, focused}) => (
                  <TabIcon 
                    name="Home"
                    icon={icons.home}
                    color={color}
                    focused={focused}
                  />
              )
            }}
        />
        <Tabs.Screen
            name="browse"
            options={{
              title: "Browse",
              headerShown: false,
              tabBarIcon: ({color, focused}) => (
                  <TabIcon 
                    name="Browse"
                    icon={icons.browse}
                    color={color}
                    focused={focused}
                  />
              )
            }}
        />
        <Tabs.Screen
            name="download"
            options={{
              title: "Downloads",
              headerShown: false,
              tabBarIcon: ({color, focused}) => (
                  <TabIcon 
                    name="Downloads"
                    icon={icons.download}
                    color={color}
                    focused={focused}
                  />
              )
            }}
        />
    </Tabs>
    </>
  )
}

export default TabsLayout