import { View, Text, Button } from 'react-native'
import React, {useState} from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const more = () => {
  const [isLoading, setisLoading] = useState(false)

  return (
    <View className="justify-center items-center h-full">
      <Button disabled={isLoading} onPress={ async () => {
        setisLoading(true) 
        await AsyncStorage.clear()
        setisLoading(false) 
        }
        } title='Clear Cache' />
    </View>
  )
}

export default more