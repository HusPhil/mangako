import { View, Text, Image, ActivityIndicator, Alert, ScrollView, 
  Dimensions, Button, TouchableWithoutFeedback, StatusBar,
  PixelRatio
 } from 'react-native';
import { WebView } from 'react-native-webview';
import React, { useEffect, useState, useRef } from 'react';
import { useLocalSearchParams } from 'expo-router';
import shorthash from 'shorthash';
import * as FileSystem from 'expo-file-system';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getChapterImage, getChapterImageUrls, splitLongImage } from '../../utils/MangakakalotClient';
import HorizontalRule from '../../components/HorizontalRule';
import ModalPopup from '../../components/ModalPopup';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import { ImageZoom } from '@likashefqet/react-native-image-zoom';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ImageSplitter from '../../components/ImageSplitter';
import images from '../../constants/images';
import ImageWebView from "../../components/ImageWebView"

const MangaReaderScreen = () => {
  const params = useLocalSearchParams();
  const { chapterUrl, chData } = params;
  const chapterData = JSON.parse(chData).map(chapter => chapter.chapterUrl);
  const screenWidth = Dimensions.get('window').width;

  const [chapterImages, setChapterImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [cachedImageUris, setCachedImageUris] = useState([]);
  const [currentChapterUrl, setCurrentChapterUrl] = useState(chapterUrl);
  const [imgSlice, setImgSlice] = useState([])

  const isMounted = useRef(true);

  

  const fetchData = async (url) => {

    // const fetchedSlices = await getChapterImage("https://v7.mkklcdnv6tempv3.com/img/tab_27/02/91/17/dr980474/chapter_200/2-o.jpg")
    // setImgSlice(fetchedSlices)
    // let imageFileData = await FileSystem.readAsStringAsync('file:///data/user/0/host.exp.exponent/cache/tGfuh', { encoding: 'base64' })
    // imgFiles.push(imageFileData)
    // imageFileData = await FileSystem.readAsStringAsync('file:///data/user/0/host.exp.exponent/cache/Z1rcLSD', { encoding: 'base64' })
    // imgFiles.push(imageFileData)
    // imageFileData = await FileSystem.readAsStringAsync('file:///data/user/0/host.exp.exponent/cache/QemJ7', { encoding: 'base64' })
    // imgFiles.push(imageFileData)
    // let asyncImage =  await getChapterImage('https://mn2.mkklcdnv6temp.com/img/tab_34/03/24/69/gr983826/chapter_557/8-1717828378-n.webp')
    // imgFiles.push(asyncImage)
    // asyncImage =  await getChapterImage('https://mn2.mkklcdnv6temp.com/img/tab_34/03/24/69/gr983826/chapter_557/3-1717828364-o.jpg')
    // imgFiles.push(asyncImage)

    // setImgSlice(prevImages => [...prevImages, ...imgFiles])


    const getImageSize = (imageUri) => {
      return new Promise(
        (resolve, reject) => {
          Image.getSize(
            imageUri,
            (width, height) => {
              resolve({width, height})
            },
            (error) => {
              reject(error)
            }
          )
        }
      )
    }

    try {

    //check cache - checking the cache for chapterPagesUrl
    const cacheKey = shorthash.unique(url)
    const cachedChapterPageUris = `${FileSystem.cacheDirectory}${cacheKey}`
    let pageUrls = []
    
    const fileInfo = await FileSystem.getInfoAsync(cachedChapterPageUris)

    //if cache exist get that data if not request the data then cache the req data
    if(fileInfo.exists) {
      const cachedPageData = await FileSystem.readAsStringAsync(cachedChapterPageUris)
      pageUrls = JSON.parse(cachedPageData)
      }
      else {
      const requestedPageData = await getChapterImageUrls(url)
      pageUrls = requestedPageData
      await FileSystem.writeAsStringAsync(cachedChapterPageUris, JSON.stringify(pageUrls))
    }
    
    //check cache - checking the cache for chapterPagesUrl
    const imgFiles = []
    const pageUris = []
    for(const pageUrl of pageUrls) {
      const pageCacheKey = shorthash.unique(pageUrl)
      const pageUri = `${FileSystem.cacheDirectory}${pageCacheKey}`
      let pageInfo;
      let imageUri;
      let imageFileData;
      if(pageUri) {
        pageInfo = await FileSystem.getInfoAsync(pageUri)
        }
      if(pageInfo.exists) {
        imageUri = pageUri
        imageFileData = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' })
        
        } else {
          const pageImageData = await getChapterImage(pageUrl)
          await FileSystem.writeAsStringAsync(pageUri, pageImageData, {encoding: FileSystem.EncodingType.Base64})
          imageFileData = await getChapterImage(pageUrl)

          imageUri = pageUri
        }

        pageUris.push(imageUri)
        imgFiles.push(imageFileData)
          
      try {
        const pageSize = await getImageSize(imageUri)
        const myWidth = 100 
        // const calculatedHeight = pageSize.height
        const calculatedHeight = screenWidth / (pageSize.width/pageSize.height)

        // console.log(imageUri+"\n"+pageUrl)

        setChapterImages(prevImages => [...prevImages, {url:pageUrl, uri: imageUri, width: pageSize.width, height: calculatedHeight}])
        setImgSlice(prevImages => [...prevImages, imageFileData])
      } catch (error) {
        console.error(error)
      }
    }
      
    } catch (error) {
      alert(error.message)
    } finally {
      setIsLoading(false)
    }

  };

  useEffect(() => {
    isMounted.current = true;
    setIsLoading(true);
    setChapterImages([]);
    setCachedImageUris([]);
    fetchData(currentChapterUrl);

    return () => {
      isMounted.current = false;
    };
  }, [currentChapterUrl]);

  const clearCache = async () => {
    try {
      const cacheKey = shorthash.unique(currentChapterUrl);
      const cachedImageUrlsFileUri = `${FileSystem.cacheDirectory}${cacheKey}`;
      const fileInfo = await FileSystem.getInfoAsync(cachedImageUrlsFileUri);

      if (fileInfo.exists) {
        await FileSystem.deleteAsync(cachedImageUrlsFileUri);
      }

      for (const uri of cachedImageUris) {
        const fileInfo = await FileSystem.getInfoAsync(uri);

        if (fileInfo.exists) {
          await FileSystem.deleteAsync(uri);
        }
      }

      setChapterImages([]);
      setCachedImageUris([]);
      Alert.alert('Success', 'Cache cleared successfully');
    } catch (error) {
      Alert.alert('Failed to delete', "Cache already cleared");
      console.log(error);
    }
  };

  const handleShowModal = () => {
    setShowModal(!showModal);
  };

  const handlePrevChap = () => {
    const currentChapterIndex = chapterData.indexOf(currentChapterUrl);
    if (currentChapterIndex < chapterData.length - 1) {
      const prevChapterUrl = chapterData[currentChapterIndex + 1];
      setCurrentChapterUrl(prevChapterUrl);
    }
  };

  const handleNextChap = () => {
    const currentChapterIndex = chapterData.indexOf(currentChapterUrl);
    if (currentChapterIndex > 0) {
      const nextChapterUrl = chapterData[currentChapterIndex - 1];
      setCurrentChapterUrl(nextChapterUrl);
    }
  };

  return (
    <View className="flex-1 bg-primary">
      <StatusBar translucent />
      <ImageWebView imgSlice={imgSlice} />
      {/* <WebView  source={{uri: `data:image/jpeg;base64,${imgSlice[1]}`}} /> */}
      {/* <ImageSplitter
              imageUrl={"https://v7.mkklcdnv6tempv3.com/img/tab_27/02/91/17/dr980474/chapter_199/2-o.jpg"}
              maxHeight={1000}
            /> */}
      <ModalPopup
        visible={showModal}
        onClose={handleShowModal}
      >
        <Text>Hello world</Text>
        <Button title='Clear cache' onPress={clearCache} />
        <Button title='Close' onPress={handleShowModal} />
      </ModalPopup>
      <View className="flex-1">
        {isLoading && chapterImages.length === 0 ? (
          <ActivityIndicator />
        ) : (
          <ScrollView>
            {/* <ReactNativeZoomableView
              maxZoom={10}
              minZoom={1}
              zoomStep={0.5}
              initialZoom={1}
              bindToBorders={true}
              onZoomAfter={this.logOutZoomState}
              movementSensibility={0.5}
              disablePanOnInitialZoom
            > */}

            
              {/* <Image
              style={{ width: screenWidth, height: undefined, aspectRatio: 1}}
              source={images.pageTest3 }              
              />
              <Image
              style={{ width: screenWidth, height: undefined, aspectRatio: 1}}
              source={images.pageTest4 }              
              />
               */}
              {chapterImages.map((imgData, index) => (
                <View key={index} className="w-full self-center">
                  <TouchableWithoutFeedback onLongPress={handleShowModal}>
                    <Image
                      style={{ width: screenWidth, height:imgData.height}}
                      source={{ uri: imgData.uri }}
                      // resizeMode='contain'
                      
                      />
                      
                      {/* <WebView className="h-[50%]" source={{ html: `<img src=${imgData.url} style="width: 100%;" />` }} /> */}

                      {/* <GestureHandlerRootView>

                      <ImageZoom
                        uri={imgData.uri}
                        minScale={20}
                        maxScale={20}
                        doubleTapScale={20}
                        minPanPointers={1}
                        isSingleTapEnabled
                        isDoubleTapEnabled
                        style={{ width: screenWidth, height:'auto', aspectRatio: 1}}
                      />
                      </GestureHandlerRootView> */}
                  </TouchableWithoutFeedback>
                  <HorizontalRule displayText={`Page end ${imgData.width} x ${imgData.height}`} otherStyles={"mx-1"} />
                </View>
              ))}
            
            {/* </ReactNativeZoomableView> */}
            {isLoading && (
              <View className="flex-1 justify-center items-center">
                <Text className="text-white"><ActivityIndicator/> Loading images</Text>
              </View>
            )}
            <View className="flex-row justify-around">
              <Button title='Prev' onPress={handlePrevChap} />
              <Button title='Next' onPress={handleNextChap} />
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
};

export default MangaReaderScreen;