import { colors } from '@/constants';
import { Tab } from '@/services/manga_list/types';
import { MaterialIcons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import HorizontalRule from '../HorizontalRule';

interface ModalAddToMangaListProps {
	mangaId: string;
  mangaListTabs: Tab[];
  onSaveMangaListings: (mangaListings: Tab[]) => void;
	onClose: () => void;
  findMangaListings: (mangaId: string) => Promise<Tab[]>;
}

const ModalMangaTabsEditor = ({
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
    setMangaListings(prev => {
      const exists = prev.some(listing => listing.id === tab.id);
      if (exists) {
        // Remove item if it exists
        tab.mangaIds = tab.mangaIds.filter(id => id !== mangaId);
        return prev.filter(listing => listing.id !== tab.id);
      } else {
        // Add item if it doesn't exist
        tab.mangaIds = [...tab.mangaIds, mangaId];
        return [...prev, tab];
      }
    });
  }

	const renderItem = ({ item }: { item: Tab }) => {
		return (
			<TouchableOpacity onPress={() => handleToggleMangaListing(item)}>
				<View className="flex-row justify-between items-center py-3">
					<Text key={item.id} className="text-white font-pregular">
						{item.name}
					</Text>
					{mangaListings.some(listing => listing.id === item.id) && (
            <MaterialIcons
              name="sell"
              size={20}
              color={colors.accent.DEFAULT}
            />
					)}
				</View>
			</TouchableOpacity>
		);
	};

  const handleClose = () => {
    onClose();
    // setMangaListings(prevMangaListings);
  }

	return (
		<>
			{!isLoading && (
				<View className="w-full bg-secondary rounded-md p-3 max-h-[420px]">
					<View className="flex-row justify-between items-center">
						<Text className="text-white font-pregular text-center">
							Manage where this manga is listed
						</Text>
						<TouchableOpacity
							className="flex-1 items-end p-3"
							onPress={handleClose}
						>
							<MaterialIcons
								name="close"
								size={20}
								color="white"
							/>
						</TouchableOpacity>
					</View>
					<HorizontalRule displayText={''} otherStyles={''} />
					<View className="flex-row px-4 pt-2 items-center mt-2 max-h-[80%]">
						<FlashList
							data={mangaListTabs}
							keyExtractor={(item, index) => `${item.id}-${index}`}
							renderItem={renderItem}
              estimatedItemSize={100}
              extraData={mangaListings}
						/>
					</View>
					<TouchableOpacity
						className="flex-row justify-between border-2 border-white py-1 px-2  rounded-md mt-3 self-center"
						onPress={() => onSaveMangaListings(mangaListings)}
					>
						<MaterialIcons name="save" size={15} color="white" />
						<Text className=" text-center text-xs font-pregular text-white ml-1">
							Save Changes
						</Text>
					</TouchableOpacity>
				</View>
			)}
		</>
	);
};

export default ModalMangaTabsEditor;
