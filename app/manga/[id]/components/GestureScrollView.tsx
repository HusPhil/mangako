import React, { forwardRef, useCallback } from 'react';
import { ScrollView, ScrollViewProps } from 'react-native';
import {
	Gesture,
	GestureDetector,
} from 'react-native-gesture-handler';

interface GestureScrollViewProps extends ScrollViewProps {
  onSingleTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
}

const GestureScrollView = forwardRef<ScrollView, GestureScrollViewProps>(
  ({ onSingleTap, onDoubleTap, onLongPress, children, ...scrollViewProps }, ref) => {
    
    const handleSingleTap = useCallback(() => {
      onSingleTap?.();
    }, [onSingleTap]);

    const handleDoubleTap = useCallback(() => {
      onDoubleTap?.();
    }, [onDoubleTap]);

    const handleLongPress = useCallback(() => {
      onLongPress?.();
    }, [onLongPress]);

    const createScrollGesture = useCallback(() => {
      // Single tap gesture
      const singleTap = Gesture.Tap()
        .numberOfTaps(1)
        .maxDuration(250)
        .runOnJS(true)
        .onEnd(handleSingleTap);

      // Double tap gesture
      const doubleTap = Gesture.Tap()
        .numberOfTaps(2)
        .maxDuration(250)
        .runOnJS(true)
        .onEnd(handleDoubleTap);

      // Long press gesture
      const longPress = Gesture.LongPress()
        .minDuration(500)
        .runOnJS(true)
        .onStart(handleLongPress);

      // Race allows long press to compete with taps
      // Exclusive prevents single tap when double tap occurs
      // simultaneousWithExternalGesture allows scrolling to work
      return Gesture.Race(
        longPress,
        Gesture.Exclusive(
          doubleTap,
          singleTap.requireExternalGestureToFail(doubleTap)
        )
      );
    }, [handleSingleTap, handleDoubleTap, handleLongPress]);

    const gesture = createScrollGesture();

    return (
      <GestureDetector gesture={gesture}>
        <ScrollView
          ref={ref}
          {...scrollViewProps}
        >
          {children}
        </ScrollView>
      </GestureDetector>
    );
  }
);

GestureScrollView.displayName = 'GestureScrollView';

export default GestureScrollView;


