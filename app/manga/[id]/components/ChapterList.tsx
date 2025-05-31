import { colors } from '@/constants';
import { MangaChapter } from '@/services/ResponseTypes';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import {
	ArrowDownIcon,
	ArrowUpIcon,
	Book,
	BookOpen,
} from 'lucide-react-native';
import React, {
	forwardRef,
	useCallback,
	useImperativeHandle,
	useState,
} from 'react';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';
import useScrollToTopAndBottom from './manga_reader/useScrollToTopAndBottom';

interface ChapterListProps {
	mangaUrl: string;
	mangaId: string;
	chaptersData: MangaChapter[]; // Or a more detailed type if needed
	selectionModeOn: boolean;
	listStyles?: object;
	onRefresh: () => void;
	onChapterReadStatusChange: (index: number) => void;
	onChapterPress: (chapterId: string, chapterUrl: string) => void;
	onChapterLongPress: (chapterId: string, chapterUrl: string) => void;
	isListed: boolean;
	headerComponent?: React.ReactNode;
	numberOfReadChapters: number;
	selectedChapters: Set<string>;
	registerChapterRef: (chapterId: string, ref: any) => void;
	unregisterChapterRef: (chapterId: string) => void;
}

const ChapterList: React.FC<ChapterListProps> = ({
	mangaId,
	chaptersData,
	listStyles,
	onRefresh,
	onChapterReadStatusChange,
	onChapterLongPress,
	onChapterPress,
	isListed,
	headerComponent,
	numberOfReadChapters,
	selectionModeOn,
	selectedChapters,
	registerChapterRef,
	unregisterChapterRef,
}) => {
	// const {checkIfChapterRead, readChapters, markChapterAsRead, isLoading} = useReadChapters(mangaId as string);

	const {
		showBtnToTop,
		showBtnToBottom,
		handleScroll,
		flashListref,
		handleScrollToTop,
		handleScrollToEnd,
	} = useScrollToTopAndBottom();

	const createChapterRef = useCallback(
		(chapterId: string) => {
			return (ref: any) => {
				if (ref) {
					registerChapterRef(chapterId, ref);
				} else {
					unregisterChapterRef(chapterId);
				}
			};
		},
		[registerChapterRef, unregisterChapterRef]
	);

	const renderChapterItem = useCallback(
		({ item, index }: { item: MangaChapter; index: number }) => (
			<ChapterItem
				ref={createChapterRef(item.chapterId)}
				key={item.chapterId}
				chapterId={item.chapterId}
				chapterTitle={item.chapterTitle}
				chapterUrl={item.chapterUrl}
				chapterDateUploaded={item.chapterTimeUploaded}
				index={index}
				onLongPress={onChapterLongPress}
				onPress={onChapterPress}
				isRead={item.isRead ?? false}
				selectionModeOn={selectionModeOn}
				initialIsSelected={selectedChapters.has(item.chapterId)}
			/>
		),
		[
			onChapterLongPress,
			onChapterPress,
			selectionModeOn,
			createChapterRef,
			selectedChapters,
		]
	);

	const ListHeader = () => (
		<>
			{headerComponent}
			<View className="flex-row justify-between items-center mb-5 mx-4">
				<Text className="text-white font-semibold">
					{chaptersData.length} chapters
				</Text>
				<Pressable>
					<Ionicons name="filter-outline" size={20} color="white" />
				</Pressable>
			</View>
		</>
	);

	const keyExtractor = useCallback(
		(item: MangaChapter) => item.chapterId,
		[]
	);

	return (
		<View className="flex-1 relative" style={listStyles}>
			<FlashList
				data={chaptersData}
				ref={flashListref}
				onScroll={handleScroll}
				keyExtractor={keyExtractor}
				renderItem={renderChapterItem}
				estimatedItemSize={100}
				ListHeaderComponent={ListHeader}
				showsVerticalScrollIndicator={false}
				refreshing={false}
				onRefresh={onRefresh}
				extraData={selectionModeOn}
			/>
			{showBtnToBottom && (
				<TouchableOpacity
					className="absolute bottom-5 p-3 bg-primary rounded-xl self-center"
					onPress={handleScrollToEnd}
				>
					<ArrowDownIcon size={24} color="white" />
				</TouchableOpacity>
			)}
			{showBtnToTop && (
				<TouchableOpacity
					className="absolute bottom-5 p-3 bg-primary rounded-xl self-center"
					onPress={handleScrollToTop}
				>
					<ArrowUpIcon size={24} color="white" />
				</TouchableOpacity>
			)}
		</View>
	);
};

export default ChapterList;





















interface ChapterItemProps {
	chapterId: string;
	chapterTitle: string;
	chapterUrl: string;
	chapterDateUploaded: string;
	selectionModeOn: boolean;
	index: number;
	isRead: boolean;
	initialIsSelected: boolean;
	onPress: (chapterId: string, chapterUrl: string) => void;
	onLongPress: (chapterId: string, chapterUrl: string) => void;
}

interface ChapterItemRef {
	updateSelection: (selected: boolean) => void;
}

const ChapterItem = forwardRef<ChapterItemRef, ChapterItemProps>(
	(
		{
			chapterId,
			chapterTitle,
			chapterUrl,
			chapterDateUploaded,
			index,
			onLongPress,
			onPress,
			isRead,
			selectionModeOn,
			initialIsSelected,
		},
		ref
	) => {
		const [isSelected, setIsSelected] = useState(initialIsSelected);

		useImperativeHandle(ref, () => ({
			updateSelection: (selected: boolean) => {
				setIsSelected(selected);
			},
		}));

		const handlePress = useCallback(() => {
			onPress(chapterId, chapterUrl);
		}, [chapterId, chapterUrl, onPress]);

		const handleLongPress = useCallback(() => {
			onLongPress(chapterId, chapterUrl);
		}, [chapterId, chapterUrl, onLongPress]);

		return (
			<TouchableOpacity
				onPress={handlePress}
				onLongPress={handleLongPress}
				className={`flex-row items-center justify-between py-3 mx-4 border-b border-gray-700`}
			>
				<View className="flex-row items-center flex-1">
					{selectionModeOn && (
						<View className="mr-3">
							<Ionicons
								name={
									isSelected
										? 'checkmark-circle'
										: 'ellipse-outline'
								}
								size={24}
								color={
									isSelected ? colors.accent.DEFAULT : 'white'
								}
							/>
						</View>
					)}
					<View className={`flex-1 ${isRead ? 'opacity-50' : ''}`}>
						<Text className="text-white text-sm">
							{chapterTitle}
						</Text>
						<Text className="text-gray-300 text-xs mr-3">
							{chapterDateUploaded}
						</Text>
					</View>
				</View>
				<View className="flex-row items-center">
					{isRead ? (
						<BookOpen size={20} color={colors.accent[100]} />
					) : (
						<Book size={20} color="white" />
					)}
				</View>
			</TouchableOpacity>
		);
	}
);

ChapterItem.displayName = 'ChapterItem';
