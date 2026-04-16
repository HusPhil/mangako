import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface EmptyListPlaceholderProps {
  iconName?: React.ComponentProps<typeof MaterialIcons>["name"];
  iconSize?: number;
  iconColor?: string;
  title?: string;
}

const EmptyListPlaceholder = ({
  iconName = "web-asset-off",
  iconSize = 80, // Slightly larger since the background circle is gone
  iconColor = "#cbd5e1", // A lighter slate so it sits softly in the background
  title = "There's nothing here!", // A more casual, friendly message
}: EmptyListPlaceholderProps) => {
  return (
    <View style={styles.container}>
      <MaterialIcons
        name={iconName}
        size={iconSize}
        color={iconColor}
        style={styles.icon}
      />

      {!!title && <Text className="font-semibold text-primary">{title}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 40, // Gives it breathing room if placed in a tight layout
  },
  icon: {
    marginBottom: 16, // Crucial: separates the icon from the text
    opacity: 0.9, // Softens the icon slightly
  },
});

export default EmptyListPlaceholder;
