import { View, Text, TouchableOpacity } from 'react-native'
import React, { useEffect, useRef } from 'react'

const ChapterListItem = ({id, currentManga, chTitle, publishedDate, handlePress}) => {
  return (
    <TouchableOpacity className="bg-secondary p-2 rounded-md my-1" onPress={handlePress}>
      <Text numberOfLines={1} style={{ch: 5}} className="font-pregular text-white">{chTitle ? chTitle : "Loading"} </Text>
      <Text className="font-pregular text-[10px] text-white opacity-50">{publishedDate}</Text>
    </TouchableOpacity>
  )
}

export default ChapterListItem