import { ReaderMode } from '@/services/cache/types';
import { READER_MODES } from '@/services/cache/useReadingOptions';
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

interface ReaderDropdownListProps {
	title: string;
	listItems: ReaderMode[];
	selectedIndex: number;
	otherContainerStyles?: any;
	onValueChange: (value: ReaderMode) => void;
}

const getOptionIcon = (optionLabel: string): React.ReactNode => {
	switch (optionLabel) {
		case READER_MODES[0].label:
			return (
				<MaterialCommunityIcons
					name="book-arrow-left"
					color={'white'}
					size={20}
				/>
			);
		case READER_MODES[1].label:
			return (
				<MaterialCommunityIcons
					name="book-arrow-right"
					color={'white'}
					size={20}
				/>
			);
		case READER_MODES[2].label:
			return (
				<MaterialCommunityIcons
					name="book-arrow-down"
					color={'white'}
					size={20}
				/>
			);
		default:
			throw Error('Invalid option label');
	}
};

const ReaderDropDownList = ({
	title,
	listItems,
	selectedIndex,
	otherContainerStyles,
	onValueChange,
}: ReaderDropdownListProps) => {
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
			<View className={`${otherContainerStyles} flex-row`}>
				<View>
					<TouchableOpacity
						onPress={toggleDropDownList}
						className="relative"
					>
						<View className="w-full flex-row items-center  justify-between border border-gray-600 bg-secondary/30 p-3 rounded-md">
							<View className="gap-2 items-center flex-row">
								{getOptionIcon(
									selectedIndex
										? listItems[selectedIndex].label
										: listItems[selectedItemIndex].label
								)}

								<Text
									numberOfLines={1}
									className="text-white font-pregular mr-4"
								>
									{selectedIndex
										? listItems[selectedIndex].label
										: listItems[selectedItemIndex].label}
								</Text>
							</View>
							<MaterialCommunityIcons
								color={'#fff'}
								name={opened ? 'chevron-up' : 'chevron-down'}
								size={22}
							/>
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
											className={`w-full p-3 z-50  ${
												index === selectedIndex
													? 'bg-gray-400'
													: 'bg-secondary'
											}`}
											onPress={() => {
												setSelectedItemIndex(index);
												setOpened(!opened);
												onValueChange(item);
											}}
										>
											<Text
												numberOfLines={1}
												className="z-50 font-pregular text-white"
											>
												{item.label}
											</Text>
										</Pressable>
									);
								}
							})}
						</View>
					)}
				</View>
			</View>

			{listItems[selectedIndex].desc && (
				<View>
					<Text className="text-white font-pregular text-sm px-1 py-2 text-start">
						{listItems[selectedIndex].desc}
					</Text>
				</View>
			)}
		</View>
	);
};

export default ReaderDropDownList;
