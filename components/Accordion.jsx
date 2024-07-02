import {
    StyleSheet,
    Text,
    TouchableWithoutFeedback,
    View,
    UIManager,
    Platform,
    LayoutAnimation,
  } from 'react-native';
  import React, { useState } from 'react';
  import { AntDesign } from '@expo/vector-icons';
  
  const Accordion = ({ title, details, children }) => {
    const [opened, setOpened] = useState(false);
    const otherContainerStyles = !opened ? "" : "" 
    const otherTitleStyles = opened ? "" : "" 
  
    if (
      Platform.OS === 'android' &&
      UIManager.setLayoutAnimationEnabledExperimental
    ) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  
    const toggleAccordion = () => {
      LayoutAnimation.configureNext({
        duration: 300,
        create: { type: 'easeIn', property: 'opacity' },
        update: { type: 'linear', springDamping: 0.3, duration: 250 },
      });
      setOpened(!opened);
    };
  
    return (
      <View className={`${otherContainerStyles} p-3 rounded-md my-2 mx-5`}>
        <TouchableWithoutFeedback onPress={toggleAccordion}>
          <View style={styles.header}>
           {children}
            <AntDesign color={"#fff"} name={opened ? 'caretup' : 'caretdown'} size={16} />
          </View>
        </TouchableWithoutFeedback>
  
        {opened && (
          <View style={[styles.content]}>
            <Text className={`${otherTitleStyles} text-white font-pregular text-xs`}>{details}</Text>
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
      // maxHeight: '30%',
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
  
  export default Accordion;