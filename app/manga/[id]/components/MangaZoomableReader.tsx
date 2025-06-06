import { MangaChapterPage } from '@/services/ResponseTypes';
import {
	ReactNativeZoomableView,
	ZoomableViewEvent,
} from '@openspacelabs/react-native-zoomable-view';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import React, { useCallback } from 'react';
import {
	Dimensions,
	GestureResponderEvent,
	PanResponderGestureState,
	ScrollViewProps,
	ViewToken,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ChapterPage from './ChapterPage';
import GestureScrollView from './GestureScrollView';
import { ChapterPageRef } from './manga_reader/useChapterPageErrors';
interface MangaReaderProps {
	zoomableViewRef: React.RefObject<ReactNativeZoomableView | null>;
	panEnabled: boolean;
	pages: MangaChapterPage[];
	flashListRef: React.RefObject<FlashList<MangaChapterPage> | null>;
	horizontal: boolean;
	inverted: boolean;
	currentPage: number;
	onSingleTap: () => void;
	onDoubleTap: () => void;
	registerFailedPage: (pageId: string, ref: ChapterPageRef) => void;
	unregisterFailedPage: (pageId: string) => void;
	handleOnZoomEnd: (
		event: GestureResponderEvent,
		gestureState: PanResponderGestureState,
		zoomableViewEventObject: ZoomableViewEvent
	) => void;
	handleOnTransform: (zoomableViewEventObject: ZoomableViewEvent) => void;
	handleOnDoubleTapAfter: (event: GestureResponderEvent) => void;
	handleOnStartShouldSetPanResponderCapture: (
		event: GestureResponderEvent,
		gestureState: PanResponderGestureState
	) => boolean;
	handleOnShiftingEnd: (
		event: GestureResponderEvent,
		gestureState: PanResponderGestureState,
		zoomableViewEventObject: ZoomableViewEvent
	) => void;
	handleViewableItemsChanged: (event: {
		viewableItems: ViewToken[];
		changed: ViewToken[];
	}) => void;
	handleOnEndReached: () => void;
}

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const blurhash = 'LJFFaY^-ENpJ.ANFROn%Ioa#xDoJ';

const MangaZoomableReader = ({
	flashListRef,
	panEnabled,
	zoomableViewRef,
	pages,
	horizontal,
	inverted,
	currentPage,
	onSingleTap,
	onDoubleTap,
	registerFailedPage,
	unregisterFailedPage,
	handleOnStartShouldSetPanResponderCapture,
	handleOnZoomEnd,
	handleOnTransform,
	handleOnDoubleTapAfter,
	handleOnShiftingEnd,
	handleViewableItemsChanged,
	handleOnEndReached,
}: MangaReaderProps) => {
	const renderItem = ({ item }: { item: MangaChapterPage }) => {
		return (
			<ChapterPage
				item={item}
				screenWidth={screenWidth}
				blurhash={blurhash}
				onErrorRegister={registerFailedPage}
				onErrorClear={unregisterFailedPage}
			/>
		);
	};

	const viewabilityConfig = {
		minimumViewTime: 300, // How long an item should be visible (ms)
		itemVisiblePercentThreshold: 30, // Consider it visible if 30% is on screen
		waitForInteraction: false,
	};

	// Handle gesture events
	const handleScrollSingleTap = useCallback(() => {
		console.log('Single tap detected on scroll area');
		onSingleTap();
	}, [onSingleTap]);

	const handleScrollDoubleTap = useCallback(() => {
		console.log('Double tap detected on scroll area');
		onDoubleTap();
	}, [onDoubleTap]);

	const handleScrollLongPress = useCallback(() => {
		console.log('Long press detected on scroll area');
		onSingleTap();
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
	}, [onSingleTap]);

	// Create the custom scroll component with gestures
	const MangaReaderScrollComponent = useCallback(
		(props: ScrollViewProps) => (
			<GestureScrollView
				{...props}
				disableScrollViewPanResponder
				onSingleTap={handleScrollSingleTap}
				onDoubleTap={handleScrollDoubleTap}
				onLongPress={handleScrollLongPress}
			/>
		),
		[handleScrollSingleTap, handleScrollDoubleTap, handleScrollLongPress]
	);

	const getMangaReaderFlashListKey = () => {
		return horizontal
			? 'horizontal, inverted: ' + inverted
			: 'vertical, inverted: ' + inverted;
	};

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<ReactNativeZoomableView
				ref={zoomableViewRef}
				disablePanOnInitialZoom
				zoomStep={3}
				minZoom={1}
				maxZoom={3.5}
				pinchToZoomInSensitivity={1.5}
				movementSensibility={1}
				contentWidth={screenWidth}
				contentHeight={screenHeight}
				bindToBorders
				onZoomEnd={handleOnZoomEnd}
				onLongPress={handleScrollLongPress}
				onSingleTap={handleScrollSingleTap}
				doubleTapZoomToCenter={false}
				onTransform={handleOnTransform}
				onDoubleTapAfter={handleOnDoubleTapAfter}
				onShiftingEnd={handleOnShiftingEnd}
				onStartShouldSetPanResponderCapture={
					handleOnStartShouldSetPanResponderCapture
				}
			>
				<FlashList
					className="w-screen h-screen"
					ref={flashListRef}
					data={pages}
					key={getMangaReaderFlashListKey()}
					initialScrollIndex={currentPage}
					keyExtractor={(item) => item.pageId}
					renderItem={renderItem}
					showsHorizontalScrollIndicator={false}
					pointerEvents={panEnabled ? 'none' : 'auto'}
					estimatedItemSize={horizontal ? screenWidth : screenHeight}
					onViewableItemsChanged={handleViewableItemsChanged}
					onEndReached={handleOnEndReached}
					pagingEnabled={horizontal}
					horizontal={horizontal}
					inverted={inverted}
					renderScrollComponent={MangaReaderScrollComponent}
				/>
			</ReactNativeZoomableView>
		</GestureHandlerRootView>
	);
};

export default MangaZoomableReader;
