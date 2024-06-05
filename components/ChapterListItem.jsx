import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'

const ChapterListItem = ({id, chNum, publishedDate, handlePress}) => {
  return (
    <TouchableOpacity className="bg-secondary p-2 rounded-md my-1" onPress={handlePress}>
      <Text style={{ch: 5}} className="font-pregular text-white">{chNum ? (chNum.length > 37 ? `${chNum.substring(0, 37)}...` : chNum) : "Loading"} </Text>
      <Text className="font-pregular text-[10px] text-white opacity-50">{publishedDate}</Text>
    </TouchableOpacity>
  )
}

export default ChapterListItem