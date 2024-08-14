import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { View, Text,  Image, StatusBar, StyleSheet, TouchableOpacity, TextInput, Alert, ToastAndroid, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import DragList, {DragListRenderItemInfo} from 'react-native-draglist';

import { useFonts } from 'expo-font';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import ModalPopup from '../../components/modal/ModalPopup';
import colors from '../../constants/colors';
import { readMangaListItemConfig, readSavedMangaList, saveMangaList, saveMangaListItemConfig } from '../../services/Global';
import HorizontalRule from '../../components/HorizontalRule';
import TabListItem from '../../components/manga_home/TabListItem';
import TabsView from '../../components/manga_home/TabsView';
import { images } from '../../constants';

const MODAL_MODES = { 
  ADD_TAB: "ADD_TAB",
  DELETE_TAB: "DELETE_TAB",
  SORT_TABS: "SORT_TABS",
  HIDDEN: "HIDDEN"
}

const Index = () => {

  const [showModal, setShowModal] = useState(MODAL_MODES.HIDDEN);
  const [tabs, setTabs] = useState([]);
  const [tabTitleToAdd, setTabTitleToAdd] = useState('');
  const [tabsToDelete, setTabsToDelete] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSorting, setIsSorting] = useState(false)
  
  const [loaded] = useFonts({
    "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
  });

  if (!loaded) {
    return null;
  }
  const MangaListHeader = () => (
    <View className="flex-row justify-between items-center mx-4">
      <View className="flex-row justify-center items-center">
        <Image 
          source={images.ramenMiniIcon}
          style={{height: 'undefined', width: 35 , aspectRatio: 1, marginTop: 20, marginRight: 5 }}
        />
        <Text className="text-2xl mt-7 mb-2 text-white font-pregular ">Manga List</Text>
      </View>
      <View className="flex-row mt-4 justify-around w-[35%]">
          <TouchableOpacity className="p-2" onPress={handleShowAddTab}><MaterialIcons name="playlist-add" size={20} color="white" /></TouchableOpacity>
          <TouchableOpacity className="p-2" onPress={handleShowDeleteTab}><MaterialIcons name="playlist-remove" size={20} color="white" /></TouchableOpacity>
          <TouchableOpacity className="p-2" onPress={handleShowSortTab}><MaterialIcons name="filter-list" size={20} color="white" /></TouchableOpacity>
      </View>
    </View>
  )
  
  useFocusEffect(
    useCallback(() => {
      const AsyncEffect = async () => {
        
        StatusBar.setBackgroundColor(colors.secondary.DEFAULT)
        StatusBar.setBarStyle('light-content')

        const savedMangaList = await readSavedMangaList();
        console.log(savedMangaList.length)
        
        if(savedMangaList.length <= 0) {
          const mangaListToSave = [
            {
              title: "DEFAULT",
              data: []
            }
          ]
          await saveMangaList(mangaListToSave)
          setTabs(mangaListToSave)

        }
        else {
          setTabs(savedMangaList)
        }

        setIsLoading(false)
      }
      AsyncEffect()
  
    }, [])
  )

  const keyExtractor = (str) => {
     return str.title;
  }

  const handleShowAddTab = useCallback(() => {
    setShowModal(MODAL_MODES.ADD_TAB)
  }, [])

  const handleShowDeleteTab = useCallback(() => {
    setShowModal(MODAL_MODES.DELETE_TAB)
  }, [])

  const handleShowSortTab = useCallback(() => {
    setShowModal(MODAL_MODES.SORT_TABS)
  }, [])

  const handleAddTab = async () => {
    const validTabTitleToAdd = tabTitleToAdd.toUpperCase().trim() 

    const existingTabTiltes = new Set()
    tabs.forEach((tab) => {
      existingTabTiltes.add(tab.title)
    })
    

    console.log(existingTabTiltes)

    if(validTabTitleToAdd === '') {
      ToastAndroid.show(
        'Provide a Tab title',
        ToastAndroid.SHORT,
      )
      return
    }
    
    if(!existingTabTiltes.has(validTabTitleToAdd)) {
      const savedMangaList = await readSavedMangaList();
      
      const newTabObject = {
        title: validTabTitleToAdd,
        data: [],
      }

      const mangaListToSave = [...savedMangaList, newTabObject]
      console.log("mangaListToSave", mangaListToSave)      
      await saveMangaList(mangaListToSave)
      
      setTabs(mangaListToSave)
      setTabTitleToAdd('')
    }
    else {
      console.error("failed to add new tab")
      ToastAndroid.show(
        'Tab already exists',
        ToastAndroid.SHORT,
      )
    }
    setShowModal(MODAL_MODES.HIDDEN)
  }

  const deleteTabConfirmed = useCallback(async () => {
    const retrievedMangaList = await readSavedMangaList()

    const tabsToDeletedAsSet = new Set(tabsToDelete)
    const tabTitleToDataMap = new Map()

    retrievedMangaList.forEach((tab, index) => {
      if(tabsToDeletedAsSet.has(tab.title)) {
        tabTitleToDataMap.set(tab.title, tab.data)
      }
    })

    console.log(tabTitleToDataMap)

    const mangaListToSave = retrievedMangaList.filter (
      (tabListItem) => (!tabTitleToDataMap.has(tabListItem.title))
    );
    
    console.log("mangaListToSave", mangaListToSave)

    for (let tabIndex = 0; tabIndex < tabsToDelete.length; tabIndex++) {
      const tabTitle = tabsToDelete[tabIndex];
      const tabData = tabTitleToDataMap.get(tabTitle) // this is a list

      tabData.forEach(async (manga) => {
        const retrievedMangaListItemConfig = await readMangaListItemConfig(manga.link)
        console.log(`${tabTitle}-${manga.link}-${retrievedMangaListItemConfig}`)

        const mangaListItemConfigToSave = retrievedMangaListItemConfig.filter(
          (retrievedtabTitle) => (retrievedtabTitle !== tabTitle)
        )

        console.log("mangaListItemConfigToSave", mangaListItemConfigToSave)

        await saveMangaListItemConfig(manga.link, mangaListItemConfigToSave)

      })
      

    }

    await saveMangaList(mangaListToSave)
    

    setTabs(mangaListToSave)
    setShowModal(MODAL_MODES.HIDDEN)
    setTabsToDelete([])
  }, [tabsToDelete])

  const deleteTabCanceled = useCallback(() => {
    ToastAndroid.show(
      'Deleting tabs canceled', 
      ToastAndroid.SHORT
    )
    setShowModal(MODAL_MODES.HIDDEN) 
    setTabsToDelete([])
  }, [])

  const handleDeleteTab = useCallback(() => {
      Alert.alert(
        'Choose an Action',
        'Are you sure you want to delete these items?',
        [
          {
            text: 'Yes',
            onPress: deleteTabConfirmed,
            style: 'default'
          },
          {
            text: 'Cancel',
            onPress: deleteTabCanceled,
            style: 'cancel'
          }
        ],
        { cancelable: false }
      )
  }, [tabsToDelete])

  const handleReordered = async (fromIndex, toIndex) => {
    setIsSorting(true)
    const copy = [...tabs]; // Don't modify react data in-place
    const removed = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, removed[0]); // Now insert at the new pos
    await saveMangaList(copy)
    
    setTabs(copy);
    setIsSorting(false)
  }

  const handleSelectItem = (selectedItem) => {
    if(!tabsToDelete.includes(selectedItem.title)) {
      setTabsToDelete(prev => {
        const newTabsToDelete = [...prev]
        newTabsToDelete.push(selectedItem.title)
        return newTabsToDelete
      })
    }
    else {
      console.log("called")
      setTabsToDelete(prev => (
        prev.filter(item => item !== selectedItem.title)
      ))
    }
  }

  const draggableRenderItem = ({
    item,
    onDragStart,
    onDragEnd,
    isActive,
  }) => {
    return (
      <View>
        <TouchableOpacity
        key={item.title}
        onPressIn={() => {
          console.log(onDragStart)
          onDragStart()
        }}
        onPressOut={onDragEnd}
        className="p-1 "
      >
        <Text
          className="font-pregular text-white p-1 rounded-md text-xs capitalize"
          style={{ backgroundColor: isActive ? colors.accent[100] : "transparent" }}
        >
          {item.title}
        </Text>
      </TouchableOpacity>
      
      </View>

    );
  };

  const handleHideModal = useCallback(() => {
    setShowModal(MODAL_MODES.HIDDEN)
    setTabsToDelete([])
  }, [])

  const renderItem = ({item, index}) => {
    return (
      <TabListItem item={item} onSelectItem={handleSelectItem}
      iconComponent={<MaterialIcons name="delete-outline" size={18} color={colors.accent.DEFAULT} />}/>
    );
  };

  

  return (  
    <SafeAreaView className="flex-1 bg-primary">
      <MangaListHeader/>
      <ModalPopup visible={showModal !== MODAL_MODES.HIDDEN} handleClose={handleHideModal} otherStyles={{backgroundColor: 'transparent', alignSelf: 'center',}}>
        <View className="h-full w-full justify-center items-center px-3 bg-transparent self-center">
          
          {showModal === MODAL_MODES.SORT_TABS && (
            <View className="w-full bg-secondary rounded-md p-3 max-h-[420px]">
              <Text className="text-white font-pregular text-center pb-2">Sort the tabs however you like!</Text>
              <HorizontalRule />
              {tabs.length >= 2 ? (
                !isSorting ? (
                  <DragList
                  className="mt-3"
                  data={tabs}
                  keyExtractor={keyExtractor}
                  onReordered={handleReordered}
                  renderItem={draggableRenderItem}
                />
                ) : (
                  <View className="mt-2">
                    <ActivityIndicator size={25} color={colors.accent.DEFAULT}/>
                  </View>
                )
              ) : (
                <Text className="text-white font-pregular text-center text-xs mt-3">Please create 2 or more Tabs</Text>
              )}
            </View>
            
          )} 
          {showModal === MODAL_MODES.ADD_TAB && (
              <View className="w-full bg-secondary rounded-md p-3 max-h-[420px]">
                <Text className="text-white font-pregular text-center pb-2">Add a new Tab on the List!</Text>
                <HorizontalRule />
                <View className="flex-row px-4 pt-2 items-center mt-2">
                    <TextInput 
                      placeholder='ex: Favorites' 
                      placeholderTextColor={colors.secondary[100]} 
                      className="bg-white rounded-lg py-1 px-3 text-primary font-pregular text-sm w-full"  
                      autoFocus={true}
                      selectTextOnFocus
                      textAlignVertical='center'
                      onEndEditing={handleAddTab}
                      onChangeText={text => setTabTitleToAdd(text)}
                      selectionColor={colors.accent.DEFAULT}
                    />
                </View>
                <TouchableOpacity className="flex-row justify-between border-2 border-white py-1 px-2  rounded-md mt-3 self-center"
                  onPress={handleAddTab}>
                  <View>
                  <MaterialIcons name="add-circle-outline" size={15} color="white" />
                  </View>
                  <Text className=" text-center text-xs font-pregular text-white ml-1">Add Tab</Text>
                </TouchableOpacity>
              </View>
          )}

          {showModal === MODAL_MODES.DELETE_TAB && (
            <View className="w-full bg-secondary rounded-md p-3 max-h-[420px]">
              <Text className="text-white font-pregular text-center pb-2">Select the Tabs you want to delete</Text>
              <HorizontalRule />
              
              {true ? (
                <>
                <FlatList
                  className="mt-3"
                  data={tabs}
                  keyExtractor={(item, index) => (`${item.title}-${index}`)}
                  renderItem={renderItem}
                />
                <TouchableOpacity className="border-2 mt-3 border-accent rounded-md py-1 px-3 self-center flex-row justify-between"
                onPress={handleDeleteTab}>
                  <View>
                    <MaterialIcons name="delete-outline" size={15} color={colors.accent.DEFAULT} />
                  </View>
                  <Text className="text-accent text-xs text-center font-pregular ml-1">Delete</Text>
                </TouchableOpacity>
                </>
              ) : (
                <Text className="text-white font-pregular text-center text-xs mt-3">No tabs available</Text>
                
              )}
              
              
            </View>
          )}

        </View>
      </ModalPopup>
        <TabsView tabs={tabs} onAddTab={() => (setShowModal(MODAL_MODES.ADD_TAB))} isLoading={isLoading}/>
    </SafeAreaView>
  );
};

// Define styles for components


export default Index;
