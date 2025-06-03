import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const TabListItem = ({ item, onSelectItem, iconComponent, selected }) => {
	const [isSelected, setIsSelected] = useState(selected);

	const handleSelectItem = () => {
		setIsSelected((prev) => !prev);
		onSelectItem(item);
	};

	return (
		<View>
			<TouchableOpacity
				className={`p-3 flex-row justify-between  rounded-md my-1 border ${
					isSelected
						? 'border-red-600 bg-red-600/20'
						: 'border-gray-600 bg-secondary/30'
				}`}
				onPress={() => {
					handleSelectItem();
				}}
			>
				<Text className="font-pregular text-white capitalize">
					{item.name}
				</Text>

				{isSelected && <View>{iconComponent}</View>}
			</TouchableOpacity>
		</View>
	);
};

export default React.memo(TabListItem);
