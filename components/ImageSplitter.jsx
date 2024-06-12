import { Image, View, Text } from 'react-native';
import Canvas, { Image as CanvasImage } from 'react-native-canvas';
import axios from 'axios';
import React, { useRef, useEffect, useState } from 'react';
import { Buffer } from 'buffer';


const getBase64Image = async (imageUrl) => {
  try {
    const response = await axios({
      method: 'get',
      url: imageUrl,
      responseType: 'arraybuffer',
    });
    if (response.status === 200) {
      return Buffer.from(response.data).toString('base64');
    } else {
      console.error(`Failed to retrieve the image. Status code: ${response.status}`);
      return null;
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    throw error;
  }
};

const splitImage = async (imageUrl, maxHeight) => {
  const base64Image = await getBase64Image(imageUrl);
  if (!base64Image) return;

  return new Promise((resolve, reject) => {
    const slices = [];
    const img = new Image();
    img.src = `data:image/jpeg;base64,${base64Image}`;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const { width, height } = img;

      let startY = 0;
      while (startY < height) {
        const sliceHeight = Math.min(maxHeight, height - startY);
        canvas.width = width;
        canvas.height = sliceHeight;
        ctx.drawImage(img, 0, -startY, width, height);
        slices.push(canvas.toDataURL());
        startY += maxHeight;
      }
      resolve(slices);
    };
    img.onerror = (error) => {
      reject(error);
    };
  });
};

const ImageSplitter = ({ imageUrl, maxHeight }) => {
  const canvasRef = useRef(null);
  const [slices, setSlices] = useState([]);

  useEffect(() => {
    (async () => {
      const slices = await splitImage(imageUrl, maxHeight);
      setSlices(slices);
    })();
  }, [imageUrl, maxHeight]);

  return (
    <View>
      {slices.length > 0 ? (
        slices.map((slice, index) => (
          <Image key={index} source={{ uri: slice }} style={{ width: '100%', height: maxHeight }} />
        ))
      ) : (
        <Text>Loading...</Text>
      )}
    </View>
  );
};

export default ImageSplitter;
