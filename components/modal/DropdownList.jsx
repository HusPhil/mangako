import {
    StyleSheet,
    Text,
    TouchableWithoutFeedback,
    TouchableOpacity,
    View,
    UIManager,
    Platform,
    LayoutAnimation,
  } from 'react-native';
  import React, { useState } from 'react';
  import { AntDesign } from '@expo/vector-icons';
  
  const DropDownList = ({ title, listItems, selectedIndex, otherContainerStyles, onValueChange}) => {
    const [opened, setOpened] = useState(false);
    const [selectedItemIndex, setSelectedItemIndex] = useState(0)
  
    if (
      Platform.OS === 'android' &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  
    const toggleDropDownList = () => {
      LayoutAnimation.configureNext({
        duration: 300,
        create: { type: 'easeIn', property: 'opacity' },
        update: { type: 'linear', springDamping: 0.3, duration: 250 },
      });
      setOpened(!opened);
    };
  
    return (
      <View>

      <View className={`${otherContainerStyles} flex-row justify-between`}>
        <Text className="font-pregular text-white flex-[50%]">{title}</Text>
        <View className="flex-[50%]">
        <TouchableWithoutFeedback on onPress={toggleDropDownList} className="relative ">
          <View className="w-full flex-row justify-end">
           <Text numberOfLines={1} className="text-white font-pregular mr-4">{selectedIndex ? listItems[selectedIndex].label : listItems[selectedItemIndex].label}</Text>
            <AntDesign color={"#fff"} name={opened ? 'caretup' : 'caretdown'} size={16}/>
          </View>
        </TouchableWithoutFeedback>
  
        {opened && (
          <View className="absolute top-5 w-full">
            {listItems.map((item,index) => {
              if(index != selectedIndex) {
                return (
                <TouchableOpacity key={index} className="w-full bg-white p-1 z-50 border"
                    onPress={() => {
                        setSelectedItemIndex(index)
                        setOpened(!opened)
                        onValueChange(item)
                    }}
                >
                    <Text numberOfLines={1} className="z-50 font-pregular">{item.label}</Text>
                </TouchableOpacity>
                )
              }
            })}
        
          </View>
        )} 
        </View>
      </View>
      
      {listItems[selectedIndex].desc && (
        <View>
          <Text className="text-white font-pregular text-xs mx-4 text-start">{"• " + listItems[selectedIndex].desc}</Text>
        </View>
      )}

      </View>
    );
  };
  
  const styles = StyleSheet.create({
    details: {
      opacity: 0.65,
    },
    title: {
      textTransform: 'capitalize',
    },
    content: {
      marginTop: 8,
      position: "absolute"
    },
    container: {
      margin: 10,
      padding: 15,
      backgroundColor: 'white',
      borderRadius: 6,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
  });
  
  export default DropDownList;
  