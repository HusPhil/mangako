import React from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ReaderToastProps {
  isVisible: boolean;
  onClose: () => void;
  onAction: () => void;
  message?: string;
}

const ReaderToast = ({
  isVisible,
  onClose,
  onAction,
  message = "Chapter Completed",
}: ReaderToastProps) => {
  const insets = useSafeAreaInsets();

  if (!isVisible) return null;

  return (
    <View
      style={{
        marginBottom: Platform.OS === "ios" ? insets.bottom : 13,
        zIndex: 9999,
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
            <Text className="text-zinc-100 text-base leading-tight tracking-tighter">
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
      </View>
    </View>
  );
};

export default ReaderToast;
