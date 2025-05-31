import { colors } from '@/constants';
import { ReaderMode } from '@/services/cache/types';
import { useReadChapters } from '@/services/cache/useReadChapters';
import { useReadingOptions } from '@/services/cache/useReadingOptions';
import useReadingProgress from '@/services/cache/useReadingProgress';
import { MangaChapterPage } from '@/services/ResponseTypes';
import { useGetChapterPages } from '@/services/useGetChapterPages';
import { useChapterNavigationStore } from '@/stores/chapterNavigationStore';
import { Ionicons } from '@expo/vector-icons';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import debounce from 'just-debounce-it';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Text, View, ViewToken } from 'react-native';
import { Portal, Snackbar } from 'react-native-paper';
import ReaderOptionsSheet from './components/manga_reader/ReaderOptionsSheet';
import useZoomableViewHandlers from './components/manga_reader/useZoomableViewHandlers';
import MangaZoomableReader from './components/MangaZoomableReader';
const MangaReaderScreen = () => {
	const router = useRouter();
	const { id: mangaId, chapterId, chapterUrl } = useLocalSearchParams();
	const {
		data: pages,
		isLoading,
		isError,
		error,
	} = useGetChapterPages('mangakakalot', chapterUrl as string | undefined);

	const navigationMap = useChapterNavigationStore(
		(state) => state.navigationMap
	);
	const [snackbarVisible, setSnackbarVisible] = useState(false);

	const [panEnabled, setPanEnabled] = useState(false);
	const zoomableViewRef = useRef<ReactNativeZoomableView>(null);
	const flashListRef = useRef<FlashList<MangaChapterPage>>(null);

	const currentZoomLevel = useRef(1);
	const readerCurrentPage = useRef(0);

	const [showOptions, setShowOptions] = useState(false);

	const { readingMode, updateReadingMode } = useReadingOptions(
		mangaId as string
	);

	const { addEntryToReadingProgress, isReadingProgressLoading, readingProgress } = useReadingProgress(mangaId as string);

	const { markChapterAsRead } = useReadChapters(mangaId as string);

	const handleReaderNavigation = (navigationMode: {
		mode: string;
		jumpIndex?: number;
		jumpOffset?: number;
	}) => {
		if (flashListRef.current) {
			if (!navigationMode.mode)
				throw Error('No mentioned navigation mode.');

			let targetIndex;
			switch (navigationMode.mode) {
				case 'prev':
					targetIndex = readerCurrentPage.current - 1;
					if (targetIndex >= 0) {
						flashListRef.current.scrollToIndex({
							index: targetIndex,
							animated: true,
						});
					}
					break;
				case 'next':
					targetIndex = readerCurrentPage.current + 1;
					if (targetIndex < (pages?.length || 0)) {
						flashListRef.current.scrollToIndex({
							index: targetIndex,
							animated: true,
						});
					}
					break;
				case 'jump':
					if (navigationMode.jumpIndex === undefined)
						throw Error('No mentioned jumpIndex.');
					if (
						navigationMode.jumpIndex === readerCurrentPage.current
					) {
						return;
					}
					if (
						navigationMode.jumpIndex >= 0 &&
						navigationMode.jumpIndex < (pages?.length || 0)
					) {
						// Close options sheet
						setShowOptions(false);

						// Update current page reference
						readerCurrentPage.current = navigationMode.jumpIndex;

						// Scroll to the specified index
						flashListRef.current.scrollToIndex({
							index: navigationMode.jumpIndex,
							animated: true,
						});

						// Show toast notification
						// Snackbar.show({
						//   text: `Jumped to page ${navigationMode.jumpIndex + 1}`,
						//   duration: Snackbar.LENGTH_INDEFINITE,
						// });
					}
					break;
				case 'jumpToOffset':
					if (!navigationMode.jumpOffset)
						throw Error('No mentioned jumpOffset.');
					flashListRef.current.scrollToOffset({
						offset: navigationMode.jumpOffset,
						animated: true,
					});
					break;
				default:
					break;
			}
		}
	};

	const {
		handleOnZoomEnd,
		handleOnTransform,
		handleOnDoubleTapAfter,
		handleOnShiftingEnd,
		handleOnStartShouldSetPanResponderCapture,
	} = useZoomableViewHandlers({
		setPanEnabled,
		handleReaderNavigation,
		currentZoomLevel,
		zoomableViewRef,
		inverted: readingMode.value.inverted,
		horizontal: readingMode.value.horizontal,
	});

	const onDoubleTap = useCallback(() => {
		if (currentZoomLevel.current <= 1) {
			zoomableViewRef?.current?.zoomBy(0.5);
			return;
		} else {
			zoomableViewRef?.current?.zoomTo(1, { x: 0, y: 0 });
		}
	}, []);

	const onTap = useCallback(() => {
		setShowOptions(true);	}, []);


	const debouncedUpdateLastRead = useCallback(
		debounce((currentPageNum: number) => {
			const lastPageUrl = pages?.[currentPageNum]?.pageUrl;
			readerCurrentPage.current = currentPageNum;
			console.log('Updating last read for page:', currentPageNum);
			addEntryToReadingProgress({
				chapterId: chapterId as string,
				chapterUrl: chapterUrl as string,
				page: currentPageNum
			}, lastPageUrl ?? '')
		}, 300),
		[]
	);

	const onPageChange = (currentPageNum: number | null) => {
		if (currentPageNum === null) return;
		// Update the current page reference
		debouncedUpdateLastRead(currentPageNum);
	};

	const handleViewableItemsChanged = async ({
		viewableItems,
	}: {
		viewableItems: ViewToken[];
	}) => {
		if (viewableItems.length > 0) {
			const currentPageNum = readingMode.value.horizontal
				? viewableItems[0].index
				: viewableItems.splice(-1)[0].index;
			// readerCurrentPage.current = currentPageNum;
			// console.log("Current page:", readerCurrentPage.current)
			// call the callback func to update the ui back in the parent component
			onPageChange(currentPageNum);

			if (currentPageNum === (pages?.length || 0) - 1) {
				setSnackbarVisible(true);
				markChapterAsRead(chapterId as string);
			}
		}
	};

	const handleToggleReadingMode = (readingMode: ReaderMode) => {
		// Toggle reading mode
		console.log('Toggling reading mode:', readingMode);
		updateReadingMode(readingMode);
		// updateOptions({ horizontal: !readingMode });

		// Close options sheet
		setShowOptions(false);
	};

	const handleNavigateToNextChapter = () => {
		const nextChapterId =
			navigationMap[chapterId as string]?.next?.chapterId;
		const nextChapterUrl =
			navigationMap[chapterId as string]?.next?.chapterUrl;

		const query = new URLSearchParams({
			chapterUrl: nextChapterUrl ?? '',
		}).toString();

		console.log('nextChapterId', nextChapterId)
		console.log('nextChapterUrl', nextChapterUrl)

		if (!mangaId) return;
		router.replace(`/manga/${mangaId}/${nextChapterId}?${query}`);
		setShowOptions(false);
	};

	const handleNavigateToPrevChapter = () => {
		const prevChapterId =
			navigationMap[chapterId as string]?.prev?.chapterId;
		const prevChapterUrl =
			navigationMap[chapterId as string]?.prev?.chapterUrl;

		const query = new URLSearchParams({
			chapterUrl: prevChapterUrl ?? '',
		}).toString();

		if (!mangaId) return;
		router.replace(`/manga/${mangaId}/${prevChapterId}?${query}`);
	};

	return (
		<View className="h-full w-full bg-black">
			{isLoading || isReadingProgressLoading? (
				<MangaReaderLoader />
			) : isError ? (
				<MangaReaderError error={error} />
			) : !pages || pages.length === 0 ? (
				<MangaReaderEmpty />
			) : (
				<View className="h-full w-full">
					<MangaZoomableReader
							pages={pages}
							currentPage={readingProgress?.progress[chapterId as string]?.lastPage ?? 0}
							flashListRef={flashListRef}
							zoomableViewRef={zoomableViewRef}
							panEnabled={panEnabled}
							horizontal={readingMode.value.horizontal}
							inverted={readingMode.value.inverted}
							onSingleTap={onTap}
							onDoubleTap={onDoubleTap}
							handleOnZoomEnd={handleOnZoomEnd}
							handleViewableItemsChanged={
								handleViewableItemsChanged
							}
							handleOnShiftingEnd={handleOnShiftingEnd}
							handleOnTransform={handleOnTransform}
							handleOnDoubleTapAfter={handleOnDoubleTapAfter}
							handleOnStartShouldSetPanResponderCapture={
								handleOnStartShouldSetPanResponderCapture
							}
						/>
						<ReaderOptionsSheet
							flashListRef={flashListRef}
							visible={showOptions}
							readingMode={readingMode}
							onClose={() => setShowOptions(false)}
							mangaId={mangaId as string}
							chapterId={chapterId as string}
							currentPage={readerCurrentPage.current}
							totalPages={pages.length}
							onNavigate={handleReaderNavigation}
							onToggleReadingMode={handleToggleReadingMode}
							onNavigateToNextChapter={
								handleNavigateToNextChapter
							}
							onNavigateToPrevChapter={
								handleNavigateToPrevChapter
							}
						/>

						<Portal>
							<Snackbar
								style={{
									backgroundColor: colors.primary.DEFAULT,
								}}
								icon={'close'}
								onIconPress={() => {
									setSnackbarVisible(false);
								}}
								visible={snackbarVisible}
								duration={Snackbar.DURATION_LONG}
								onDismiss={() => {
									setSnackbarVisible(false);
								}}
                action={{
                  label: 'Next',
                  onPress: () => {
                    handleNavigateToNextChapter();
                  },
                }}
							>
                <View className="flex-row items-center gap-2">
                  <Ionicons name="information-circle" size={24} color="white" />
                  <Text className="text-white font-pregular">
                    End of chapter!
                  </Text>
                </View>
							</Snackbar>
						</Portal>
					</View>
				)
			}
		</View>
	);
};

export default MangaReaderScreen;

const MangaReaderLoader = () => {
	return (
		<View className="flex-1 justify-center items-center">
			<ActivityIndicator size="large" color="#fff" />
			<Text className="text-white mt-2">Loading Chapter...</Text>
		</View>
	);
};

const MangaReaderError = ({ error }: { error: Error }) => {
	return (
		<View className="flex-1 justify-center items-center px-4">
			<Text className="text-red-500 text-center">
				Error loading chapter pages.
				{error instanceof Error ? `\n${error.message}` : ''}
			</Text>
		</View>
	);
};

const MangaReaderEmpty = () => {
	return (
		<View className="flex-1 justify-center items-center px-4">
			<Text className="text-white text-center">
				No pages found for this chapter.
			</Text>
		</View>
	);
};
