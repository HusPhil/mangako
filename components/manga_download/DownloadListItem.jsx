import { View, Text, TouchableOpacity } from 'react-native';
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { ProgressBar, Colors } from 'react-native-paper';
import colors from '../../constants/colors';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Using forwardRef to forward the ref to the inner component
const DownloadListItem = forwardRef(({ chapterTitle, isIndeterminate, isCompleted, onCancelPress }, ref) => {
    useImperativeHandle(ref, () => ({
        getChapterTitle: () => chapterTitle,
        updateDownloadedPages: (totalPagesExpectedToDownload) => {
            setDownloadedPages(prev => prev + 1);
            setTotalPagesExpectedToDownload(totalPagesExpectedToDownload);
            // console.log("Total pages expected to download: ", totalPagesExpectedToDownload)
            // console.log("Total pages downloaded: ", downloadedPages)
        }
    }));

    const [downloadProgress, setDownloadProgress] = useState(0.0)
    const [downloadedPages, setDownloadedPages] = useState(0)
    const [totalPagesExpectedToDownload, setTotalPagesExpectedToDownload] = useState(0)
    const [downloadIsIndeterminate, setDownloadIsIndeterminate] = useState(isIndeterminate)

    useEffect(() => {
        // console.log("UPDATING THE UI", downloadedPages, totalPagesExpectedToDownload)

        if (downloadedPages > 0 && totalPagesExpectedToDownload > 0) {
            setDownloadProgress(downloadedPages / totalPagesExpectedToDownload)
            setDownloadIsIndeterminate(false)
        }

        // return () => {
        //     setDownloadProgress(0.0)
        //     setDownloadedPages(0)
        //     setTotalPagesExpectedToDownload(0)
        // }
    }, [downloadedPages, totalPagesExpectedToDownload])

    const downloadTextInfo = () => {
        if (isCompleted) {
            return `Successfully downloaded`
        }

        if(downloadedPages === 0 || totalPagesExpectedToDownload === 0) {
            return `Loading..`
        }

        if (downloadedPages > totalPagesExpectedToDownload) {
            return `Putting it all together..`
        }  

        if (downloadedPages === totalPagesExpectedToDownload) {
            return `Completed • ${totalPagesExpectedToDownload}/${totalPagesExpectedToDownload}`
        }  

        return `Downloading • ${downloadedPages}/${totalPagesExpectedToDownload}`
    }


    return (
        <View ref={ref} className="py-2 px-3 bg-secondary rounded-md my-2 mx-3">
            <View className="flex-row justify-between items-center">
                <Text className="text-white font-pregular flex-1" numberOfLines={1}>
                    {chapterTitle}
                </Text>
                {!isCompleted && (
                    <TouchableOpacity onPress={onCancelPress} className="ml-2">
                        <MaterialIcons name="cancel" size={24} color={colors.accent.DEFAULT} />
                    </TouchableOpacity>
                )}
            </View>
            <ProgressBar 
                progress={isCompleted ? 1.0 : downloadProgress} indeterminate={downloadIsIndeterminate} 
                className="my-1 rounded-md" 
                fillStyle={{backgroundColor: `${colors.accent.DEFAULT}`}}
            />
            <Text className="text-white text-opacity-75 font-pregular text-xs" numberOfLines={1}>
                {downloadTextInfo()}   
            </Text>
        </View>
    );
});

export default DownloadListItem;