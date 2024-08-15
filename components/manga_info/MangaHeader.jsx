import React, {useEffect, useState} from 'react';
import { View, Text, ScrollView, ImageBackground, TouchableOpacity, FlatList } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { MangaCard } from '../../components/manga_menu';
import { useCallback } from 'react';
import ModalPopup from '../modal/ModalPopup';
import HorizontalRule from '../HorizontalRule';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { readMangaListItemConfig, readSavedMangaList, saveMangaList, saveMangaListItemConfig } from '../../services/Global';
import TabListItem from '../manga_home/TabListItem';
import colors from '../../constants/colors';

const MangaHeader = ({
    mangaCover, 
    mangaId, 
    mangaTitle,
    mangaUrl,
    isLoading,
    tabsListed,
    details,
}) => {
  const [showModal, setShowModal] = useState(false)
  const [tabs, setTabs] = useState([])
  const [isListed, setIsListed] = useState(tabsListed?.length > 0)

  const [selectedTabs, setSelectedTabs] = useState([])

  useEffect(() => {
    const AsyncEffect = async () => {
      
      setSelectedTabs(tabsListed ?? [])

      if(tabsListed?.length > 0) {
        setIsListed(true)
      }
      else {
        setIsListed(false)
      }

      const savedMangaList = await readSavedMangaList();
      setTabs(savedMangaList)
    }
    AsyncEffect()

  }, [])

  const handleShowModal = useCallback(async () => {
    const listItemConfig = await readMangaListItemConfig(mangaUrl);
    setSelectedTabs(listItemConfig ?? [])
    console.log(listItemConfig)

    setShowModal(prev => !prev)
  }, [])

  const handleAddToList = useCallback(async () => {
    
    // retrieve the saved list
    const retrievedMangaList = await readSavedMangaList()
    const mangaListToSave = retrievedMangaList
    let listItemConfigToSave = new Set(selectedTabs)
    const mangaListItemToAdd = {
      'id': mangaId,
      'cover': mangaCover,
      'link': mangaUrl,
      'title': mangaTitle,
    }

    //iterate over all the savedMangaList
    for (let tabIndex = 0; tabIndex < retrievedMangaList.length; tabIndex++) {
      const tab = retrievedMangaList[tabIndex];
      const mangaAlreadyAdded = tab.data.some(manga => manga.link === mangaListItemToAdd.link)

      if(selectedTabs.includes(tab.title)) {
        //check if this manga is already there, if not add it
        if(!mangaAlreadyAdded) {
          mangaListToSave[tabIndex].data = [...tab.data, mangaListItemToAdd]
        }
        listItemConfigToSave.add(tab.title)
        continue
      }

      //this manga must be removed from all tabs which are not selected
      if(mangaAlreadyAdded) {
        mangaListToSave[tabIndex].data = tab.data.filter(manga => manga.link !== mangaListItemToAdd.link )
      }
      
    }

    //check if the tab title has been selected
    await saveMangaList(mangaListToSave)
    listItemConfigToSave = [...listItemConfigToSave]

    if(listItemConfigToSave.length > 0) {
      setIsListed(true)
    }
    else {
      setIsListed(false)
    }

    await saveMangaListItemConfig(mangaUrl, listItemConfigToSave)
    
    handleShowModal()
    
  }, [selectedTabs])

  const handleSelectItem = useCallback(async (selectedItem) => {
    // console.log(selectedItem)
    if(!selectedTabs.includes(selectedItem.title)) {
      setSelectedTabs(prev => {
        const newSelectedTabs = [...prev]
        newSelectedTabs.push(selectedItem.title)
        return newSelectedTabs
      })
    }
    else {
      setSelectedTabs(prev => (
        prev.filter(item => item !== selectedItem.title)
      ))
    }
  }, [selectedTabs])

  const renderItem = ({item, index}) => {
    return (
      <TabListItem item={item} onSelectItem={handleSelectItem}
      iconComponent={<MaterialIcons name="check-circle-outline" size={15} color="white" />}
      selected={selectedTabs.includes(item.title)}/>
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
            <Text className="text-white font-pregular text-center pb-2">Select where to add this manga</Text>
            <HorizontalRule /> 
            {tabs.length > 0 ? (
                <>
                <FlatList
                  className="mt-3"
                  data={tabs}
                  keyExtractor={keyExtractor}
                  renderItem={renderItem}
                />
                <TouchableOpacity className={`border-2 mt-3 border-white rounded-md py-1 px-3 self-center flex-row justify-between`}
                  onPress={handleAddToList}>
                  <View>
                    <MaterialIcons name="add-circle-outline" size={15} color="white" />
                  </View> 
                  <Text className=" text-center text-xs font-pregular text-white ml-1">Add to List</Text>
                </TouchableOpacity>
                </>
              ) : (
                <Text className="text-white font-pregular text-center text-xs mt-3">No tabs available</Text>
              )}
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
                  <TouchableOpacity className={`rounded-md p-1 border-white ${isListed && "bg-accent-100"} border flex-row justify-center items-center`}
                      onPress={handleShowModal}>
                      <Text className={`font-pregular text-white text-center mr-1`} style={{fontSize: 11, textShadowColor: "#000", textShadowRadius: 10,}}>
                        {!isListed ? "Add to List" : "Edit"}
                      </Text>
                      <MaterialCommunityIcons name="heart-plus-outline" size={15} color={"white"} />
                  </TouchableOpacity>
                )}
              </View>
              <View className="ml-3 mt-1 flex-1 ">
                <Text className="text-white font-pmedium text-lg" numberOfLines={3}>{mangaTitle}</Text>
                <ScrollView className="max-h-[60%]" showsVerticalScrollIndicator={false}>
                  <Text className="text-white pl-1 font-pregular text-xs pr-4 text-left">{details ? details.desc : "Loading"}</Text>
                </ScrollView>
                <Text numberOfLines={2} className="text-white pl-1 py-2 font-pregular text-xs">{details ? `By: ${details.author}` : ""}</Text>
              </View>
              
            </View>
          </View>
        </ScrollView>
        
      </View>
  )
}

export default MangaHeader