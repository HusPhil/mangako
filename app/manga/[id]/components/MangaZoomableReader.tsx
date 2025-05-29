import { MangaChapterPage } from '@/services/ResponseTypes';
import {
	ReactNativeZoomableView,
	ZoomableViewEvent,
} from '@openspacelabs/react-native-zoomable-view';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import React, { useCallback } from 'react';
import {
	Dimensions,
	GestureResponderEvent,
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
	handleOnTouchStart: (event: GestureResponderEvent) => void;
	handleOnTouchEnd: (event: GestureResponderEvent) => void;
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
	handleOnTouchStart,
	handleOnTouchEnd,
	handleOnStartShouldSetPanResponderCapture,
	handleOnTransform,
	handleOnDoubleTapAfter,
	handleOnShiftingEnd,
	handleViewableItemsChanged,
}: MangaReaderProps) => {
	const renderItem = ({ item }: { item: MangaChapterPage }) => (
		<View className="flex-1 justify-center items-center">
			<Image
				source={{ uri: item.pageImageUrl }}
				style={{
					width: screenWidth,
					height: undefined,
					aspectRatio: item.pageWidth / item.pageHeight,
				}}
				contentFit="contain" // This makes the image scale to fit inside width & height without cropping
				recyclingKey={item.pageId}
				allowDownscaling={false}
				placeholder={{ blurhash }}
				onError={(error) => {
					console.error('CHAPTER PAGE ERROR: ' + error.error);
				}}
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
			onZoomEnd={(e,g,z)=>{
				if(z.zoomLevel === 1){
					zoomableViewRef.current?.zoomTo(1, { x: 0, y: 0 });
				}
			}}
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
				data={pages}
				initialScrollIndex={currentPage}
				keyExtractor={(item) => item.pageId}
				renderItem={renderItem}
				showsHorizontalScrollIndicator={false}
				pointerEvents={panEnabled ? 'none' : 'auto'}
				ref={flashListRef}
				estimatedItemSize={horizontal ? screenWidth : screenHeight}
				onViewableItemsChanged={handleViewableItemsChanged}
				viewabilityConfig={viewabilityConfig}
				onEndReachedThreshold={0.5}
				pagingEnabled={horizontal}
				horizontal={horizontal}
				inverted={inverted}
				renderScrollComponent={MangaReaderScrollComponent}
				onEndReached={() => {
					// Snackbar.show({
					//     text: "End reached",
					// });
				}}
			/>
		</ReactNativeZoomableView>
		</GestureHandlerRootView>
	);
};

export default MangaZoomableReader;
