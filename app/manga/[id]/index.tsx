import HorizontalRule from '@/components/HorizontalRule';
import ModalMangaTabsEditor from '@/components/manga_home/ModalMangaTabsEditor';
import { colors } from '@/constants';
import { MangaChapter, MangaRender } from '@/services/ResponseTypes';
import { saveMangaData } from '@/services/cache/mangaCacheUtils';
import useReadingProgress from '@/services/cache/useReadingProgress';
import { Tab } from '@/services/manga_list/types';
import { useMangaList } from '@/services/manga_list/useMangaList';
import useMangaTabsEditor from '@/services/manga_list/useMangaTabsEditor';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Haptic from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { Book, BookOpen, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	Alert,
	Pressable,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import ChapterList from './components/ChapterList';
import MangaDetailsContent from './components/MangaDetailsContent';
import MangaHeader from './components/MangaHeader';
import useChapterSelection from './components/manga_reader/useChapterSelection';
import { useChaptersWithReadStatus } from './components/manga_reader/useChaptersWithReadStatus';
type LocalSearchParams = {
	id?: string;
	mangaSourceId?: string;
	mangaCover?: string;
	mangaTitle?: string;
	mangaUrl?: string;
};

const MangaInfoScreen = () => {
	const {
		id: mangaId,
		mangaSourceId,
		mangaCover,
		mangaTitle,
		mangaUrl,
	} = useLocalSearchParams<LocalSearchParams>();

	const [activeTab, setActiveTab] = useState<'Details' | 'Chapters'>(
		'Details'
	);

	const {
		chapters,
		setChapters,
		isLoading: isMangaInfoLoading,
		error: errorData,
		mangaInfo,
		readChapters,
		markMultipleChaptersAsRead,
		markMultipleChaptersAsUnread,
	} = useChaptersWithReadStatus(
		mangaUrl!,
		mangaId!,
		mangaSourceId || 'mangakakalot'
	);

	const {
		addToMangaFavorites,
		checkIfMangaIsFavorite,
		removeMangaFromTab,
		mangaList,
		getMangaListings,
		updateMangaListings,
	} = useMangaList();

	const { readingProgress } = useReadingProgress(mangaId!);

	const {
		selectionModeOn,
		selectedChaptersRef,
		selectChapterRange,
		toggleSelectChapter,
		turnOnSelectionMode,
		turnOffSelectionMode,
		registerChapterRef,
		unregisterChapterRef,
		clearAllSelections,
		selectAllChapters,
		selectInverseChapters,
		getSelectedChapters,
	} = useChapterSelection();

	const { isModalVisible, setIsModalVisible } = useMangaTabsEditor();

	const handleRefresh = async () => {
		console.log('Refreshing manga info...');
		const query = new URLSearchParams({
			mangaCover: mangaCover ?? '',
			mangaTitle: mangaTitle ?? '',
			mangaUrl: mangaUrl ?? 'NONE',
		}).toString();

		router.replace(`/manga/${mangaId}?${query}`);
	};

	const handleSetLastReadChapterIndex = (index: number) => {
		console.log('Chapter read status changed:', index);
	};

	const handleReadingResume = async () => {
		console.log('Resume reading...');

		if (!mangaId || chapters.length === 0) return;

		const fallbackChapter = chapters[chapters.length - 1];

		const chapterId =
			readingProgress?.lastRead?.chapterId ?? fallbackChapter.chapterId;
		const chapterUrl =
			readingProgress?.lastRead?.chapterUrl ??
			fallbackChapter.chapterUrl ??
			'';
		const chapterTitle =
			readingProgress?.lastRead.chapterTitle ??
			fallbackChapter.chapterTitle ??
			'';

		const query = new URLSearchParams({
			chapterUrl,
			chapterTitle,
		}).toString();
		router.push(`/manga/${mangaId}/${chapterId}?${query}`);
	};

	const handleClearMangaCache = () => {
		Alert.alert(
			'Clearing manga data',
			'All the saved data on this manga will be deleted, do you still wish to proceed?',
			[
				{
					text: 'Yes',
					onPress: async () => {
						await saveMangaData(mangaId!, {});
						router.replace('/');
						router.back();
						console.log('Cache cleared');
					},
				},
				{
					text: 'Cancel',
					style: 'cancel',
				},
			],
			{ cancelable: false }
		);
	};

	const handleChapterPress = (chapter: MangaChapter, index: number) => {
		if (selectionModeOn) {
			toggleSelectChapter(chapter, index);
			return;
		}

		const query = new URLSearchParams({
			mangaSourceId: mangaSourceId ?? '',
			chapterUrl: chapter.chapterUrl ?? '',
			chapterTitle: chapter.chapterTitle ?? '',
		}).toString();

		if (!mangaId) return;
		router.push(`/manga/${mangaId}/${chapter.chapterId}?${query}`);
	};

	const handleChapterLongPress = (chapter: MangaChapter, index: number) => {
		Haptic.impactAsync(Haptic.ImpactFeedbackStyle.Heavy);
		if (!selectionModeOn) {
			toggleSelectChapter(chapter, index);
			turnOnSelectionMode();
			return;
		}
		selectChapterRange(chapters, index);
	};

	const handleSaveMangaListings = async (mangaListings: Tab[]) => {
		await updateMangaListings(
			{
				mangaSourceId: mangaSourceId!,
				mangaId: mangaId!,
				mangaTitle: mangaTitle!,
				mangaUrl: mangaUrl!,
				mangaCover: mangaCover!,
			},
			mangaListings
		);
		setIsModalVisible(false);
	};

	const handleSelectAllChapters = () => {
		selectAllChapters(chapters);
	};

	const handleSelectInverseChapters = () => {
		selectInverseChapters(chapters);
	};

	const handleMarkMultipleChaptersAsRead = () => {
		const selectedChapterIds = getSelectedChapters();
		markMultipleChaptersAsRead(selectedChapterIds);
		turnOffSelectionMode();
	};

	const handleMarkMultipleChaptersAsUnread = () => {
		const selectedChapterIds = getSelectedChapters();
		markMultipleChaptersAsUnread(selectedChapterIds);
		turnOffSelectionMode();
	};

	useEffect(() => {
		return () => {
			clearAllSelections();
		};
	}, []);

	return (
		<View
			className="h-full w-full bg-primary"
			style={{
				paddingTop: Constants.statusBarHeight,
				paddingBottom: Constants.statusBarHeight,
			}}
		>
			<View className="h-full w-full">
				{renderHeader({
					mangaSourceId: mangaSourceId || '',
					mangaId: mangaId || '',
					mangaTitle: mangaTitle || '',
					mangaUrl: mangaUrl || '',
					mangaCover: mangaCover || '',
					checkIfMangaIsFavorite,
					addToMangaFavorites,
					removeMangaFromTab,
				})}
				<MangaHeader
					isError={errorData !== null}
					mangaCover={mangaCover}
					mangaId={mangaId || 'loading'}
					mangaTitle={mangaTitle}
					mangaUrl={mangaUrl}
					isLoading={isMangaInfoLoading}
					details={{
						author: mangaInfo?.mangaDetails.mangaAuthor,
						status: mangaInfo?.mangaDetails.mangaStatus,
					}}
					hasStartedReading={readingProgress?.lastRead != null}
					numberOfReadChapters={readChapters.length}
					chapterCount={mangaInfo?.mangaChapters.length || 0}
					onShowModalAddMangaToList={() => setIsModalVisible(true)}
					onReadingResume={handleReadingResume}
					onClearCache={handleClearMangaCache}
				/>

				{isMangaInfoLoading ? (
					<>
						<HorizontalRule
							displayText="Loading..."
							otherStyles={'mt-2 mx-4'}
						/>
						<View className="flex-1 justify-center items-center">
							<ActivityIndicator
								size="large"
								color={colors.accent.DEFAULT}
							/>
						</View>
					</>
				) : errorData ? (
					// You can customize this fallback if you want to show an error message
					<View className="h-full justify-center items-center">
						<Text className="text-red-500">
							Failed to load manga data.
						</Text>
					</View>
				) : (
					<View className="flex-1">
						<TabsNavigation
							activeTab={activeTab}
							setActiveTab={setActiveTab}
							chapterCount={mangaInfo?.mangaChapters.length || 0}
						/>

						{activeTab === 'Details' ? (
							<ScrollView
								className="flex-1 bg-primary"
								scrollEventThrottle={16}
								showsVerticalScrollIndicator={false}
							>
								<MangaDetailsContent
									mangaTitle={mangaTitle}
									mangaAlternativeNames={
										mangaInfo?.mangaDetails
											.mangaAlternativeNames || []
									}
									mangaAuthor={
										mangaInfo?.mangaDetails.mangaAuthor ||
										''
									}
									mangaStatus={
										mangaInfo?.mangaDetails.mangaStatus ||
										''
									}
									mangaTags={
										mangaInfo?.mangaDetails.mangaTags || []
									}
									mangaDescription={
										mangaInfo?.mangaDetails
											.mangaDescription || ''
									}
									totalChapters={
										mangaInfo?.mangaChapters.length || 0
									}
									numberOfReadChapters={readChapters.length}
									handleReadingResume={handleReadingResume}
									handleClearMangaCache={
										handleClearMangaCache
									}
								/>
							</ScrollView>
						) : (
							<View className="flex-1">
								{selectionModeOn && (
									<TopSelectionComponent
										turnOffSelectionMode={
											turnOffSelectionMode
										}
										onSelectAll={handleSelectAllChapters}
										onSelectInverse={
											handleSelectInverseChapters
										}
									/>
								)}
								<ChapterList
									mangaId={mangaId || ''}
									mangaUrl={mangaUrl || ''}
									chaptersData={chapters}
									listStyles={{ flex: 1 }}
									onRefresh={handleRefresh}
									onChapterReadStatusChange={
										handleSetLastReadChapterIndex
									}
									onChapterPress={handleChapterPress}
									onChapterLongPress={handleChapterLongPress}
									isListed={false}
									numberOfReadChapters={readChapters.length}
									selectionModeOn={selectionModeOn}
									registerChapterRef={registerChapterRef}
									unregisterChapterRef={unregisterChapterRef}
									selectedChapters={
										selectedChaptersRef.current
									}
								/>
								{selectionModeOn && (
									<BottomSelectionComponent
										turnOffSelectionMode={
											turnOffSelectionMode
										}
										onMarkMultipleChaptersAsRead={
											handleMarkMultipleChaptersAsRead
										}
										onMarkMultipleChaptersAsUnread={
											handleMarkMultipleChaptersAsUnread
										}
									/>
								)}
							</View>
						)}

						<ModalMangaTabsEditor
							visible={isModalVisible}
							mangaId={mangaId || ''}
							mangaListTabs={mangaList.tabs}
							findMangaListings={getMangaListings}
							onClose={() => setIsModalVisible(false)}
							onSaveMangaListings={handleSaveMangaListings}
						/>
					</View>
				)}
			</View>
		</View>
	);
};

export default MangaInfoScreen;

interface TopSelectionComponentProps {
	turnOffSelectionMode: () => void;
	onSelectAll: () => void;
	onSelectInverse: () => void;
}

const TopSelectionComponent = ({
	turnOffSelectionMode,
	onSelectAll,
	onSelectInverse,
}: TopSelectionComponentProps) => {
	return (
		<View className="flex-row justify-between px-2 my-3 bg-secondary-100 rounded-lg mx-4 py-3">
			<View>
				<TouchableOpacity
					className="flex-row items-center px-2"
					onPress={turnOffSelectionMode}
				>
					<X size={24} color={'white'} />
					<Text className="text-white ml-1">Close</Text>
				</TouchableOpacity>
			</View>
			<View className="flex-row justify-around items-center gap-x-2">
				<TouchableOpacity
					className="items-center px-2"
					onPress={onSelectAll}
				>
					<MaterialIcons
						name="select-all"
						size={24}
						color={'white'}
					/>
				</TouchableOpacity>
				<TouchableOpacity
					className="items-center px-2"
					onPress={onSelectInverse}
				>
					<MaterialIcons
						name="flip-to-back"
						size={24}
						color={'white'}
					/>
				</TouchableOpacity>
			</View>
		</View>
	);
};

interface BottomSelectionComponentProps {
	turnOffSelectionMode: () => void;
	onMarkMultipleChaptersAsRead: () => void;
	onMarkMultipleChaptersAsUnread: () => void;
}

const BottomSelectionComponent = ({
	turnOffSelectionMode,
	onMarkMultipleChaptersAsRead,
	onMarkMultipleChaptersAsUnread,
}: BottomSelectionComponentProps) => {
	return (
		<View className="px-2 my-3 bg-secondary-100 rounded-lg mx-4 py-3 flex-row justify-around items-center">
			<TouchableOpacity
				className="flex-1 items-center"
				onPress={onMarkMultipleChaptersAsRead}
			>
				<BookOpen size={18} color={colors.accent.DEFAULT} />
				<Text className="text-xs text-white mt-2">Mark as read</Text>
			</TouchableOpacity>

			<TouchableOpacity
				className="flex-1 items-center"
				onPress={onMarkMultipleChaptersAsUnread}
			>
				<Book size={18} color={colors.accent.DEFAULT} />
				<Text className="text-xs text-white mt-2">Mark as unread</Text>
			</TouchableOpacity>

			{/* <TouchableOpacity
				className="flex-1 items-center"
				onPress={() => console.log('Share')}
			>
				<Share2 size={18} color={colors.accent.DEFAULT} />
				<Text className="text-xs text-white mt-2">Share</Text>
			</TouchableOpacity> */}
		</View>
	);
};

interface RenderHeaderProps {
	mangaSourceId: string;
	mangaId: string;
	mangaTitle: string;
	mangaUrl: string;
	mangaCover: string;
	checkIfMangaIsFavorite: (mangaId: string) => Promise<boolean>;
	addToMangaFavorites: (manga: MangaRender) => Promise<void>;
	removeMangaFromTab: (tabName: string, mangaId: string) => Promise<void>;
}

const renderHeader = ({
	mangaSourceId,
	mangaId,
	mangaTitle,
	mangaUrl,
	mangaCover,
	checkIfMangaIsFavorite,
	addToMangaFavorites,
	removeMangaFromTab,
}: RenderHeaderProps) => {
	const handleBackPress = () => {
		router.back();
	};

	const [isFavorite, setIsFavorite] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	useEffect(() => {
		const checkFavorite = async () => {
			const isFav = await checkIfMangaIsFavorite(mangaId);
			setIsFavorite(isFav);
			setIsLoading(false);
		};
		setIsLoading(true);
		checkFavorite();
	}, [mangaId]);

	const handleAddToFavorites = async () => {
		console.log('addToFavorites', mangaId);
		if (isFavorite) {
			await removeMangaFromTab('favorites', mangaId);
			setIsFavorite(false);
		} else {
			await addToMangaFavorites({
				mangaSourceId,
				mangaId,
				mangaTitle,
				mangaUrl,
				mangaCover,
			});
			setIsFavorite(true);
		}
	};

	return (
		<>
			{!isLoading && (
				<View className="bg-primary">
					<View className="flex-row justify-between items-center mb-5 border-b border-gray-300 mx-4 rounded-lg">
						<TouchableOpacity
							onPress={handleBackPress}
							className="p-3 pr-5"
							hitSlop={{
								top: 10,
								bottom: 10,
								left: 10,
								right: 10,
							}}
						>
							<Ionicons
								name="arrow-back"
								size={26}
								color="white"
							/>
						</TouchableOpacity>

						<View className="flex-1">
							<Text className="text-white text-lg font-semibold line-clamp-1">
								{mangaTitle}
							</Text>
						</View>

						<View className="flex-row items-center">
							<TouchableOpacity
								className="p-3 mr-1"
								onPress={handleAddToFavorites}
							>
								<Ionicons
									name={
										isFavorite ? 'heart' : 'heart-outline'
									}
									size={24}
									color="white"
								/>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			)}
		</>
	);
};

type TabsNavigationProps = {
	activeTab: 'Details' | 'Chapters';
	setActiveTab: React.Dispatch<React.SetStateAction<'Details' | 'Chapters'>>;
	chapterCount: number;
};

const TabsNavigation = ({
	activeTab,
	setActiveTab,
	chapterCount,
}: TabsNavigationProps) => {
	return (
		<View className="px-4 mb-4">
			<View className="flex-row justify-between bg-transparent rounded-lg overflow-hidden">
				<Pressable
					className={`py-2.5 px-5 flex-1 flex-row justify-center items-center border-b border-white ${
						activeTab === 'Details' ? 'opacity-100' : 'opacity-50'
					}`}
					onPress={() => setActiveTab('Details')}
				>
					<Ionicons
						name="information-circle"
						size={16}
						color="white"
						style={{ marginRight: 6 }}
					/>
					<Text
						className={`text-sm ${
							activeTab === 'Details'
								? 'text-white'
								: 'text-gray-300'
						}`}
					>
						Details
					</Text>
				</Pressable>

				<Pressable
					className={`py-2.5 px-5 flex-1 flex-row justify-center items-center border-b border-white ${
						activeTab === 'Chapters' ? 'opacity-100' : 'opacity-50'
					}`}
					onPress={() => setActiveTab('Chapters')}
				>
					<Ionicons
						name="list"
						size={16}
						color="white"
						style={{ marginRight: 6 }}
					/>
					<Text
						className={`text-sm ${
							activeTab === 'Chapters'
								? 'text-white'
								: 'text-gray-300'
						}`}
					>
						Chapters
					</Text>
				</Pressable>
			</View>
		</View>
	);
};
