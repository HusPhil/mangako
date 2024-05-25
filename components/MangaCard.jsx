import React, { useState, useEffect } from 'react';
import { View, Text, Image, Button, Alert, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';

import { getMangaById, getMangaByTitle } from '../utils/MangaDexClient'
import { images } from "../constants"
 
const MangaCard = ({ mangaId }) => {
  
  const [title, setTitle] = useState("")
  const [coverImgUrl, setCoverImgUrl] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getMangaById(mangaId);
        setCoverImgUrl(result.cover);
        setTitle(result.title);
      } catch (error) {
        Alert.alert("Error", error.message);
      }
    };

    fetchData();
  }, [mangaId]);
  
  
  return (
    <TouchableOpacity className="w-[100px] h-[150px] rounded-xl overflow-hidden relative">
      <ImageBackground
        source={coverImgUrl ? { uri: coverImgUrl } : images.test }   
        className="w-full h-full "
        resizeMode='cover'
      >
        <Image 
          className="w-full h-full bg-black" 
          style={{ opacity: 0.2 }} 
        />
        <View className="absolute bottom-3 w-full items-center">
          <Text className="text-white text-xs text-left px-2">{title ? (title.length > 20 ? `${title.slice(0, 20)}...` : title) : "Loading.."}</Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

export default MangaCard;
