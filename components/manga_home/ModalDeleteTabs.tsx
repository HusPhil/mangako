import { colors } from '@/constants';
import { Tab } from '@/services/manga_list/types';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, Text, View } from 'react-native';
import ModalPopup from '../modal/ModalPopup';
import TabListItem from './TabListItem';

interface ModalDeleteTabsProps {
	visible: boolean;
	tabs: Tab[];
	handleDeleteTab: () => void;
	handleSelectItem: (tab: Tab) => void;
	onClose: () => void;
}
interface RenderItemProps {
	item: Tab;
	index: number;
}

const ModalDeleteTabs = ({
	visible,
	tabs,
	handleDeleteTab,
	handleSelectItem,
	onClose,
}: ModalDeleteTabsProps) => {
	const renderItem = ({ item, index }: RenderItemProps) => {
		return (
			<TabListItem
				item={item}
				onSelectItem={handleSelectItem}
				selected={false}
				iconComponent={
					<MaterialIcons
						name="delete-outline"
						size={18}
						color={colors.accent.DEFAULT}
					/>
				}
			/>
		);
	};

	return (
		<ModalPopup
			headerTitle="Delete Tabs"
			variant="danger"
			visible={visible}
			modalAction={{
				icon: (
					<MaterialIcons
						name="delete-sweep"
						size={16}
						color="white"
					/>
				),
				name: 'Delete Selected',
				callback: handleDeleteTab,
			}}
			headerIcon={
				<MaterialIcons
					name="inventory-2"
					size={20}
					color="rgba(255 255 255 / 0.3)"
				/>
			}
			handleClose={onClose}
		>
			<Text className="text-gray-300 text-sm mb-3">
				Select the tabs you want to remove from your library{' '}
			</Text>
			<View className="max-h-[200px]">
				{tabs.length > 0 ? (
					<>
						<FlatList
							className="mt-3"
							data={tabs}
							keyExtractor={(item, index) =>
								`${item.name}-${index}`
							}
							renderItem={renderItem}
						/>
					</>
				) : (
					<Text className="text-white font-pregular text-center text-xs mt-3">
						No tabs available
					</Text>
				)}

				<View className="flex-row justify-center items-center gap-3 rounded-md p-1 mt-2 bg-red-500/30 border border-red-600">
					<MaterialIcons name="warning" size={20} color="#fca5a5" />
					<Text className="text-red-300 text-sm">
						This action cannot be undone
					</Text>
					<MaterialIcons name="warning" size={20} color="#fca5a5" />
				</View>
			</View>
		</ModalPopup>
	);
};

export default ModalDeleteTabs;
