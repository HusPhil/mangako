import { View, Text } from 'react-native';
import React, { forwardRef, useImperativeHandle } from 'react';
import { ProgressBar, Colors } from 'react-native-paper';
import colors from '../../constants/colors';

// Using forwardRef to forward the ref to the inner component
const DownloadListItem = forwardRef(({ chapterTitle, isDeterminate }, ref) => {
    useImperativeHandle(ref, () => ({
        getChapterTitle: () => chapterTitle,
        
    }));

    return (
        <View ref={ref} className="py-2 px-3 bg-secondary rounded-md my-2 mx-3">
            <Text className="text-white font-pregular" numberOfLines={1}>
                {chapterTitle}
            </Text>
            <ProgressBar 
                progress={0.9}indeterminate={isDeterminate} 
                className="my-1 rounded-md" 
                fillStyle={{backgroundColor: `${colors.accent.DEFAULT}`}}
            />
        </View>
    );
});

export default DownloadListItem;