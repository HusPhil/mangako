import { View, Dimensions, ActivityIndicator, Text, Button } from 'react-native'
import React, { forwardRef, useImperativeHandle,  } from 'react'
import { Image } from 'expo-image'

const ChapterPage = forwardRef(({currentManga, imgSrc, pageUrl, pageNum, onPageLoad, onRetry}, ref) => {
    const { height: screenHeight, width: screenWidth } = Dimensions.get('screen')

    useImperativeHandle(ref, () => ({
        getPageNum: () => pageNum,
    }));

    return (
        <View className="mt-[-1px]">
        {imgSrc ?  (
            !imgSrc.error ? (
                <Image
                    source={{uri: imgSrc.imgUri}}
                    style={{
                        height: undefined, 
                        width: screenWidth, 
                        aspectRatio: imgSrc.imgSize.width/imgSrc.imgSize.height
                    }}
                    onLoad={(event) => {
                        const { height: pageHeight } = event.source
                        onPageLoad(pageNum, pageHeight);
                    }}
                />  
            ) : (
                <View 
                    className="justify-center items-center bg-primary"
                    style={{height: screenHeight/2, width: screenWidth}}
                >
                    <Text className="font-pregular text-white">An error occured</Text>
                    <Button title="retry" onPress={() => {
                        onRetry(pageNum)
                    }} />
                </View>
            )
        ) : (
            
            <View 
                className="justify-center items-center bg-primary"
                style={{height: screenHeight/2, width: screenWidth}}
            >
                <ActivityIndicator color={'white'} size={30} />
            </View>
        )}
        </View>
    )
})

export default ChapterPage