import { MangaChapterPage } from '@/services/ResponseTypes';
import {
	ReactNativeZoomableView,
	ZoomableViewEvent,
} from '@openspacelabs/react-native-zoomable-view';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
// import { Image } from 'expo-image';
import React, { useCallback } from 'react';
import {
	Dimensions,
	GestureResponderEvent,
	Image,
	PanResponderGestureState,
	ScrollViewProps,
	View,
	ViewToken
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import GestureScrollView from './GestureScrollView';
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
	handleOnZoomEnd: (event: GestureResponderEvent, gestureState: PanResponderGestureState, zoomableViewEventObject: ZoomableViewEvent) => void;
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
	handleOnStartShouldSetPanResponderCapture,
	handleOnZoomEnd,
	handleOnTransform,
	handleOnDoubleTapAfter,
	handleOnShiftingEnd,
	handleViewableItemsChanged,
}: MangaReaderProps) => {
	const renderItem = ({ item }: { item: MangaChapterPage }) => (
		<View className="flex-1 justify-center items-center">
			<Image
				source={{ uri: item.pageImageUrl, headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
					'Accept': 'image/*',
					'Accept-Language': 'en-US,en;q=0.9',
					'Referer': 'https://mangakakalot.com/',
					
				} }}
				style={{
					width: screenWidth,
					height: undefined,
					aspectRatio: item.pageWidth / item.pageHeight,
				}}
				// contentFit="contain" // This makes the image scale to fit inside width & height without cropping
				// recyclingKey={item.pageId}
				// allowDownscaling={false}
				onLoad={()=>{
					console.log('onLoad');
				}}
				// placeholder={{ blurhash }}
				// onError={(error) => {
				// 	console.error('CHAPTER PAGE ERROR: ' + error.error);
				// }}
			/>
		</View>
	);

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
			onSingleTap={handleScrollSingleTap}
			onDoubleTap={handleScrollDoubleTap}
			onLongPress={handleScrollLongPress}
		  />
		),
		[handleScrollSingleTap, handleScrollDoubleTap, handleScrollLongPress]
	  );
	

	const getMangaReaderFlashListKey = () => {
		return horizontal ? 'horizontal, inverted: ' + inverted : 'vertical, inverted: ' + inverted;
	}

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
				viewabilityConfig={viewabilityConfig}
				onEndReachedThreshold={0.5}
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
