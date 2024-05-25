import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import MangaCard from '../../components/MangaCard';
import { getMangaByOrder, getMangaByTitle } from '../../utils/MangaDexClient';

const imageUrl = "https://uploads.mangadex.org/covers/8f3e1818-a015-491d-bd81-3addc4d7d56a/26dd2770-d383-42e9-a42b-32765a4d99c8.png.256.jpg";


export default function App() {

  // getMangaByOrder(
  //   {
  //     latestUploadedChapter: 'desc',
  //     relevance: 'desc'
  //   },
  //   10
  // )

  // getMangaByTitle("baboy");

  return (
    <SafeAreaView className="">
      <ScrollView className="h-full w-full border-2">
      <Text className="text-2xl text-blue-500 font-extrabold">Hello World!</Text>
      
      <MangaCard
        mangaId={"a1c7c817-4e59-43b7-9365-09675a149a6f"}
      />

      <MangaCard
        mangaId={"32d76d19-8a05-4db0-9fc2-e0b0648fe9d0"}
      />

      <MangaCard
        mangaId={"bc79d2eb-6347-4773-895a-8f61a51c7798"}
      />
      <MangaCard
        mangaId={"06eff9bc-02ae-4119-aa71-712ed5738ecf"}
      />

      <MangaCard
        mangaId={"c98a93a0-67fa-4319-acf3-d80a13b68285"}
      />
      <MangaCard
        mangaId={"2a62fa7f-ff92-4b2b-9073-049cdfff464c"}
      />
      <MangaCard
        mangaId={"e744e171-f061-47fa-8ebc-a872e4b3fb5d"}
      />

      </ScrollView>
    </SafeAreaView>
  );
}

