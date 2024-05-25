import { StatusBar } from 'expo-status-bar';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MangaGrid from '../../components/MangaGrid';
import colors from '../../constants/colors'


const imageUrl = "https://uploads.mangadex.org/covers/8f3e1818-a015-491d-bd81-3addc4d7d56a/26dd2770-d383-42e9-a42b-32765a4d99c8.png.256.jpg";


export default function App() {
  return (
    <SafeAreaView className="bg-primary">
      <ScrollView 
        className="h-full w-full"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
      <MangaGrid
        order={{
          title: 'desc',
          followedCount: 'desc'
        }}
        limit={3*30}
        numColumns={3}
      />

      </ScrollView>
      <StatusBar backgroundColor={colors.secondary} style='light' translucent={true}/>
    </SafeAreaView>
  );
}

