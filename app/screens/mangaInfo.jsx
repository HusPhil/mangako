import { View, Text, ScrollView, ImageBackground } from 'react-native'
import React from 'react'
import { StatusBar } from 'expo-status-bar';

import { LinearGradient } from 'expo-linear-gradient';
import colors from '../../constants/colors';
import MangaCard from '../../components/MangaCard';
import Accordion from '../../components/Collapsible';

import { router, useLocalSearchParams, useRouter } from 'expo-router'
import HorizontalRule from '../../components/HorizontalRule';

const MangaInfoScreen = () => {
  const params = useLocalSearchParams()
  const { mangaId, status, desc, altTitles, tags, contentRating, mangaCover, mangaTitle } = params

  const altTitlesString = JSON.parse(altTitles).map((title) => {
    const key = Object.keys(title)[0];
    return `${key}: ${title[key]}`;
  }).join('\n');

  const scrollHeight = desc === "no description available" ? "max-h-[30px]" : "max-h-[60%]"

  return (
    <View className={`h-full w-full bg-primary`}>
        <LinearGradient
            colors={[`#fff`, `${colors.primary.DEFAULT}`, `${colors.primary.DEFAULT}`]}
            start={{x:0, y:0}}
            end={{x:0, y:1}}
          >    
    <ScrollView>
      <StatusBar translucent/>
      <View>

        <ImageBackground
          source={{ uri: mangaCover }}   
          className={`h-[250px] w-full relative`}
          style={{opacity: 0.3, backgroundColor: `${colors.primary.DEFAULT}`}}
          resizeMode='cover'
          >
        </ImageBackground>
        <View className="flex-row w-full px-2 absolute bottom-3 max-h-[185px]">
          <MangaCard 
            mangaId={mangaId}
            mangaTitle={mangaTitle}
            mangaCover={mangaCover}
            containerStyles={"my-1 w-[100px]"}
            coverStyles={"w-[100%] h-[150px]"}
            disabled

          >
            <Text className="text-white text-xs text-center font-pregular mt-1">{status.toUpperCase()}</Text>
          </MangaCard>
          <View className="ml-3 mt-1 w-[65%]">
            <Text className=" text-white font-pmedium text-lg">{mangaTitle}</Text>
            <ScrollView className={ `${scrollHeight} rounded-md max-w-[98%]`} showsVerticalScrollIndicator={false}>
              
              <Text className="text-white  p-2 font-pregular text-xs text-justify">{desc}</Text>
            </ScrollView>
              <Text className="text-white p-2 font-pregular text-xs text-justify">Content rating: {contentRating}</Text>
          </View>

        </View>
      </View>
        
      </ScrollView>
    </LinearGradient>
    <ScrollView>
    <View className="flex-row flex-wrap mt-5 mx-4">
    {JSON.parse(tags).map((g, index) => (
          <Text key={g.id} className="p-2 m-1 rounded-md text-white bg-accent-100">{Object.values(g.attributes.name)[0]}</Text>
        ))}
    </View>

    
    
    {JSON.parse(altTitles).length > 0  && (
      <>
          <Accordion
            title={"Alternative titles: "}
            details={altTitlesString}
          />
          <HorizontalRule displayText={"Chapter list"}/>
      </>
    )}
    </ScrollView>

    </View>

    
      // <View>
        // <Text>Alt Titles: {mangaId}</Text>
        // {JSON.parse(altTitles).map((title, index) => (
        //   <Text key={index}>{Object.keys(title)[0]}: {Object.values(title)[0]}</Text>
        // ))}
      //   <Text>{'\n'}Description: {desc}</Text> 

        // <Text>{'\n'}Tags:</Text>
        // {JSON.parse(tags).map((g, index) => (
        //   <Text key={g.id}>{Object.values(g.attributes.name)[0]}</Text>
        // ))}
      //   <Text>{'\n'}Status: {status}</Text>
      //   <Text>{'\n'}Content rating: {contentRating}</Text>
      // </View>


    // <SafeAreaView>
    //   <ScrollView>
    // </ScrollView>
    // </SafeAreaView>
  )
}

export default MangaInfoScreen