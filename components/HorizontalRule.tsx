import React from 'react';
import { Text, View } from 'react-native';

interface HorizontalRuleProps {
	displayText?: string;
	otherStyles?: string;
}

const HorizontalRule = ({ displayText, otherStyles }: HorizontalRuleProps) => {
	return (
		<View className={`flex-row items-center ${otherStyles}`}>
			<View className="flex-1 h-[1px] bg-white" />
			{displayText && (
				<>
					<View>
						<Text className="text-center font-pregular text-base text-white p-2">
							{displayText}
						</Text>
					</View>
					<View className="flex-1 h-[1px] bg-white" />
				</>
			)}
		</View>
	);
};

export default HorizontalRule;
