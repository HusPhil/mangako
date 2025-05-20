import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Modal, View } from "react-native";

const ModalPopup = ({ otherStyles, children, visible, handleClose }) => {
  const [showModal, setShowModal] = useState(visible);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start(() => setShowModal(false));
    }
  }, [visible]);

  const slideUp = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0], // Slide up from 300px to 0px
  });

  return (
    <View>
      <Modal
        visible={showModal}
        onRequestClose={handleClose}
        animationType="fade"
        transparent
        statusBarTranslucent
      >
        <View
          style={[
            {
              alignItems: "center",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              padding: 10,
              height: "100%",
            },
          ]}
        >
          <Animated.View
            style={[
              otherStyles,
              {
                transform: [{ translateY: slideUp }],
                height: "auto",
                width: "100%",
                borderRadius: 10,
              },
            ]}
          >
            {children}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

export default React.memo(ModalPopup);
