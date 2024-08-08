import { View, Text, ScrollView, ImageBackground, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { MangaCard } from '../../components/manga_menu';

const MangaHeader = ({
    mangaCover, 
    mangaId, 
    mangaTitle,
    isLoading,
    details
}) => {
  return (
    <View className="">
        <ScrollView>
          <View>
          
          
            <ImageBackground
              source={{ uri: mangaCover }}
              className="h-[250px] w-full relative opacity-30"
              resizeMode="cover"
            />
            
            <View className="flex-row w-full px-2 absolute bottom-3 min-h-[170px] max-h-[185px]">
              <View className="max-h-[172px] max-w-[100px]">
                <MangaCard
                  mangaId={mangaId}
                  mangaTitle={mangaTitle}
                  mangaCover={mangaCover}
                  containerStyles="my-2 w-[100px] flex-1 h-full"
                  coverStyles="w-[100%] h-full"
                  disabled
                >
                {details && details.status !== "" && (
                  <View>
                    <Text className="text-white text-xs text-center font-pregular bg-secondary-100 py-1">
                      {!isLoading ? details.status.toUpperCase() : "Loading"}
                    </Text>
                  </View>
                )}
                </MangaCard>
                {!isLoading && (
                  <TouchableOpacity className="rounded-md p-1  border-white border flex-row justify-around items-center"
                      onPress={()=>{console.log("HELLO WORLD")}}>
                      <Text className="font-pregular text-white text-xs"
                        style={{textShadowColor: "#000", textShadowRadius: 10,}}
                      >Add to Fav</Text>
                      <MaterialCommunityIcons name="heart-plus-outline" size={16} color="white" />
                  </TouchableOpacity>
                )}
              </View>
              <View className="ml-3 mt-1 w-[65%]">
                <Text className="text-white font-pmedium text-lg" numberOfLines={3}>{mangaTitle}</Text>
                <ScrollView className="rounded-md max-w-[98%] max-h-[60%]" showsVerticalScrollIndicator={false}>
                  <Text className="text-white p-2 font-pregular text-xs text-justify">{details ? details.desc : "Loading"}</Text>
                </ScrollView>
                <Text numberOfLines={2} className="text-white p-2 font-pregular text-xs text-justify">{details ? `By: ${details.author}` : ""}</Text>
              </View>
              
            </View>
          </View>
        </ScrollView>
        
      </View>
  )
}

export default MangaHeader