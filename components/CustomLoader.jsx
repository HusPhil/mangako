import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const CustomLoader = ({ iconComponent, doneLoading }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const stopLoopRef = useRef(doneLoading);

  useEffect(() => {
    const loopAnimation = () => {
      if (stopLoopRef.current) return;
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => loopAnimation());
    };

    loopAnimation();

    return () => {
      stopLoopRef.current = true;
    };
  }, [opacity]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity }}>
        {iconComponent ? (
          iconComponent
        ) : (
          <MaterialIcons name="av-timer" size={50} color="white" />
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CustomLoader;
