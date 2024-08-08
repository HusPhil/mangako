import React, { useEffect, useCallback } from 'react';
import { View, Text, StatusBar, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useFonts } from 'expo-font';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import colors from '../../constants/colors';

// Define Tab Screens
const HomeScreen = ({ title }) => (
  <View className="bg-primary h-full">
    <Text style={styles.screenText}>{title}</Text>
  </View>
);

const SettingsScreen = () => (
  <View style={styles.screenContainer}>
    <Text style={styles.screenText}>Settings Screen</Text>
  </View>
);

const Tab = createMaterialTopTabNavigator();

const Index = () => {
  const faveData = ['Reading', 'Queue', 'Completed', 'Dropped', "KinemeMoNaMahaba"];
  const [loaded] = useFonts({
    "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
  });

  if (!loaded) {
    return null;
  }

  useEffect(
    () => {
      StatusBar.setBackgroundColor(colors.secondary.DEFAULT)
      StatusBar.setBarStyle('light-content')
    }
  );

  return (  
    <SafeAreaView style={styles.container}>
      <View className="flex-row justify-between items-center mx-4">
        <Text className="text-3xl mt-8 mb-2 text-white font-pregular ">Manga List</Text>
        <View className="flex-row mt-4 justify-around w-[35%]">
            <TouchableOpacity><MaterialIcons name="filter-list" size={20} color="white" /></TouchableOpacity>
            <TouchableOpacity><MaterialIcons name="playlist-add" size={20} color="white" /></TouchableOpacity>
            <TouchableOpacity><MaterialIcons name="playlist-remove" size={20} color="white" /></TouchableOpacity>
        </View>
      </View>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: colors.accent[100],
          tabBarIndicatorStyle: { backgroundColor: colors.accent.DEFAULT,},
          tabBarLabelStyle: styles.tabBarLabelStyle,
          tabBarItemStyle: {width: "auto"},
          tabBarStyle: { backgroundColor: 'transparent',},
          tabBarAllowFontScaling: true,
          tabBarScrollEnabled: true,
        }}
        backBehavior='order'
      >
        {faveData.map((tabTitle, index) => (
          <Tab.Screen
            key={index}
            name={tabTitle}
            options={{ title: tabTitle }}
          >
            {() => <HomeScreen title={tabTitle} />}
          </Tab.Screen>
        ))}
      </Tab.Navigator>
    </SafeAreaView>
  );
};

// Define styles for components
const styles = StyleSheet.create({
  tabBarLabelStyle: {
    color: 'white', 
    fontFamily: "Poppins-Regular",
    fontSize: 12,
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

export default Index;
