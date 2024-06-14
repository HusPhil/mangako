import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import images from "../constants/images";
import { Image } from 'expo-image';

const ExpoImage = ({ imgSrc, imgWidth, imgAR }) => {
  return (
      <Image source={imgSrc} 
        style={{
            width: imgWidth, 
            height: undefined, 
            aspectRatio: imgAR
        }} 
        cachePolicy={'memory'}/>
  );
};


export default ExpoImage;
