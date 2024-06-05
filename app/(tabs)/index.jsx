import { StatusBar } from 'expo-status-bar';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MangaGrid from '../../components/MangaGrid';
import {LinearGradient} from 'expo-linear-gradient';
// import colors from '../constants/colors';
import colors from '../../constants/colors'


export default function App() {
  return (
    <SafeAreaView className="bg-primary">
      <LinearGradient
                colors={[`${colors.primary.DEFAULT}`, `${colors.accent[100]}`]}
                start={{x:0, y:0}}
                end={{x:1, y:1}}
      >
    <ScrollView 
    className="h-full w-full"
    showsVerticalScrollIndicator={false}
    showsHorizontalScrollIndicator={false}
    >
      <MangaGrid
        order={{
          title:"asc",
          relevance: 'desc',
          followedCount: 'desc',
        }}
        limit={100}
        numColumns={3}
      />

      <StatusBar backgroundColor={colors.secondary.DEFAULT} style='light'/>
      </ScrollView>
      </LinearGradient>
      </SafeAreaView>
  );
}

