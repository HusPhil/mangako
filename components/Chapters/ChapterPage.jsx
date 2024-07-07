    import { View, Dimensions, ActivityIndicator, Text, Button } from 'react-native'
    import React, { forwardRef, useEffect, useImperativeHandle, useState  } from 'react'
    import { Image } from 'expo-image'
    import { fetchData, getImageDimensions } from './_chapters'

    const ChapterPage = forwardRef(({
        currentManga, imgSrc, 
        pageUrl, pageNum, 
        onPageLoad, onRetry,
        autoloadData
    }, ref) => {
        const { height: screenHeight, width: screenWidth } = Dimensions.get('screen')
        const [pageImgSrc, setPageImgSrc] = useState(null)

        useImperativeHandle(ref, () => ({
            getPageNum: () => pageNum,
        }));

        const AsyncEffect = async (signal) => {
            try {
                const fetchedImgSrc = await fetchData(currentManga.manga, currentManga.chapter, pageUrl, signal)
                if(fetchedImgSrc.error) throw fetchedImgSrc.error

                const imgSize = await getImageDimensions(fetchedImgSrc.data);
                console.log({imgUri: fetchedImgSrc.data, imgSize})
                setPageImgSrc({imgUri: fetchedImgSrc.data, imgSize})
                
            } catch (error) {
                setPageImgSrc(null)
                console.log(error)
            }
        } 
        
        useEffect(() => {
            const controller = new AbortController()
            const signal = controller.signal
            
            AsyncEffect(signal)
        }, [autoloadData])

        return (
            <View>
                {!autoloadData ? (
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
                                contentFit='scale'
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
                ) : (
                    pageImgSrc ? (
                        <View>
                            <Image
                                source={{uri: pageImgSrc.imgUri}}
                                style={{
                                    height: undefined, 
                                    width: screenWidth, 
                                    aspectRatio: pageImgSrc.imgSize.width/pageImgSrc.imgSize.height
                                }}
                                onLoad={(event) => {
                                    const { height: pageHeight } = event.source
                                    onPageLoad(pageNum, pageHeight);
                                }}
                                contentFit='scale'
                            />  
                        </View>
                    ) : (
                        <View 
                            className="justify-center items-center bg-primary"
                            style={{height: screenHeight, width: screenWidth}}
                        >
                            <ActivityIndicator color={'white'} size={30} />
                            <Text className="text-white font-pregular">I will autoload this: {imgSrc}</Text>
                        </View>
                    )
                )}
            </View>
        )
    })

    export default React.memo(ChapterPage)