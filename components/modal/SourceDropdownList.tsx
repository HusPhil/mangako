import { Source } from '@/services/ResponseTypes';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
	LayoutAnimation,
	Platform,
	Pressable,
	Text,
	TouchableOpacity,
	UIManager,
	View,
} from 'react-native';

interface SourceDropdownListProps {
	listItems: Source[];
	selectedIndex: number;
	otherContainerClassName?: any;
	onValueChange: (index: number) => void;
}

const SourceDropDownList = ({
	listItems,
	selectedIndex,
	otherContainerClassName,
	onValueChange,
}: SourceDropdownListProps) => {
	const [opened, setOpened] = useState(false);
	const [selectedItemIndex, setSelectedItemIndex] = useState(0);

	if (
		Platform.OS === 'android' &&
		UIManager.setLayoutAnimationEnabledExperimental
	) {
		UIManager.setLayoutAnimationEnabledExperimental(true);
	}

	const toggleDropDownList = () => {
		LayoutAnimation.configureNext({
			duration: 300,
			create: { type: 'easeIn', property: 'opacity' },
			update: { type: 'linear', springDamping: 0.3, duration: 250 },
		});
		setOpened(!opened);
	};

	return (
		<View>
			<View className={`${otherContainerClassName} flex-row`}>
				<View>
					<TouchableOpacity
						onPress={toggleDropDownList}
						className="relative py-2 px-3"
					>
						<View className="flex-row items-center  justify-between  rounded-md">
							<View className="gap-2 items-center flex-row">
								<MaterialCommunityIcons
									name="source-repository-multiple"
									color={'white'}
									size={18}
								/>

								{opened && (
									<Text
										numberOfLines={1}
										className="text-white capitalize font-pregular mr-4 text-sm"
									>
										{selectedIndex
											? listItems[selectedIndex]
													.sourceName
											: listItems[selectedItemIndex]
													.sourceName}
									</Text>
								)}
							</View>
						</View>
					</TouchableOpacity>

					{opened && (
						<View
							className="absolute top-full left-0 mt-1 w-full rounded-md overflow-hidden z-50 border border-gray-600 "
							onTouchEnd={(e) => e.stopPropagation()}
						>
							{listItems.map((item, index) => {
								if (true) {
									return (
										<Pressable
											key={index}
											disabled={index === selectedIndex}
											className={`w-full p-3 z-50  ${
												index === selectedIndex
													? 'bg-gray-400'
													: 'bg-secondary'
											}`}
											onPress={() => {
												console.log(
													`Selected item: ${item.sourceName}`
												);
												setSelectedItemIndex(index);
												setOpened(!opened);
												onValueChange(index);
											}}
										>
											<Text
												numberOfLines={1}
												className="z-50 capitalize font-pregular text-white"
											>
												{item.sourceName}
											</Text>
										</Pressable>
									);
								}
							})}
						</View>
					)}
				</View>
			</View>
		</View>
	);
};

export default SourceDropDownList;
