import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

const TabListItem = ({ item, onSelectItem, iconComponent, selected }) => {
  const [isSelected, setIsSelected] = useState(selected);

  const handleSelectItem = () => {
    setIsSelected((prev) => !prev);
    onSelectItem(item);
  };

  return (
    <View>
      <TouchableOpacity
        className="p-1 px-3 flex-row justify-between"
        onPress={() => {
          handleSelectItem();
        }}
      >
        <Text className="font-pregular text-white p-1 text-xs capitalize">
          {item.title}
        </Text>

        {isSelected && <View>{iconComponent}</View>}
      </TouchableOpacity>
    </View>
  );
};

export default React.memo(TabListItem);
