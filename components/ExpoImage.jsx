import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import images from "../constants/images";
import { Image } from 'expo-image';

const ExpoImage = ({ imgSrc, imgWidth, imgAR }) => {
  
  const headers = {
    'sec-ch-ua': '"Microsoft Edge";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
    'Referer': 'https://chapmanganato.to/',
    'sec-ch-ua-mobile': '?0',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0',
    'sec-ch-ua-platform': '"Windows"'
  };

  return (
      <Image source={{ uri: imgSrc, headers }} 
        style={{
            width: imgWidth, 
            height: undefined, 
            aspectRatio: imgAR
        }} 
        cachePolicy={'memory'}/>
  );
};


export default ExpoImage;
