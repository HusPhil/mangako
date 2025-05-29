import {
  ReactNativeZoomableView,
  ZoomableViewEvent
} from "@openspacelabs/react-native-zoomable-view";
import { Dimensions, GestureResponderEvent, PanResponderGestureState } from "react-native";

interface UseZoomableViewHandlersProps {
  setPanEnabled: (panEnabled: boolean) => void,
  handleReaderNavigation: (navigationMode: {
    mode: string;
    jumpIndex?: number;
    jumpOffset?: number;
  }) => void,
  currentZoomLevel: React.RefObject<number>,
  zoomableViewRef: React.RefObject<ReactNativeZoomableView | null>,
  inverted: boolean,
  horizontal: boolean
}

const screenWidth = Dimensions.get("screen").width;
const screenHeight = Dimensions.get("screen").height;

const useZoomableViewHandlers = ({
  setPanEnabled,
  handleReaderNavigation,
  currentZoomLevel,
  zoomableViewRef,
  inverted,
  horizontal
}: UseZoomableViewHandlersProps) => {

  const handleOnTransform = ({ zoomLevel }: { zoomLevel: number }) => {
    if (zoomLevel === 1) setPanEnabled(false);
    else setPanEnabled(true);
    currentZoomLevel.current = zoomLevel;
  };

  const handleOnDoubleTapAfter = () => {
    if (currentZoomLevel.current > 1) {
      zoomableViewRef.current?.zoomTo(1, { x: 0, y: 0 });
    }
  };

  const handleOnShiftingEnd = (
    gestureEvent: GestureResponderEvent,
    gestureState: PanResponderGestureState,
    zoomableViewEventObject: ZoomableViewEvent
  ) => {
    if (!horizontal) return;
    
    const halfScaledWidth =
      (zoomableViewEventObject.zoomLevel *
        zoomableViewEventObject.originalWidth) /
      2;
    const quarterScreenWidth = screenWidth / 4;
    const screenOffsetXConstant = screenWidth / (2 * halfScaledWidth);
    const scrollToNextThreshold =
      screenWidth / 2 - quarterScreenWidth * screenOffsetXConstant;

    if (Math.abs(zoomableViewEventObject.offsetX) < scrollToNextThreshold)
      return;

    zoomableViewRef.current?.zoomTo(1, { x: 0, y: 0 });
    
    // Determine direction considering both offsetX and inverted mode
    // When inverted is true, we reverse the navigation direction
    const isMovingLeft = zoomableViewEventObject.offsetX < 0;
    const shouldGoNext = (isMovingLeft && !inverted) || (!isMovingLeft && inverted);
    
    handleReaderNavigation({ 
      mode: shouldGoNext ? "next" : "prev" 
    });
  };
  
  const handleOnStartShouldSetPanResponderCapture = (
    gestureEvent: GestureResponderEvent,
    gestureState: PanResponderGestureState
  ) => {
    if (
      currentZoomLevel.current === 1 &&
      gestureState.numberActiveTouches === 1
    ) {
      // gestureEvent.preventDefault();
      gestureEvent.stopPropagation();
      return false;
    }
    return true;
  };

  return {
    handleOnTransform,
    handleOnDoubleTapAfter,
    handleOnShiftingEnd,
    handleOnStartShouldSetPanResponderCapture,
  }
}

export default useZoomableViewHandlers;
