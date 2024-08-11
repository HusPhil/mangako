import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { View, Text, StatusBar, StyleSheet, TouchableOpacity, TextInput, Alert, ToastAndroid, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import DragList, {DragListRenderItemInfo} from 'react-native-draglist';

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useFonts } from 'expo-font';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import ModalPopup from '../../components/modal/ModalPopup';
import colors from '../../constants/colors';
import { readSavedMangaList, saveMangaList } from '../../services/Global';
import { FlashList } from '@shopify/flash-list';
import HorizontalRule from '../../components/HorizontalRule';
import TabListItem from '../../components/manga_home/TabListItem';
import { MangaGrid } from '../../components/manga_menu';



const Tab = createMaterialTopTabNavigator();

const MODAL_MODES = {
  ADD_TAB: "ADD_TAB",
  REMOVE_TAB: "REMOVE_TAB",
  SORT_TABS: "SORT_TABS",
  HIDDEN: "HIDDEN"
}

// Define Tab Screens
const HomeScreen = ({ title }) => (
  <View className="bg-primary h-full">
    <Text style={styles.screenText}>{title}</Text>
  </View>
);



const Index = () => {

  const [showModal, setShowModal] = useState(MODAL_MODES.HIDDEN)
  const [tabs, setTabs] = useState([])
  const [tabTitleToAdd, setTabTitleToAdd] = useState('')
  const [tabsToDelete, setTabsToDelete] = useState([])
  const faveData = ['Reading', 'Queue', 'Completed', 'Dropped', "KinemeMoNaMayMahabangPangalanTimesTwoKinemeMoNaMayMahabangPangalanTimesTwo"];

  const [loaded] = useFonts({
    "Poppins-Regular": require("../../assets/fonts/Poppins-Regular.ttf"),
  });

  if (!loaded) {
    return null;
  }
  const MangaListHeader = () => (
    <View className="flex-row justify-between items-center mx-4">
      <Text className="text-3xl mt-8 mb-2 text-white font-pregular ">Manga List</Text>
      <View className="flex-row mt-4 justify-around w-[35%]">
          <TouchableOpacity className="p-2" onPress={() => {setShowModal(MODAL_MODES.ADD_TAB)}}><MaterialIcons name="playlist-add" size={20} color="white" /></TouchableOpacity>
          <TouchableOpacity className="p-2" onPress={() => {setShowModal(MODAL_MODES.REMOVE_TAB)}}><MaterialIcons name="playlist-remove" size={20} color="white" /></TouchableOpacity>
          <TouchableOpacity className="p-2" onPress={() => {setShowModal(MODAL_MODES.SORT_TABS)}}><MaterialIcons name="filter-list" size={20} color="white" /></TouchableOpacity>
      </View>
    </View>
  )
  
  useEffect(() => {
    StatusBar.setBackgroundColor(colors.secondary.DEFAULT)
    StatusBar.setBarStyle('light-content')
  }, []);

  // useEffect(() => {
  //   const AsyncEffect = async () => {
  //     const savedMangaList = await readSavedMangaList();
  //     console.log(savedMangaList[0].title)
  //     setTabs(savedMangaList)
  //   } 
  //   AsyncEffect()
  // }, [])

  useFocusEffect(
    useCallback(() => {
      const AsyncEffect = async () => {
        const savedMangaList = await readSavedMangaList();
        setTabs(savedMangaList)
      }
      AsyncEffect()
  
    }, [])
  )

  const keyExtractor = (str) => {
     return str.title;
  }

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
    // await saveMangaList([{
    //   title: "DEFAULT",
    //   data: [
    //     {
    //       id: "78edf336-6318-45e5-ab19-dd3642e95810",
    //       link: "https://chapmanganato.to/manga-bt978676",
    //       cover: "https://avt.mkklcdnv6temp.com/13/f/16-1583493949.jpg",
    //       title: "Apotheosis"
    //     }
    //   ]
    // }])
    const retrievedMangaList = await readSavedMangaList()

    const mangaListToSave = retrievedMangaList.filter (
      (tabListItem) => (!tabsToDelete.includes(tabListItem.title))
    );
    
    console.log("mangaListToSave", mangaListToSave)
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
      console.log(tabsToDelete)
  }, [tabsToDelete])

  const handleReordered = async (fromIndex, toIndex) => {
    const copy = [...tabs]; // Don't modify react data in-place
    const removed = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, removed[0]); // Now insert at the new pos
    setTabs(copy);
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
        onLongPress={() => {
          console.log(onDragStart)
          onDragStart()
        }}
        onPressOut={onDragEnd}
        className="p-1"
      >
        <Text
          className="font-pregular text-white p-1"
          style={{ backgroundColor: isActive ? "red" : "transparent" }}
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

  const getTabScreenComponent = (tabItem) => {
    if(tabItem.data.length > 0) {
      return (
        <View className="flex-1 bg-primary">
          <MangaGrid 
            mangaData={tabItem.data}
            numColumns={3}
          />
        </View>
      )
    }
    return (
      <HomeScreen title={tabItem.title} />
    )
  }

  return (  
    <SafeAreaView style={styles.container}>
      <MangaListHeader/>
      <ModalPopup visible={showModal !== MODAL_MODES.HIDDEN} handleClose={handleHideModal} otherStyles={{backgroundColor: 'transparent', alignSelf: 'center',}}>
        <View className="h-full w-full justify-center items-center px-3 bg-transparent self-center">
          
          {showModal === MODAL_MODES.SORT_TABS && (
            <View className="w-full bg-secondary rounded-md">
                <DragList
                  data={tabs}
                  keyExtractor={keyExtractor}
                  onReordered={handleReordered}
                  renderItem={draggableRenderItem}
                />
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
                      autoFocus
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

          {showModal === MODAL_MODES.REMOVE_TAB && (
            <View className="w-full bg-secondary rounded-md p-3 max-h-[420px]">
              <Text className="text-white font-pregular text-center pb-2">Select the Tabs you want to delete</Text>
              <HorizontalRule />
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
            </View>
          )}

        </View>
      </ModalPopup>
      {tabs.length > 0 && (
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: colors.accent[100],
            tabBarIndicatorStyle: { backgroundColor: colors.accent.DEFAULT},
            tabBarLabelStyle: styles.tabBarLabelStyle,
            tabBarItemStyle: {width: "auto"},
            tabBarStyle: { backgroundColor: 'transparent'},
            tabBarAllowFontScaling: true,
            tabBarScrollEnabled: true,
            tabBarPressColor: colors.accent[100],
            tabBarBounces: false,
          }}
        >
          {tabs.map((tabItem, index) => (
            <Tab.Screen
              key={index}
              name={tabItem.title}
              options={{ title: tabItem.title }}
            >
              {() => (getTabScreenComponent(tabItem))}
            </Tab.Screen>
          ))}
        </Tab.Navigator>
      )}
      
    </SafeAreaView>
  );
};

// Define styles for components
const styles = StyleSheet.create({
  tabBarLabelStyle: {
    color: 'white', 
    fontFamily: "Poppins-Regular",
    fontSize: 12,
  },
  container: {
    flex: 1,
    backgroundColor: colors.primary.DEFAULT,
  },
  screenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenText: {
    fontSize: 18,
    // fontFamily: ["Poppins-Regular", "sans-serif"],
    color: '#000', // Change this to colors.secondary.DEFAULT if you have a specific color
  },
});

export default Index;
