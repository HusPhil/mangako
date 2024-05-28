import React from "react"
import { View, FlatList } from "react-native"
import { FlashList } from "@shopify/flash-list";

import ContentLoader, { Rect, Circle, Path } from "react-content-loader/native"
const data = [
  { id: '1', title: 'Item 1', description: 'Description for item 1' },
  { id: '2', title: 'Item 2', description: 'Description for item 2' },
  { id: '3', title: 'Item 3', description: 'Description for item 3' },
  { id: '4', title: 'Item 4', description: 'Description for item 4' },
  { id: '5', title: 'Item 5', description: 'Description for item 5' },
  { id: '6', title: 'Item 6', description: 'Description for item 6' },
  { id: '7', title: 'Item 7', description: 'Description for item 7' },
  { id: '8', title: 'Item 8', description: 'Description for item 8' },
  { id: '9', title: 'Item 9', description: 'Description for item 9' },
]
const MyLoader = (props) => (
    


<View className="h-full w-full self-center">
    <FlatList
      data={data}
      renderItem={({ item }) => (
        <ContentLoader 
    speed={2}
    width={500}
    height={800}
    viewBox="0 0 500 800"
    backgroundColor="#979595"
    foregroundColor="#ecebeb"
    {...props}
  >
        <View className="w-full px-1">
          <Rect x="43" y="11" rx="0" ry="0" width="125" height="170" /> 
        </View>
        </ContentLoader>
      )}
      keyExtractor={(item) => item.id}
      numColumns={3}
    />
</View>
    
  
)

export default MyLoader