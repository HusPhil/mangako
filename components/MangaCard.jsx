import React, { useState, useEffect } from 'react';
import { View, Text, Image, Button, Alert, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';

import { getMangaById, getMangaByTitle } from '../utils/MangaDexClient'
import images  from "../constants/images"
 
const MangaCard = ({ mangaId, containerStyles, coverStyles, mangaTitle, mangaCover }) => {
  
  const [title, setTitle] = useState("")
  const [coverImgUrl, setCoverImgUrl] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        if(mangaId) {
          const result = await getMangaById(mangaId);
          setCoverImgUrl(result.cover);
          setTitle(result.title);
        }
      } catch (error) {
        Alert.alert("Error", error.message);
      }
    };

    fetchData();
  }, [mangaId]);
  
  const handlePress = () => {
    Alert.alert(title ? title : mangaTitle)
  }

  const source = mangaId ? coverImgUrl : mangaCover;
  const displayTitle = mangaId ? title : mangaTitle;
  
  return (
    <TouchableOpacity 
      className={`${containerStyles} rounded-md overflow-hidden bg-red-400 border-2`}
      onPress={handlePress}
    >
      <ImageBackground
        source={source ? { uri: source } : images.test}   
        className={`${coverStyles} relative`}
        resizeMode='cover'
      >
        <Image 
          className="w-full h-full bg-black" 
          style={{ opacity: 0.2 }} 
        />
        <View className="absolute top-[115] w-full items-center overflow-hidden">
          <Text className="text-white text-xs text-left px-1">{displayTitle ? displayTitle : "Loading.."}</Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

export default MangaCard;
