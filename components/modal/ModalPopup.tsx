import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
	KeyboardAvoidingView,
	Modal,
	Platform,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';

type Variant = 'warn' | 'success' | 'danger' | undefined;

interface ModalPopupProps {
	otherStyles?: any;
	children: React.ReactNode;
	visible: boolean;
	variant?: Variant;
	footerText?: string;
	footerComponent?: React.ReactNode;
	headerComponent?: React.ReactNode;
	headerTitle?: string;
	handleClose: () => void;
	headerEnable?: boolean;
}

const getVariantBorder = (variant: Variant) => {
	switch (variant) {
		case 'warn':
			return 'border-yellow-400';
		case 'success':
			return 'border-green-400';
		case 'danger':
			return 'border-accent';
		default:
			return 'border-white/30';
	}
};

const ModalPopup = ({
	otherStyles,
	headerTitle,
	variant,
	children,
	visible,
	footerComponent,
	handleClose,
	headerEnable,
}: ModalPopupProps) => {
	return (
		<Modal
			visible={visible}
			onRequestClose={handleClose}
			animationType="fade"
			transparent
			statusBarTranslucent
		>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={{ flex: 1 }}
			>
				<View
					className="bg-black/75 p-7 justify-center items-center flex-1"
					onTouchEnd={handleClose}
				>
					<View
						onTouchEnd={(e) => e.stopPropagation()}
						className={`max-w-md marker max-h-[420px] bg-primary rounded-md justify-center w-full border ${getVariantBorder(
							variant
						)}`}
					>
						<View className="w-full p-5 border-b border-white/30 flex-row">
							<Text className="text-white">
								{headerTitle || 'Untitled'}
							</Text>
							<TouchableOpacity onPress={handleClose}>
								<MaterialIcons
									name="close"
									size={20}
									color="white"
								/>
							</TouchableOpacity>
						</View>
						<View className="w-full p-5">{children}</View>

						<View
							style={{
								borderTopWidth: 1,
								borderTopColor: 'rgba(255, 255, 255, 0.3)',
							}}
							className="p-5"
						>
							{footerComponent}
						</View>
					</View>
				</View>
			</KeyboardAvoidingView>
		</Modal>
	);
};

export default React.memo(ModalPopup);
