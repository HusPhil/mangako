import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import colors from '../../constants/colors';

const TabListItem = ({item, onSelectItem}) => {
    const [isSelected, setIsSelected] = useState(false);

    const handleSelectItem = () => {
        setIsSelected(prev => !prev)
        onSelectItem(item)
    }

    return (
        <View>
        <TouchableOpacity
            className="p-1 px-3 flex-row justify-between"
            onPress={() => {
            handleSelectItem()
            }}>
            
            <Text className="font-pregular text-white p-1 text-xs capitalize">
            {item}
            </Text>

            {isSelected && (
            <View>
                <MaterialIcons name="delete-outline" size={18} color={colors.accent.DEFAULT} />
            </View>
            )}

        </TouchableOpacity>
        </View>
    )
}

export default React.memo(TabListItem)