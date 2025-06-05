import SourceDropDownList from '@/components/modal/SourceDropdownList';
import { colors } from '@/constants';
import { Manga } from '@/services/ResponseTypes';
import { useSourceStore } from '@/stores/sourceStore';
import {
	Ionicons,
	MaterialCommunityIcons,
	MaterialIcons,
} from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { Portal, Snackbar } from 'react-native-paper';
import HorizontalRule from '../../components/HorizontalRule';
import { MangaGrid, MangaSlide } from '../../components/manga_menu';
import {
	useGetLatestMangaList,
	useGetPopularMangaList,
} from '../../services/useGetMangaList';
const BrowseTab = () => {
	const [errorData, setErrorData] = useState();
	const [snackbarVisible, setSnackbarVisible] = useState(false);

	const [activeSourceIndex, setActiveSourceIndex] = useState(0);
	const availableSources = useSourceStore((state) => state.availableSources);

	if (availableSources.length === 0) {
		return (
			<View className="flex-1 bg-primary justify-center items-center">
				<MaterialCommunityIcons
					name="robot-confused-outline"
					size={96}
					color="white"
				/>

				<Text className="text-white font-pregular">
					No available sources at the moment
				</Text>
			</View>
		);
	}

	const {
		data: latestMangaData,
		error: latestMangaError,
		isLoading: latestMangaLoading,
		fetchNextPage: fetchNextLatestManga,
		hasNextPage: hasMoreLatestManga,
		isFetchingNextPage: isFetchingMoreLatestManga,
	} = useGetLatestMangaList(availableSources[activeSourceIndex]?.sourceName);

	const latestMangaList: Manga[] = useMemo(() => {
		if (!latestMangaData) return [];

		const seen = new Map();

		latestMangaData.pages.forEach((page) => {
			page.latest_manga.forEach((manga) => {
				if (!seen.has(manga.mangaId)) {
					seen.set(manga.mangaId, manga);
				}
			});
		});

		return Array.from(seen.values());
	}, [latestMangaData]);

	const {
		data: popularMangaData,
		error: popularMangaError,
		isLoading: popularMangaLoading,
	} = useGetPopularMangaList(availableSources[activeSourceIndex]?.sourceName);

	const handleSearchButton = () => {
		router.push({
			pathname: '/search',
		});
	};

	const getMoreManga = async () => {
		if (latestMangaLoading) {
			console.log('latestMangaLoading', latestMangaLoading);
			return;
		}
		if (hasMoreLatestManga) {
			await fetchNextLatestManga();
		}
	};

	const viewStyle =
		Platform.OS === 'android'
			? { paddingTop: Constants.statusBarHeight }
			: {};

	if (latestMangaError) {
		return (
			<View className="flex-1 bg-primary justify-center items-center">
				<MaterialCommunityIcons
					name="robot-dead-outline"
					size={96}
					color="white"
				/>

				<Text className="text-white font-pregular">
					{latestMangaError.message ||
						'Sorry, something went wrong while fetching the latest manga.'}
				</Text>
			</View>
		);
	}

	return (
		<View
			className="flex-1 bg-primary"
			style={viewStyle}
			key={activeSourceIndex}
		>
			<View className="mx-4 rounded-md mt-4 border border-gray-600 bg-secondary/30 flex-row items-center">
				<SourceDropDownList
					listItems={availableSources}
					selectedIndex={activeSourceIndex}
					onValueChange={(newSelectedIndex) =>
						setActiveSourceIndex(newSelectedIndex)
					}
				/>
				<TouchableOpacity
					className="flex-row justify-between items-center p-3 flex-1 bg-secondary"
					onPress={handleSearchButton}
				>
					<Text className="text-white font-pregular">
						Search for manga
					</Text>
					<Ionicons name="search" size={20} color={'white'} />
				</TouchableOpacity>
			</View>
			<Text className="mt-2 text-white font-pregular mx-4 text-xs">
				Source: {availableSources[activeSourceIndex]?.sourceName}
			</Text>
			{!errorData ? (
				<>
					<HorizontalRule
						displayText={'Most Popular'}
						otherStyles={'mb-4 mx-4'}
					/>
					<MangaSlide
						mangaData={
							popularMangaLoading
								? undefined
								: popularMangaData?.popular_manga
						}
						isLoading={popularMangaLoading}
						onEndReached={() => {
							// TODO: so something
						}}
					/>
					<HorizontalRule
						displayText={'Latest Releases'}
						otherStyles={'my-4 mx-4'}
					/>
					<MangaGrid
						mangaData={
							latestMangaLoading ? undefined : latestMangaList
						}
						numColumns={3}
						isLoading={
							latestMangaLoading || isFetchingMoreLatestManga
						}
						onEndReached={() => {
							getMoreManga();
							setSnackbarVisible(true);
						}}
					/>
				</>
			) : (
				<View className="flex-1 w-full my-5 justify-center items-center">
					<MaterialIcons
						name="not-interested"
						size={50}
						color="white"
					/>
					<Text className="text-white font-pregular mt-2">
						Something went wrong. Please restart the app and try
						again.
					</Text>
				</View>
			)}
			<Portal>
				<Snackbar
					style={{
						backgroundColor: colors.primary.DEFAULT,
					}}
					visible={snackbarVisible}
					duration={2 * 1000}
					onDismiss={() => {
						setSnackbarVisible(false);
					}}
				>
					<TouchableOpacity
						className="flex-row justify-between items-center"
						onPress={() => {
							setSnackbarVisible(false);
						}}
					>
						<Text className="text-white font-plight">
							More mangas has been loaded!
						</Text>
						<TouchableOpacity
							onPress={() => {
								setSnackbarVisible(false);
							}}
						>
							<MaterialIcons
								name="close"
								size={24}
								color="white"
							/>
						</TouchableOpacity>
					</TouchableOpacity>
				</Snackbar>
			</Portal>
		</View>
	);
};

export default BrowseTab;
