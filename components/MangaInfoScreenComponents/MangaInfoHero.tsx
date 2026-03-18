// components/MangaInfoScreenComponents/HeroSection.tsx
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { memo } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";

interface MangaInfoHeroSectionProps {
  mangaCover: string;
  mangaTitle: string;
  scrollY: Animated.Value; // Pass the raw animated value
  HERO_HEIGHT: number;
  onBack: () => void;
}

const MangaInfoHeroSection = memo(
  ({
    mangaCover,
    mangaTitle,
    scrollY,
    HERO_HEIGHT,
    onBack,
  }: MangaInfoHeroSectionProps) => {
    // Create local interpolations based on the passed scrollY
    const heroScale = scrollY.interpolate({
      inputRange: [-100, 0],
      outputRange: [1.3, 1],
      extrapolate: "clamp",
    });

    return (
      <>
        <View
          style={{ height: HERO_HEIGHT }}
          className="relative w-full overflow-hidden"
        >
          <Animated.View style={{ flex: 1, transform: [{ scale: heroScale }] }}>
            <Image
              source={mangaCover}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              blurRadius={15}
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.4)", "black"]}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          {/* Navigation Buttons */}
          <View className="absolute top-14 left-0 right-0 z-20 flex-row justify-between px-6">
            <Pressable
              onPress={onBack}
              className="w-10 h-10 rounded-full bg-white/10 items-center justify-center border border-white/10"
            >
              <Ionicons name="chevron-back" size={24} color="white" />
            </Pressable>
            <Pressable className="w-10 h-10 rounded-full bg-white/10 items-center justify-center border border-white/10">
              <Ionicons name="heart-outline" size={22} color="white" />
            </Pressable>
          </View>

          {/* Info Content */}
          <View className="absolute inset-0 justify-end items-center px-6 pb-8">
            {/* ... Rest of your Hero Info (Cover, Title, Read Button) ... */}
          </View>
        </View>

        {/* SYNOPSIS & METADATA GRID goes here too if it's part of the header */}
      </>
    );
  },
);

export default MangaInfoHeroSection;
