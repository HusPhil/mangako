import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import React, { useCallback } from 'react'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { MaterialIcons } from '@expo/vector-icons';

import { MangaGrid } from '../manga_menu';
import colors from '../../constants/colors';

const Tab = createMaterialTopTabNavigator();


const TabsView = ({tabs, onAddTab}) => {

  const getTabScreenComponent = useCallback((tabItem) => {
    if(tabItem.data.length > 0) {
      return (
        <View className="flex-1 bg-primary pt-3">
          <MangaGrid 
            mangaData={tabItem.data}
            numColumns={3}
          />
        </View>
      )
    }
    return (
      <View className="h-full w-full justify-center items-center bg-primary">
        <Text className="text-center font-pregular text-white">No manga has been added here yet!</Text>
      </View>
    )
  }, [tabs])

  return (
    <View className='flex-1'>
        {tabs.length > 0 ? (
            <Tab.Navigator
                screenOptions={{ 
                    tabBarActiveTintColor: colors.accent[100],
                    tabBarIndicatorStyle: { backgroundColor: colors.accent.DEFAULT},
                    tabBarLabelStyle: styles.tabBarLabelStyle,
                    tabBarItemStyle: {width: "auto"},
                    tabBarStyle: { backgroundColor: 'transparent'},
                    tabBarScrollEnabled: true,
                    tabBarPressColor: colors.accent[100],
                }}>
                {tabs.map((tabItem, index) => (
                    <Tab.Screen
                        key={index}
                        name={tabItem.title}
                        options={{ title: tabItem.title }}
                        >
                        {() => (getTabScreenComponent(tabItem))}
                    </Tab.Screen>
                ))}
            </Tab.Navigator>
        ) : (
          <View className="justify-center items-center h-full w-full">
            <MaterialIcons name="not-interested" size={75} color="white" />
            <Text className="font-pregular text-white text-center mt-2">No tabs were found!</Text>
            <TouchableOpacity className="flex-row justify-between border-2 border-white py-1 px-2  rounded-md mt-3 self-center"
              onPress={onAddTab}>
              <View>
              <MaterialIcons name="add-circle-outline" size={15} color="white" />
              </View>
              <Text className=" text-center text-xs font-pregular text-white ml-1">Add new Tab</Text>
            </TouchableOpacity>
          </View>
        )}
    </View>
  )
}

const styles = StyleSheet.create({
  tabBarLabelStyle: {
    color: 'white', 
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    whiteSpace: 'nowrap', // For web, but in React Native this isn't needed
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  container: {
    flex: 1,
    backgroundColor: colors.primary.DEFAULT,
  },
  screenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenText: {
    fontSize: 18,
    // fontFamily: ["Poppins-Regular", "sans-serif"],
    color: '#000', // Change this to colors.secondary.DEFAULT if you have a specific color
  },
});

export default React.memo(TabsView)