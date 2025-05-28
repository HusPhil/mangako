import { colors } from '@/constants';
import { MangaChapter } from '@/services/ResponseTypes';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { Book, BookOpen } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';

interface ChapterListProps {
	mangaUrl: string;
	mangaId: string;
	chaptersData: MangaChapter[]; // Or a more detailed type if needed
	listStyles?: object;
	onRefresh: () => void;
	onChapterReadStatusChange: (index: number) => void;
	onChapterPress: (chapterId: string, chapterUrl: string) => void;
	isListed: boolean;
	headerComponent?: React.ReactNode;
	numberOfReadChapters: number;
}

interface ChapterItemProps {
	chapterId: string;
	chapterTitle: string;
	chapterUrl: string;
	chapterDateUploaded: string;
	index: number;
	onPress: (chapterId: string, chapterUrl: string) => void;
	isRead: boolean;
}

const ChapterItem: React.FC<ChapterItemProps> = ({
	chapterId,
	chapterTitle,
	chapterUrl,
	chapterDateUploaded,
	index,
	onPress,
	isRead,
}) => (
	<TouchableOpacity
		onPress={() => onPress(chapterId, chapterUrl)}
		className="flex-row items-center justify-between py-3 mx-4 border-b border-gray-700"
	>
		<View className={`flex-1 ${isRead ? 'opacity-50' : ''}`}>
			<Text className="text-white text-sm">{chapterTitle}</Text>
			{/* <Text className="text-gray-300 text-xs">Chapter {chapterUrl}</Text> */}
			<Text className="text-gray-300 text-xs mr-3">
				{chapterDateUploaded}
			</Text>
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

const ChapterList: React.FC<ChapterListProps> = ({
	mangaId,
	chaptersData,
	listStyles,
	onRefresh,
	onChapterReadStatusChange,
	onChapterPress,
	isListed,
	headerComponent,
	numberOfReadChapters,
}) => {
	// const {checkIfChapterRead, readChapters, markChapterAsRead, isLoading} = useReadChapters(mangaId as string);

	const renderChapterItem = ({
		item,
		index,
	}: {
		item: MangaChapter;
		index: number;
	}) => (
		<ChapterItem
			chapterId={item.chapterId}
			chapterTitle={item.chapterTitle}
			chapterUrl={item.chapterUrl}
			chapterDateUploaded={item.chapterTimeUploaded}
			index={index}
			onPress={onChapterPress}
			isRead={item.isRead ?? false}
		/>
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

	return (
		<View className="flex-1" style={listStyles}>
			<FlashList
				data={chaptersData}
				keyExtractor={(item) => item.chapterId}
				renderItem={renderChapterItem}
				estimatedItemSize={70}
				ListHeaderComponent={ListHeader}
				showsVerticalScrollIndicator={false}
				refreshing={false}
				onRefresh={onRefresh}
			/>
		</View>
	);
};

export default ChapterList;
