import { ScrollView } from 'react-native';
import React from 'react';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';

const VerticalReaderMode = ({ chapterUrls, renderItem }) => {
  return (
    <ScrollView>
      {/* <ReactNativeZoomableView
        maxZoom={10}
        minZoom={1}
        zoomStep={0.5}
        initialZoom={1}
        bindToBorders={true}
        onZoomAfter={() => {}}
        movementSensibility={0.5}
        disablePanOnInitialZoom
      > */}
        {chapterUrls.map(renderItem)}
      {/* </ReactNativeZoomableView> */}
    </ScrollView>
  );
};

export default VerticalReaderMode;