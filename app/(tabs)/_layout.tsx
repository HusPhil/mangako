import { colors } from "@/constants";
import { Tabs } from "expo-router";
import React from "react";
import {
  Image,
  ImageSourcePropType,
  StatusBar,
  Text,
  View,
} from "react-native";

import icons from "../../constants/icons";

interface TabIconProps {
  icon: ImageSourcePropType;
  color: string;
  name: string;
  focused: boolean;
}

const TabIcon = ({ icon, color, name, focused }: TabIconProps) => {
  return (
    <View className="flex items-center justify-center pt-7">
      <Image
        source={icon}
        tintColor={color}
        resizeMode="contain"
        style={{ width: 20, height: 20 }}
      />
      <View className="items-center justify-center w-[60px]">
        <Text
          className={`${
            focused ? "font-psemibold" : "font-pregular"
          } text-xs text-center`}
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{ color }}
        >
          {name}
        </Text>
      </View>
    </View>
  );
};

const TabsLayout = () => {
  return (
    <>
      <StatusBar
        backgroundColor={colors.secondary.DEFAULT}
        barStyle={"light-content"}
      />
      <Tabs
        screenOptions={{
          tabBarShowLabel: false,
          tabBarActiveTintColor: colors.accent.DEFAULT,
          tabBarInactiveTintColor: "#CDCDE0",
          tabBarStyle: {
            backgroundColor: colors.secondary.DEFAULT,
            borderTopWidth: 1,
            borderTopColor: colors.accent[100],
            height: 80,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                name="Home"
                icon={icons.home}
                color={color}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="browse"
          options={{
            title: "Browse",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                name="Browse"
                icon={icons.browse}
                color={color}
                focused={focused}
              />
            ),
          }}
        />
        {/* <Tabs.Screen
          name="download"
          options={{
            title: "Downloads",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                name="Downloads"
                icon={icons.download}
                color={color}
                focused={focused}
              />
            ),
          }}
        /> */}
      </Tabs>
    </>
  );
};

export default TabsLayout;
