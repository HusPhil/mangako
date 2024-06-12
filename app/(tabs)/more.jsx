import React, { useState } from 'react';
import { View, Button, Image, ScrollView, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import soloLevelingImage from '../../assets/images/soloLeveling.jpg'; // Import the image directly

const More = () => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <ScrollView contentContainerStyle={{ justifyContent: 'center', alignItems: 'center' }}>
      <Image
        source={soloLevelingImage} // Use the imported image directly
        style={{ width: Dimensions.get('window').width * 10, height: Dimensions.get('window').width *10 * 0.5625 }} // Adjust width and height to scale the image
        resizeMode='contain' // Preserve aspect ratio
      />
      <Button
        disabled={isLoading}
        onPress={async () => {
          setIsLoading(true);
          await AsyncStorage.clear();
          setIsLoading(false);
        }}
        title='Clear Cache'
      />
    </ScrollView>
  );
}

export default More;
