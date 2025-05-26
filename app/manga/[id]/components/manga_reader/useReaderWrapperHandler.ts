import { useRef } from "react";
import { GestureResponderEvent } from "react-native";

interface UseReaderWrapperHandlerProps {
  onDoubleTap: () => void;
  onTap: () => void;
}

const useReaderWrapperHandler = ({
  onDoubleTap,
  onTap,
}: UseReaderWrapperHandlerProps) => {
  const lastTouchStartTimeStamp = useRef(0);
  const lastTouchEndTimeStamp = useRef(0);
  const touchStartPageLocation = useRef({ pageX: 0, pageY: 0 });
  const singleTapTimeout = useRef<NodeJS.Timeout | null>(null);
  const cancelSingleTap = useRef(false);

  const handleOnTouchStart = async (event: GestureResponderEvent) => {
    const currentTouchTimeStamp = event.nativeEvent.timestamp;
    const { pageX, pageY } = event.nativeEvent;

    // set the new info to share with other components
    touchStartPageLocation.current = { pageX, pageY };
    lastTouchStartTimeStamp.current = currentTouchTimeStamp;
  };

  const handleOnTouchEnd = (event: GestureResponderEvent) => {
    if (cancelSingleTap.current) {
      cancelSingleTap.current = false;
      return;
    }

    const TAP_DURATION_THRESHOLD = 200; //in ms
    const DOUBLE_TAP_TIME_THRESHOLD = 350; // in ms
    const TAP_DISTANCE_THRESHOLD = 0.01; //in px

    const currentTouchTimeStamp = event.nativeEvent.timestamp;
    const touchDuration =
      currentTouchTimeStamp - lastTouchStartTimeStamp.current;
    const numOfTouch = event.nativeEvent.touches.length;

    const { pageX: touchEndPageX, pageY: touchEndPageY } = event.nativeEvent;
    const { pageX: touchStartPageX, pageY: touchStartPageY } =
      touchStartPageLocation.current;

    const distanceX = Math.abs(touchEndPageX - touchStartPageX);
    const distanceY = Math.abs(touchEndPageY - touchStartPageY);

    const isTapGesture =
      touchDuration < TAP_DURATION_THRESHOLD &&
      distanceX < TAP_DISTANCE_THRESHOLD &&
      distanceY < TAP_DISTANCE_THRESHOLD;
    // numOfTouch === 0

    
    if (!isTapGesture) {
        lastTouchEndTimeStamp.current = currentTouchTimeStamp;
        return;
    }

    const isDoubleTapGesture =
      lastTouchStartTimeStamp.current - lastTouchEndTimeStamp.current <
      DOUBLE_TAP_TIME_THRESHOLD;

    if (isDoubleTapGesture && singleTapTimeout.current) {
      clearTimeout(singleTapTimeout.current);
      onDoubleTap();

      lastTouchEndTimeStamp.current = currentTouchTimeStamp;
      return;
    }

    singleTapTimeout.current = setTimeout(() => {
      onTap();
    }, DOUBLE_TAP_TIME_THRESHOLD);

    lastTouchEndTimeStamp.current = currentTouchTimeStamp;
  };

  return { handleOnTouchStart, handleOnTouchEnd };
};

export default useReaderWrapperHandler;
