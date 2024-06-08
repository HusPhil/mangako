import { View, Text, Button, StatusBar } from 'react-native'
import React, {useState} from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import colors from '../../constants/colors'

const more = () => {
  const [isLoading, setisLoading] = useState(false)

  return (
    <View className="justify-center items-center h-full">
      <StatusBar backgroundColor={colors.secondary.DEFAULT} style='light'/>
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