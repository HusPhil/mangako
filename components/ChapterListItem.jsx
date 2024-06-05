import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'

const ChapterListItem = ({id, chTitle, publishedDate, handlePress}) => {
  return (
    <TouchableOpacity className="bg-secondary p-2 rounded-md my-1" onPress={handlePress}>
      <Text style={{ch: 5}} className="font-pregular text-white">{chTitle ? (chTitle.length > 37 ? `${chTitle.substring(0, 37)}...` : chTitle) : "Loading"} </Text>
      <Text className="font-pregular text-[10px] text-white opacity-50">{publishedDate}</Text>
    </TouchableOpacity>
  )
}

export default ChapterListItem