import { View, Text } from 'react-native'
import React from 'react'
import HorizontalRule from '../../components/HorizontalRule'
import DropDownList from '../../components/modal/DropdownList'

const manga_reader_test = () => {
  return (
    <View className="mx-4">
                    <View className="justify-start w-full">
                    <Text numberOfLines={1} className="text-white font-pregular text-base text-center p-2 py-3">MangaTitle</Text>
                    </View>
                    <HorizontalRule />
                    <View className="w-full">
                    {/* <DropDownList
                        title={"Reading mode:"}
                        otherContainerStyles={'rounded-md p-2 px-4  z-50 '}
                        listItems={[]}
                        onValueChange={(data) => {
                        }}
                        selectedIndex={0}
                    /> */}
                    </View>
                </View>
  )
}

export default manga_reader_test