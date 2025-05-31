import { MangaChapter } from "@/services/ResponseTypes";
import { FlashList } from "@shopify/flash-list";
import { useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

const useScrollToTopAndBottom = () => {
	const [showBtnToTop, setShowBtnToTop] = useState(false);
	const [showBtnToBottom, setShowBtnToBottom] = useState(false);
	const flashListref = useRef<FlashList<MangaChapter>>(null);
	const previousScrollY = useRef(0);

	const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
		const {
			nativeEvent: {
				contentOffset: { y },
				contentSize: { height: contentHeight },
				layoutMeasurement: { height: visibleHeight },
			},
		} = event;

		const isScrollingDown = previousScrollY.current < y;
		const isScrollingUp = previousScrollY.current > y;

		const upwardThreshold = contentHeight * 0.95;
		const downwardThreshold = contentHeight * 0.05;
		const midPoint = contentHeight * 0.5;

		if (y === 0) {
			setShowBtnToTop(false);
		} else if (y + visibleHeight >= contentHeight) {
			setShowBtnToBottom(false);
		} else if (isScrollingDown) {
			setShowBtnToTop(false);
			setShowBtnToBottom(y > downwardThreshold && y < midPoint);
		} else if (isScrollingUp) {
			setShowBtnToBottom(false);
			setShowBtnToTop(y < upwardThreshold && y > midPoint);
		}

		previousScrollY.current = y;
	};

	const handleScrollToTop = () => {
		const flashList = flashListref.current;
		if (flashList) {
			flashList.scrollToOffset({ offset: 0, animated: true });
		}
	};

	const handleScrollToEnd = () => {
		const flashList = flashListref.current;
		if (flashList) {
			flashList.scrollToEnd({ animated: true });
		}
	};

	return {
		showBtnToTop,
		showBtnToBottom,
		handleScroll,
		handleScrollToTop,
		handleScrollToEnd,
		flashListref,
	};
};

export default useScrollToTopAndBottom;
