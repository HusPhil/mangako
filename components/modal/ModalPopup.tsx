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

type modalAction = {
	name: string;
	icon: React.ReactNode;
	callback: () => void;
};

interface ModalPopupProps {
	otherStyles?: any;
	children: React.ReactNode;
	visible: boolean;
	modalAction?: modalAction;
	variant?: Variant;
	footerText?: string;
	footerComponent?: React.ReactNode;
	headerComponent?: React.ReactNode;
	headerIcon?: React.ReactNode;
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
	variant,
	visible,
	children,
	modalAction,
	headerIcon,
	headerTitle,
	handleClose,
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
						className={`max-w-md marker max-h-[420px] bg-primary rounded-xl justify-center w-full border ${getVariantBorder(
							variant
						)}`}
					>
						{/* HEADER */}
						<View className="w-full py-2 px-5 border-b border-white/30 flex-row justify-between items-center">
							<View className="gap-2 flex-row items-center">
								{headerIcon}
								<Text className="text-white text-lg">
									{headerTitle || 'Untitled action'}
								</Text>
							</View>
							<TouchableOpacity
								onPress={handleClose}
								className="p-2"
							>
								<MaterialIcons
									name="close"
									size={20}
									color="rgba(255 255 255 / 0.3)"
								/>
							</TouchableOpacity>
						</View>

						{/* BODY */}
						<View className="w-full p-5">{children}</View>

						{/* FOOTER */}
						<View
							style={{
								borderTopWidth: 1,
								borderTopColor: 'rgba(255, 255, 255, 0.3)',
							}}
							className="p-4 flex-row justify-end gap-3"
						>
							<TouchableOpacity
								onPress={handleClose}
								className="bg-secondary/10 py-2 px-3 border-white/50 border rounded-md"
							>
								<Text className="text-white text-sm font-pregular">
									Close
								</Text>
							</TouchableOpacity>

							{modalAction && (
								<TouchableOpacity
									onPress={modalAction.callback}
									className="bg-accent-100 py-2 px-3 rounded-md flex-row items-center gap-1 border-white/50 border"
								>
									{modalAction.icon}
									<Text className="text-white text-sm font-pregular">
										{modalAction.name}
									</Text>
								</TouchableOpacity>
							)}
						</View>
					</View>
				</View>
			</KeyboardAvoidingView>
		</Modal>
	);
};

export default React.memo(ModalPopup);
