import SourceDropDownList from '@/components/modal/SourceDropdownList';
import { colors } from '@/constants';
import { useGetAvailableSources } from '@/services/useGetAvailableSources';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
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

	const { data: availableSources, isLoading: isLoadingSources } =
		useGetAvailableSources();
	const [activeSourceIndex, setActiveSourceIndex] = useState(0);

	const {
		data: latestMangaData,
		error: latestMangaError,
		isLoading: latestMangaLoading,
		fetchNextPage: fetchNextLatestManga,
		hasNextPage: hasMoreLatestManga,
		isFetchingNextPage: isFetchingMoreLatestManga,
	} = useGetLatestMangaList(
		isLoadingSources ? undefined : availableSources[0]?.sourceName
	);

	const latestMangaList = useMemo(() => {
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
	} = useGetPopularMangaList(
		isLoadingSources ? null : availableSources[0]?.sourceName
	);

	const handleSearchButton = () => {
		router.push({
			pathname: '/search',
		});
	};

	const getMoreManga = async (type) => {
		if (latestMangaLoading) {
			console.log('latestMangaLoading', latestMangaLoading);
			return;
		}
		if (type === 'latest' && hasMoreLatestManga) {
			await fetchNextLatestManga();
		}
	};

	const viewStyle =
		Platform.OS === 'android'
			? { paddingTop: Constants.statusBarHeight }
			: {};

	if (isLoadingSources) {
		return (
			<View className="flex-1 bg-primary justify-center items-center">
				<Text className="text-white font-pregular">Loading...</Text>
			</View>
		);
	}

	return (
		<View className="flex-1 bg-primary" style={viewStyle}>
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
								? null
								: popularMangaData?.popular_manga
						}
						limit={100}
						numColumns={3}
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
						mangaData={latestMangaLoading ? null : latestMangaList}
						numColumns={3}
						isLoading={
							latestMangaLoading || isFetchingMoreLatestManga
						}
						onEndReached={() => {
							getMoreManga('latest');
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
						Something went wrong.
					</Text>
					<TouchableOpacity
						className="p-2 bg-accent rounded-md mt-4"
						onPress={() => {
							setNewestManga([]);
							setPopularManga([]);
							setErrorData(undefined);
							fetchData();
						}}
					>
						<Text className="text-white font-pregular text-center">
							Would you like to retry?
						</Text>
					</TouchableOpacity>
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
