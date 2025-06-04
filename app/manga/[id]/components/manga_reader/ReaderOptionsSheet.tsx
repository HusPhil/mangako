import ModalPopup from '@/components/modal/ModalPopup';
import ReaderDropDownList from '@/components/modal/ReaderDropdownList';
import { ReaderMode } from '@/services/cache/types';
import { useReadChapters } from '@/services/cache/useReadChapters';
import { READER_MODES } from '@/services/cache/useReadingOptions';
import { MangaChapterPage } from '@/services/ResponseTypes';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface ReaderOptionsSheetProps {
	visible: boolean;
	mangaId: string;
	chapterTitle: string;
	chapterId: string;
	currentPage: number;
	totalPages: number;
	readingMode: ReaderMode;
	flashListRef: React.RefObject<FlashList<MangaChapterPage> | null>;
	onClose: () => void;
	onShow?: () => void;
	onNavigate: (mode: { mode: string; jumpIndex?: number }) => void;
	onToggleReadingMode: (readingMode: ReaderMode) => void;
	onNavigateToNextChapter: () => void;
	onNavigateToPrevChapter: () => void;
}

const ReaderOptionsSheet: React.FC<ReaderOptionsSheetProps> = ({
	visible,
	mangaId,
	chapterId,
	chapterTitle,
	currentPage,
	totalPages,
	readingMode,
	onClose,
	onShow,
	onNavigate,
	onToggleReadingMode,
	flashListRef,
	onNavigateToNextChapter,
	onNavigateToPrevChapter,
}) => {
	const [pageInput, setPageInput] = useState('');
	const [isChapterRead, setIsChapterRead] = useState(false);

	const readingModeOptions = [
		{
			label: 'Vertical',
			value: 'vertical',
			desc: 'Scroll vertically through pages',
		},
		{
			label: 'Horizontal',
			value: 'horizontal',
			desc: 'Swipe horizontally between pages',
		},
	];

	// const [isChapterRead, setIsChapterRead] = useState(false);
	const { markChapterAsRead, checkIfChapterRead } = useReadChapters(
		mangaId as string
	);

	const handleJumpToPage = () => {
		const pageNumber = parseInt(pageInput);
		if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > totalPages)
			return;

		onNavigate({ mode: 'jump', jumpIndex: pageNumber - 1 });
		setPageInput('');
	};

	const handleMarkAsRead = () => {
		markChapterAsRead(chapterId as string);
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

	return (
		<ModalPopup
			headerTitle={chapterTitle}
			visible={visible}
			handleClose={onClose}
			otherStyles={{
				backgroundColor: 'transparent',
				alignSelf: 'center',
			}}
		>
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
							isChapterRead ? 'book-check' : 'book-check-outline'
						}
						size={24}
						color={isChapterRead ? 'red' : 'white'}
					/>
					<Text
						className={`text-sm font-pregular ${
							isChapterRead ? 'text-accent' : 'text-white '
						}`}
					>
						{isChapterRead ? 'Mark as Unread' : 'Mark as Read'}
					</Text>
				</TouchableOpacity>
				{/* image errors */}
				<TouchableOpacity className="flex-1 p-3 gap-2   rounded-md shrink-0 items-center justify-center">
					<View className="flex-row justify-center gap-2 items-center">
						<MaterialCommunityIcons
							name="image-broken-variant"
							size={24}
							color={'white'}
						/>
						<Text className="text-xs text-white">(123)</Text>
					</View>
					<Text className="text-white text-sm font-pregular">
						Image errors
					</Text>
				</TouchableOpacity>
			</View>

			<View className="flex-row justify-between">
				<TouchableOpacity className="flex-row border-gray-600 border bg-secondary/30 px-7 p-2 gap-1 rounded-md shrink-0 items-center justify-center">
					<MaterialCommunityIcons
						name="skip-previous"
						size={24}
						color={'white'}
					/>
					<Text className="text-white text-sm font-pregular">
						Prev
					</Text>
				</TouchableOpacity>
				<TouchableOpacity className="flex-row border-gray-600 border bg-secondary/30 px-7 p-2 gap-1 rounded-md shrink-0 items-center justify-center">
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
		</ModalPopup>
	);
};

export default ReaderOptionsSheet;
