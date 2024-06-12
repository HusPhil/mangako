import React, {useState, useEffect} from 'react';
import { View, Button, Platform, StyleSheet, Image, Alert  } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { shareAsync } from 'expo-sharing';
import { StatusBar } from 'expo-status-bar';
import { tryScrape } from '../../utils/MangaDexClient';

const Browse = () => {
  const [image, setImage] = useState(null);
  const [downloadPath, setdownloadPath] = useState('MangaDls')

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const imageData = await tryScrape();
        if (imageData) {
          setImage(imageData);
        } else {
          throw new Error('Failed to fetch image data');
        }
      } catch (error) {
        console.error('Error fetching or saving image:', error);
        Alert.alert('Error', 'Failed to fetch or save image.');
      }
    };

    fetchImage();
  }, []);

  const downloadFromUrl = async () => {
    const filename = "image.jpg";
    const result = await FileSystem.downloadAsync(
      'https://i.ytimg.com/vi/QNV2DmBxChQ/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLAxg01KoD6ZIemjZTn6p3loK98e0g',
      FileSystem.documentDirectory + filename
    );
    const fileUri = `${FileSystem.documentDirectory}/${filename}`;
    console.log(fileUri);

    const mimeType = result.headers["Content-Type"] || 'application/octet-stream';
    save(result.uri, filename, mimeType);
  };

  const save = async (uri, filename, mimeType) => {
    if (Platform.OS === "android") {
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (permissions.granted) {
        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        await FileSystem.StorageAccessFramework.createFileAsync(permissions.directoryUri, filename, mimeType)
          .then(async (uri) => {
            await FileSystem.writeAsStringAsync(uri, image, { encoding: FileSystem.EncodingType.Base64 });
          })
          .catch(e => console.log(e));
      } else {
        shareAsync(uri);
      }
    } else {
      shareAsync(uri);
    }
  };

  const testDL = async () => {
    // const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    const tryPerm = FileSystem.StorageAccessFramework.getUriForDirectoryInRoot('MangaKo')
    console.log(tryPerm)
    const filename = "testImage.jpg";

    const fileUri = `${FileSystem.documentDirectory}/${filename}`;
    await FileSystem.StorageAccessFramework.createFileAsync(tryPerm, filename, 'application/octet-stream')
          .then(async (uri) => {
            await FileSystem.writeAsStringAsync(uri, image, { encoding: FileSystem.EncodingType.Base64 });
          })
          .catch(
             (e) => {
              if(e.message.includes("isn't writable")) {
                Alert.alert(
                  'Permission Required',
                  'We need access to MangaDownloads to proceed.',
                  [
                    {
                      text: 'Cancel',
                      onPress: () => console.log(e),
                      style: 'cancel',
                    },
                    {
                      text: 'OK',
                      onPress: async () =>{
                        const permittedPath = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync()
                        setdownloadPath(permittedPath)
                      },
                    },
                  ],
                  { cancelable: false }
                );
              }
            }
          );
  }

  return (
    <View style={styles.container}>
       <Image source={{ uri: `data:image/jpeg;base64,${image}` }} style={{ height: 300, width: 200 }} />
      <Button title="Download From URL" onPress={testDL} />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Browse;