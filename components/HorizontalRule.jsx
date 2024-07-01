import { View, Text } from 'react-native'
import React from 'react'

const HorizontalRule = ({displayText, otherStyles}) => {
  return (
    <View className={`flex-row items-center ${otherStyles}`}>
        <View className="flex-1 h-[1px] bg-white" />
        {displayText && (
            <>
            <View>
                <Text className="text-center font-pregular text-base text-white p-2" >{displayText}</Text>
            </View>
            <View className="flex-1 h-[1px] bg-white" />
            </>
        )}
    </View>
  )
}

export default HorizontalRule