import React, { useState, useEffect } from 'react';
import { View, ScrollView, Image, Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const LongImage = ({ imageUrl }) => {
  const [imageHeight, setImageHeight] = useState(0);

  useEffect(() => {
    Image.getSize(imageUrl, (width, height) => {
      const aspectRatio = width / height;
      const calculatedHeight = screenWidth / aspectRatio;
      setImageHeight(calculatedHeight);
    });
  }, [imageUrl]);

  return (
    <ScrollView>
      <Image
        source={{ uri: imageUrl }}
        style={{ width: screenWidth, height: imageHeight }}
        resizeMode="contain"
      />
    </ScrollView>
  );
};

export default LongImage;
