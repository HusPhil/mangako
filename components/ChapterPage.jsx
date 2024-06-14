import { View, Text, Dimensions, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import * as FileSystem from 'expo-file-system';

import ExpoImage from './ExpoImage';

const ChapterPage = () => {
  const [isLoading, setIsLoading] = useState(false)
  
  const screenSize = {
    width:  Dimensions.get('window').width,
    height:  Dimensions.get('window').height  
  }

    return (
    <View 
        style={{width: screenSize.width, height: screenSize.height}}
        className="justify-center items-center border border-accent-100"
    >
        <ActivityIndicator />
    </View>
  )
}

export default ChapterPage