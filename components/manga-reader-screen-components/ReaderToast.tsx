import React, { useEffect, useRef } from "react";
import { Animated, Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ReaderToastProps {
  isVisible: boolean;
  onClose: () => void;
  onAction: () => void;
  message?: string;
  duration?: number; // Pass the same duration as your timer
}

const ReaderToast = ({
  isVisible,
  onClose,
  onAction,
  message = "Chapter Completed",
  duration = 10 * 1000,
}: ReaderToastProps) => {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      // Entrance Animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Progress Bar Animation
      progressAnim.setValue(0);
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: duration,
        useNativeDriver: false, // Width doesn't support native driver
      }).start();
    } else {
      // Exit Animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, duration]);

  if (!isVisible) return null;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <Animated.View
      style={{
        marginBottom: Platform.OS === "ios" ? insets.bottom : 13,
        zIndex: 9999,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
      className="absolute bottom-0 left-0 right-0 items-center px-4"
    >
      <View className="w-full bg-zinc-900 border border-zinc-700/50 rounded-md shadow-2xl overflow-hidden">
        <View className="flex-row items-center px-4 py-4">
          {/* Close Icon */}
          <Pressable
            onPress={onClose}
            className="mr-3 bg-zinc-800 h-8 w-8 items-center justify-center rounded-md"
            hitSlop={15}
          >
            <Text className="text-zinc-400 font-bold">✕</Text>
          </Pressable>

          {/* Message Content */}
          <View className="flex-1">
            <Text className="text-zinc-100  text-base leading-tight tracking-tighter">
              {message}
            </Text>
          </View>

          {/* Action Button */}
          <Pressable
            onPress={() => {
              onClose();
              onAction();
            }}
            className="ml-3 bg-primary px-5 py-2.5 rounded-md active:opacity-80"
          >
            <Text className="text-secondary font-pbold text-xs uppercase tracking-widest">
              Next
            </Text>
          </Pressable>
        </View>

        {/* Progress Bar (Visual feedback for the timer) */}
        <View className="h-[3px] w-full bg-zinc-800">
          <Animated.View
            style={{ width: progressWidth }}
            className="h-full bg-primary/40"
          />
        </View>
      </View>
    </Animated.View>
  );
};

export default ReaderToast;
