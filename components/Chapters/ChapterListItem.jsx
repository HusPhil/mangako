import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'

const ChapterListItem = ({chTitle, publishedDate, finished, currentPage, handlePress}) => {
  return (
    <TouchableOpacity className={`bg-secondary p-2 rounded-md my-1 ${finished && "opacity-50"}`} onPress={handlePress}>
      <Text numberOfLines={1} style={{ch: 5}} className="font-pregular text-white">{chTitle ? chTitle : "Loading"} </Text>
      <Text className="font-pregular text-[10px] text-white opacity-50">{publishedDate}</Text>
      <Text className="font-pregular text-[10px] text-white opacity-50">{currentPage > 0 && currentPage + 1}</Text>
    </TouchableOpacity>
  )
}

export default ChapterListItem