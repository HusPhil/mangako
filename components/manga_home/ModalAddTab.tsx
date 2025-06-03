import '@/global.css';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import ModalPopup from '../modal/ModalPopup';

interface ModalAddTabProps {
	visible: boolean;
	handleAddTab: () => void;
	onClose: () => void;
	setTabTitleToAdd: (text: string) => void;
}
const suggestions = ['Completed', 'Ongoing', 'Queue', 'Reading', 'Dropped'];

const ModalAddTab = ({
	visible,
	handleAddTab,
	onClose,
	setTabTitleToAdd,
}: ModalAddTabProps) => {
	const [isFocused, setIsFocused] = useState(false);
	const [textInputValue, setTextInputValue] = useState('');

	useEffect(() => {
		setTabTitleToAdd(textInputValue);
	}, [textInputValue]);

	return (
		<ModalPopup
			headerTitle="Add a new tab"
			visible={visible}
			modalAction={{
				icon: <MaterialIcons name="add" size={16} color="white" />,
				name: 'Add Tab',
				callback: handleAddTab,
			}}
			headerIcon={
				<MaterialIcons
					name="add-box"
					size={24}
					color="rgba(255 255 255 / 0.3)"
				/>
			}
			handleClose={onClose}
		>
			<View className="">
				<Text className="text-gray-300 text-sm mb-3">
					Create tabs to organize your manga collection{' '}
				</Text>
				<TextInput
					value={textInputValue}
					placeholder="ex: Completed, Ongoing, etc"
					className={`bg-secondary rounded-lg text-white p-3 w-full ${
						isFocused ? 'border border-accent' : ''
					}`}
					onFocus={() => setIsFocused(true)}
					onBlur={() => setIsFocused(false)}
					selectTextOnFocus
					textAlignVertical="center"
					onEndEditing={handleAddTab}
					onChangeText={(text) => setTextInputValue(text)}
					// selectionColor={colors.accent.DEFAULT} // Uncomment if you have colors defined
				/>
				<Text className="text-gray-300 mt-5 text-sm">
					Suggestions:{' '}
				</Text>
				<View className="flex-row flex-wrap gap-2 mt-3">
					{suggestions.map((suggestion) => (
						<TouchableOpacity
							key={suggestion}
							onPress={() => setTextInputValue(suggestion)}
							className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-full  transition-colors duration-200"
						>
							<Text className="text-gray-300 text-xs">
								{suggestion}
							</Text>
						</TouchableOpacity>
					))}
				</View>
			</View>
		</ModalPopup>
	);
};

interface ModalAddTabFooterProps {
	handleAddTab: () => void;
}

export const ModalAddTabFooter = ({ handleAddTab }: ModalAddTabFooterProps) => {
	return (
		<TouchableOpacity
			className="flex-row justify-between border-2 border-white py-1 px-2  rounded-md mt-3 self-center"
			onPress={handleAddTab}
		>
			<View>
				<MaterialIcons
					name="add-circle-outline"
					size={15}
					color="white"
				/>
			</View>
			<Text className=" text-center text-xs font-pregular text-white ml-1">
				Add Tab
			</Text>
		</TouchableOpacity>
	);
};

export default ModalAddTab;
