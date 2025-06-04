import { colors } from '@/constants';
import { Tab } from '@/services/manga_list/types';
import { MaterialIcons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import ModalPopup from '../modal/ModalPopup';

interface ModalAddToMangaListProps {
	visible: boolean;
	mangaId: string;
	mangaListTabs: Tab[];
	onSaveMangaListings: (mangaListings: Tab[]) => void;
	onClose: () => void;
	findMangaListings: (mangaId: string) => Promise<Tab[]>;
}

const ModalMangaTabsEditor = ({
	visible,
	mangaId,
	mangaListTabs,
	onSaveMangaListings,
	onClose,
	findMangaListings,
}: ModalAddToMangaListProps) => {
	const [mangaListings, setMangaListings] = useState<Tab[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	let prevMangaListings: Tab[] = [];

	useEffect(() => {
		setIsLoading(true);
		console.log('Manga ID:', mangaId);
		const fetchMangaListings = async () => {
			const listings = await findMangaListings(mangaId!);
			console.log('Manga listings:', listings);
			setMangaListings(listings);
			prevMangaListings = listings;
			setIsLoading(false);
		};
		fetchMangaListings();
	}, [mangaId]);

	const handleToggleMangaListing = (tab: Tab) => {
		setMangaListings((prev) => {
			const exists = prev.some((listing) => listing.id === tab.id);
			if (exists) {
				// Remove item if it exists
				tab.mangaIds = tab.mangaIds.filter((id) => id !== mangaId);
				return prev.filter((listing) => listing.id !== tab.id);
			} else {
				// Add item if it doesn't exist
				tab.mangaIds = [...tab.mangaIds, mangaId];
				return [...prev, tab];
			}
		});
	};

	const renderItem = ({ item }: { item: Tab }) => {
		return (
			<TouchableOpacity
				onPress={() => handleToggleMangaListing(item)}
				className="bg-secondary/30 my-1 rounded-md p-1 px-3 border border-gray-600"
			>
				<View className="flex-row gap-2 items-center py-3">
					{mangaListings.some((listing) => listing.id === item.id) ? (
						item.id === 'favorites' ? (
							<MaterialIcons
								name="favorite"
								size={20}
								color={colors.accent.DEFAULT}
							/>
						) : (
							<MaterialIcons
								name="task-alt"
								size={20}
								color={colors.accent.DEFAULT}
							/>
						)
					) : (
						<MaterialIcons
							name="radio-button-unchecked"
							size={20}
							color={'rgba(255 255 255 / 0.3)'}
						/>
					)}
					<Text key={item.id} className="text-white font-pregular">
						{item.name}
					</Text>
				</View>
			</TouchableOpacity>
		);
	};

	const handleClose = () => {
		onClose();
		// setMangaListings(prevMangaListings);
	};

	return (
		<>
			{!isLoading && (
				<ModalPopup
					headerTitle="Manage tabs for this manga"
					headerIcon={
						<MaterialIcons
							name="collections-bookmark"
							size={24}
							color="rgba(255 255 255 / 0.3)"
						/>
					}
					modalAction={{
						name: 'Save',
						icon: (
							<MaterialIcons
								name="bookmark-outline"
								size={16}
								color="white"
							/>
						),
						callback: () => onSaveMangaListings(mangaListings),
					}}
					visible={visible}
					handleClose={onClose}
				>
					<View className="w-full p-2 rounded-md  max-h-[250px]">
						<View className="flex-row items-center">
							<FlashList
								data={mangaListTabs}
								keyExtractor={(item, index) =>
									`${item.id}-${index}`
								}
								renderItem={renderItem}
								estimatedItemSize={100}
								extraData={mangaListings}
							/>
						</View>
					</View>
				</ModalPopup>
			)}
		</>
	);
};

export default ModalMangaTabsEditor;
