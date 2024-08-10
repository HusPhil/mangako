import React, {useEffect, useState} from 'react';
import { View, Text, ScrollView, ImageBackground, TouchableOpacity, FlatList } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { MangaCard } from '../../components/manga_menu';
import { useCallback } from 'react';
import ModalPopup from '../modal/ModalPopup';
import HorizontalRule from '../HorizontalRule';
import colors from '../../constants/colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { readSavedMangaList } from '../../services/Global';
import TabListItem from '../manga_home/TabListItem';


const MangaHeader = ({
    mangaCover, 
    mangaId, 
    mangaTitle,
    mangaUrl,
    isLoading,
    details
}) => {
  const [showModal, setShowModal] = useState(false)
  const [tabs, setTabs] = useState([])
  const [selectedTabs, setSelectedTabs] = useState([])

  useEffect(() => {

    const AsyncEffect = async () => {
      const savedMangaList = await readSavedMangaList();
      setTabs(savedMangaList)
    }
    AsyncEffect()

  }, [])

  const handleShowModal = useCallback(() => {
    setShowModal(prev => !prev)
  }, [])

  const handleAddToList = useCallback(async () => {
    for (const selectedTab of selectedTabs) {
      
      console.log("selectedTab:", selectedTab)
    }
  }, [selectedTabs])

  const handleSelectItem = useCallback(async (selectedItem) => {
    // console.log(selectedItem)
    if(!selectedTabs.includes(selectedItem)) {
      setSelectedTabs(prev => {
        const newSelectedTabs = [...prev]
        newSelectedTabs.push(selectedItem)
        return newSelectedTabs
      })
    }
    else {
      setSelectedTabs(prev => (
        prev.filter(item => item !== selectedItem)
      ))
    }
  }, [selectedTabs])

  const renderItem = ({item}) => {
    return (
      <TabListItem item={item} onSelectItem={handleSelectItem}
      iconComponent={<MaterialIcons name="check-circle-outline" size={15} color="white" />}/>
    );
  };

  const keyExtractor = useCallback((item, index) => {
    return `${item}-${index}`;
  }, [])

  return (
    <View>
      <ModalPopup visible={showModal} handleClose={handleShowModal} otherStyles={{backgroundColor: 'transparent', alignSelf: 'center',}}>
        <View className="h-full w-full justify-center items-center px-3 bg-transparent self-center">
          <View className="w-full bg-secondary rounded-md p-3 max-h-[420px]">
            <Text className="text-white font-pregular text-center pb-2">Select the Tabs you want to delete</Text>
            <HorizontalRule /> 
            <FlatList
              className="mt-3"
              data={tabs}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
            />
            <TouchableOpacity className="border-2 mt-3 border-white rounded-md py-1 px-3 self-center flex-row justify-between"
              onPress={handleAddToList}>
              <View>
                <MaterialIcons name="add-circle-outline" size={15} color="white" />
              </View> 
              <Text className=" text-center text-xs font-pregular text-white ml-1">Add to List</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ModalPopup>
      
        <ScrollView>
          <View>
          
          
            <ImageBackground
              source={{ uri: mangaCover }}
              className="h-[250px] w-full relative opacity-30"
              resizeMode="cover"
            />
            
            <View className="flex-row w-full px-2 absolute bottom-5 min-h-[180px] max-h-[185px]">
              <View className="max-h-[180px] max-w-[105px] ml-2">
                <MangaCard
                  mangaId={mangaId}
                  mangaTitle={mangaTitle}
                  mangaCover={mangaCover}
                  containerStyles="mb-2 w-[105px] flex-1 h-full"
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
                  <TouchableOpacity className="rounded-md p-1  border-white border flex-row justify-center items-center"
                      onPress={handleShowModal}>
                      <Text className="font-pregular text-white text-center mr-1" style={{fontSize: 11, textShadowColor: "#000", textShadowRadius: 10,}}>
                        Add to List
                      </Text>
                      <MaterialCommunityIcons name="heart-plus-outline" size={15} color="white" />
                  </TouchableOpacity>
                )}
              </View>
              <View className="ml-3 mt-1 w-[65%]">
                <Text className="text-white font-pmedium text-lg" numberOfLines={3}>{mangaTitle}</Text>
                <ScrollView className="rounded-md max-h-[60%]" showsVerticalScrollIndicator={false}>
                  <Text className="text-white pl-1 max-w-[95%] font-pregular text-xs text-justify">{details ? details.desc : "Loading"}</Text>
                </ScrollView>
                <Text numberOfLines={2} className="text-white pl-1 py-2 font-pregular text-xs text-justify">{details ? `By: ${details.author}` : ""}</Text>
              </View>
              
            </View>
          </View>
        </ScrollView>
        
      </View>
  )
}

export default MangaHeader