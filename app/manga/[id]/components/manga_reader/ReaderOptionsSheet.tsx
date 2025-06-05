import ModalPopup from '@/components/modal/ModalPopup';
import ReaderDropDownList from '@/components/modal/ReaderDropdownList';
import { colors } from '@/constants';
import { ReaderMode } from '@/services/cache/types';
import { useReadChapters } from '@/services/cache/useReadChapters';
import { READER_MODES } from '@/services/cache/useReadingOptions';
import { MangaChapterPage } from '@/services/ResponseTypes';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { ChapterPageRef } from './useChapterPageErrors';

interface ReaderOptionsSheetProps {
	failedPagesRef: React.RefObject<Record<string, ChapterPageRef> | null>;
	pages: MangaChapterPage[];
	visible: boolean;
	mangaId: string;
	chapterTitle: string;
	chapterId: string;
	currentPage: number;
	readingMode: ReaderMode;
	flashListRef: React.RefObject<FlashList<MangaChapterPage> | null>;
	reloadPage: (pageId: string) => void;
	reloadPages: () => void;
	onClose: () => void;
	onShow?: () => void;
	onNavigate: (mode: { mode: string; jumpIndex?: number }) => void;
	onToggleReadingMode: (readingMode: ReaderMode) => void;
	onNavigateToNextChapter: () => void;
	onNavigateToPrevChapter: () => void;
}

const ReaderOptionsSheet: React.FC<ReaderOptionsSheetProps> = ({
	pages,
	failedPagesRef,
	visible,
	mangaId,
	chapterId,
	chapterTitle,
	currentPage,
	readingMode,
	reloadPage,
	reloadPages,
	onClose,
	onShow,
	onNavigate,
	onToggleReadingMode,
	flashListRef,
	onNavigateToNextChapter,
	onNavigateToPrevChapter,
}) => {
	const [pageInput, setPageInput] = useState('');
	const [viewImageErrors, setViewImageErrors] = useState<boolean>(false); // Initialize with an empty array

	const [isChapterRead, setIsChapterRead] = useState(false);

	// const [isChapterRead, setIsChapterRead] = useState(false);
	const { markChapterAsRead, checkIfChapterRead, markChapterAsUnread } =
		useReadChapters(mangaId as string);

	const handleJumpToPage = (pageNumber?: number) => {
		if (!pageNumber) return;

		onNavigate({ mode: 'jump', jumpIndex: pageNumber - 1 });
		setPageInput('');
	};

	const handleMarkAsRead = async () => {
		const isRead = await handleCheckIfChapterRead();
		if (isRead) {
			await markChapterAsUnread(chapterId as string);
			setIsChapterRead(false);
		} else {
			await markChapterAsRead(chapterId as string);
			setIsChapterRead(true);
		}
	};

	const handleCheckIfChapterRead = async () => {
		const isRead = await checkIfChapterRead(chapterId as string);
		return isRead;
	};

	useEffect(() => {
		const asyncEffect = async () => {
			const isRead = await handleCheckIfChapterRead();
			setIsChapterRead(isRead);
		};

		if (visible) {
			onShow?.();
			asyncEffect();
		}
	}, [visible]);

	const getReadingModeIndex = (readingMode: ReaderMode) => {
		return READER_MODES.findIndex(
			(mode) => mode.label === readingMode.label
		) !== -1
			? READER_MODES.findIndex((mode) => mode.label === readingMode.label)
			: 0;
	};

	const renderItem = useCallback(
		({ item }: { item: MangaChapterPage }) => {
			const isSelected = false; // Add your selection logic here
			const pageNumber = item.pageIndex || 'Unknown';

			return (
				<View>
					<TouchableOpacity
						className={`p-3 flex-row justify-between items-center rounded-md my-1 border ${
							isSelected
								? 'border-red-600 bg-red-600/20'
								: 'border-gray-600 bg-secondary/30'
						}`}
						onPress={() => {
							// Handle item press - maybe retry loading the page
							handleJumpToPage(item.pageIndex);
						}}
					>
						<View className="flex-1 mr-3">
							<Text className="font-pregular text-white mb-1">
								Page {pageNumber}
							</Text>
							<Text
								className="text-white text-xs"
								numberOfLines={1}
								ellipsizeMode="middle"
							>
								{item.pageImageUrl}
							</Text>
						</View>

						<TouchableOpacity
							className="flex-row items-center p-3 "
							onPress={() => reloadPage(item.pageId)}
						>
							{/* Retry icon */}
							<MaterialCommunityIcons
								name="refresh"
								size={24}
								color={colors.accent.DEFAULT}
							/>
						</TouchableOpacity>
					</TouchableOpacity>
				</View>
			);
		},
		[pages, failedPagesRef.current]
	);

	const failedPages = pages
		.map((page, index) => {
			return { ...page, pageIndex: index };
		})
		.filter(
			(page) =>
				failedPagesRef.current && failedPagesRef.current[page.pageId] // or whatever key you use
		);

	useEffect(() => {
		// console.log('Failed pages:', failedPagesRef.current);
		if (failedPagesRef.current) {
			console.log(
				'Failed pages length:',
				Object.entries(failedPagesRef.current).length
			);
		}
	}, [viewImageErrors]);

	return (
		<ModalPopup
			key={failedPages.length}
			modalAction={
				viewImageErrors
					? {
							icon: (
								<MaterialCommunityIcons
									name="refresh"
									size={16}
									color={'white'}
								/>
							),
							name: 'Refresh all',
							callback: reloadPages,
					  }
					: undefined
			}
			headerTitle={chapterTitle}
			visible={visible}
			handleClose={onClose}
			otherStyles={{
				backgroundColor: 'transparent',
				alignSelf: 'center',
			}}
		>
			{viewImageErrors ? (
				<>
					<View className="pl-3">
						<View className="w-full flex-row items-center">
							<TouchableOpacity
								onPress={() => setViewImageErrors(false)}
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
									size={20}
									color="white"
								/>
							</TouchableOpacity>
							<Text className="font-pregular text-white">
								Image errors ({failedPages.length})
							</Text>
						</View>
						{failedPages.length === 0 ? (
							<View className="w-full justify-center items-center p-7">
								<MaterialCommunityIcons
									name="robot-happy-outline"
									size={96}
									color="white"
								/>
								<Text className="font-pregular text-white">
									No errors found!
								</Text>
							</View>
						) : (
							<View>
								<FlatList
									data={failedPages}
									style={{ maxHeight: 200 }}
									renderItem={renderItem}
									keyExtractor={(item, index) =>
										`error-${index}`
									}
									extraData={failedPagesRef.current}
								/>
							</View>
						)}
						{/* <View className="h-96 w-full border"> */}
					</View>
					{/* </View> */}
				</>
			) : (
				<>
					<ReaderDropDownList
						title="Reading Mode"
						listItems={READER_MODES}
						selectedIndex={getReadingModeIndex(readingMode)}
						onValueChange={(value: ReaderMode) =>
							onToggleReadingMode(value)
						}
						otherContainerStyles="mx-0"
					/>

					<View className="flex-row gap-2 my-5">
						{/* mark as read */}
						<TouchableOpacity
							onPress={handleMarkAsRead}
							className={`flex-1 p-3 gap-2 border-white rounded-md shrink-0 items-center justify-center`}
						>
							<MaterialCommunityIcons
								name={
									isChapterRead
										? 'book-check'
										: 'book-check-outline'
								}
								size={24}
								color={isChapterRead ? 'red' : 'white'}
							/>
							<Text
								className={`text-sm font-pregular ${
									isChapterRead
										? 'text-accent'
										: 'text-white '
								}`}
							>
								{isChapterRead
									? 'Mark as Unread'
									: 'Mark as Read'}
							</Text>
						</TouchableOpacity>
						{/* image errors */}
						<TouchableOpacity
							className={`flex-1 p-3 gap-2 rounded-md shrink-0 items-center justify-center ${
								failedPages.length > 0
									? 'bg-accent/20 border border-red-600'
									: ''
							}`}
							onPress={() => setViewImageErrors(true)}
						>
							<View className="flex-row justify-center gap-2 items-center ">
								<MaterialCommunityIcons
									name="image-broken-variant"
									size={24}
									color={'white'}
								/>
								{failedPages.length > 0 && (
									<Text className="text-xs text-white">
										({failedPages.length})
									</Text>
								)}
							</View>
							<Text className="text-white text-sm font-pregular">
								View errors
							</Text>
						</TouchableOpacity>
					</View>

					<View className="flex-row justify-between items-center">
						<TouchableOpacity
							className="flex-row border-gray-600 border bg-secondary/30 px-7 p-2 gap-1 rounded-md shrink-0 items-center justify-center"
							onPress={onNavigateToPrevChapter}
						>
							<MaterialCommunityIcons
								name="skip-previous"
								size={24}
								color={'white'}
							/>
							<Text className="text-white text-sm font-pregular">
								Prev
							</Text>
						</TouchableOpacity>
						<Text className="text-white text-sm font-pregular">
							{currentPage + 1}/{pages.length}
						</Text>

						<TouchableOpacity
							className="flex-row border-gray-600 border bg-secondary/30 px-7 p-2 gap-1 rounded-md shrink-0 items-center justify-center"
							onPress={onNavigateToNextChapter}
						>
							<Text className="text-white text-sm font-pregular">
								Next
							</Text>
							<MaterialCommunityIcons
								name="skip-next"
								size={24}
								color={'white'}
							/>
						</TouchableOpacity>
					</View>
				</>
			)}
		</ModalPopup>
	);
};

export default ReaderOptionsSheet;
