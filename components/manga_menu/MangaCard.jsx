import React, { useState, useEffect } from 'react';
import { View, Text, Image, Button, Alert, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

import images  from "../../constants/images"
 
const MangaCard = ({ 
  mangaId, mangaUrl, containerStyles, coverStyles, 
  mangaTitle, mangaCover, mangaDetails, 
  autoload, children, disabled,

}) => {
  
  const handlePress = () => {
    if(!mangaDetails) {
      router.navigate({
        pathname: "screens/manga_info",
        params: {
          "mangaId": mangaId,
          "mangaCover": mangaCover,
          "mangaTitle": mangaTitle,
          "mangaUrl": mangaUrl || "NONE"
        }
      })
    }
  }

  const source = autoload ? coverImgUrl : mangaCover;
  
  return (
    <TouchableOpacity 
      className={`${containerStyles} rounded-md overflow-hidden bg-accent-100 border-2 border-accent-100`}
      onPress={handlePress}
      disabled={disabled}
    >
      <ImageBackground
        source={source ? { uri: source } : images.test}   
        className={`${coverStyles} relative`}
        resizeMode='cover'
      >
      </ImageBackground>
        {children}
    </TouchableOpacity>
  );
}

export default MangaCard;
