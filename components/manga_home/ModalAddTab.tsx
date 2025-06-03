import '@/global.css';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

interface ModalAddTabProps {
	handleAddTab: () => void;
	onClose: () => void;
	setTabTitleToAdd: (text: string) => void;
}
const suggestions = ['Completed', 'Ongoing', 'Queue', 'Reading', 'Dropped'];

const ModalAddTab = ({
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
		<>
			<View className="">
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
				<Text className="text-gray-300 mt-5">Suggestions: </Text>
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
		</>
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
