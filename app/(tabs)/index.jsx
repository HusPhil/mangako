import React, { useEffect, useCallback, useState } from 'react';
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
  const [data, setData] = useState([])
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

  useEffect(() => {
    const AsyncEffect = async () => {
      const savedMangaList = await readSavedMangaList();
      setData(savedMangaList)
    }
    AsyncEffect()
  }, [])

  const keyExtractor = (str) => {
    return str;
  }

  const handleAddTab = async () => {
    const validTabTitleToAdd = tabTitleToAdd.toUpperCase().trim() 
    
    if(validTabTitleToAdd === '') {
      ToastAndroid.show(
        'Provide a Tab title',
        ToastAndroid.SHORT,
      )
      return
    }
    
    if(!data.includes(validTabTitleToAdd)) {
      const savedMangaList = await readSavedMangaList();
      const mangaListToSave = [...savedMangaList, validTabTitleToAdd]
      await saveMangaList(mangaListToSave)
      setData(mangaListToSave)
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
    await saveMangaList([{
      tabTitle: "DEFAULT",
    }])
    // const retrievedMangaList = await readSavedMangaList()
    // console.log("tabsToDelete", tabsToDelete)

    // const mangaListToSave = retrievedMangaList.filter(
    //   (tabListItem) => !tabsToDelete.includes(tabListItem)
    // );
    
    // console.log("mangaListToSave", mangaListToSave)

    // await saveMangaList(mangaListToSave)
    // setData(mangaListToSave)
    // setShowModal(MODAL_MODES.HIDDEN)
    // setTabsToDelete([])
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
    const copy = [...data]; // Don't modify react data in-place
    const removed = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, removed[0]); // Now insert at the new pos
    setData(copy);
  }

  const handleSelectItem = (selectedItem) => {
    if(!tabsToDelete.includes(selectedItem)) {
      setTabsToDelete(prev => {
        const newTabsToDelete = [...prev]
        newTabsToDelete.push(selectedItem)
        return newTabsToDelete
      })
    }
    else {
      setTabsToDelete(prev => (
        prev.filter(item => item !== selectedItem)
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
        key={item}
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
          {item}
        </Text>
      </TouchableOpacity>
      
      </View>

    );
  };

  const renderItem = ({item}) => {
    return (
      <TabListItem item={item} onSelectItem={handleSelectItem}
      iconComponent={<MaterialIcons name="delete-outline" size={18} color={colors.accent.DEFAULT} />}/>
    );
  };

  return (  
    <SafeAreaView style={styles.container}>
      <MangaListHeader/>
      <ModalPopup visible={showModal !== MODAL_MODES.HIDDEN} handleClose={() => {setShowModal(MODAL_MODES.HIDDEN)}} otherStyles={{backgroundColor: 'transparent', alignSelf: 'center',}}>
        <View className="h-full w-full justify-center items-center px-3 bg-transparent self-center">
          
          {showModal === MODAL_MODES.SORT_TABS && (
            <View className="w-full bg-secondary rounded-md">
                <DragList
                  data={data}
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
                data={data}
                keyExtractor={keyExtractor}
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
      {data.length > 0 && (
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
          {data.map((tabTitle, index) => (
            <Tab.Screen
              key={index}
              name={tabTitle}
              options={{ title: tabTitle }}
            >
              {() => <HomeScreen title={tabTitle} />}
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
