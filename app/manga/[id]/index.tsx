import HorizontalRule from "@/components/HorizontalRule";
import { colors } from "@/constants";
import { useGetMangaInfo } from "@/services/useGetMangaInfo";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ChapterList from "./components/ChapterList";
import MangaDetailsContent from "./components/MangaDetailsContent";
import MangaHeader from "./components/MangaHeader";

type MangaDetails = {
  tags: string[];
  alternativeNames: string[];
  author: string;
  status: string;
  description: string;
};

type LocalSearchParams = {
  id?: string;
  mangaCover?: string;
  mangaTitle?: string;
  mangaUrl?: string;
};

const MangaInfoScreen = () => {
  const router = useRouter();
  const { id: mangaId, mangaCover, mangaTitle, mangaUrl } = useLocalSearchParams<LocalSearchParams>();
  const testParams = useLocalSearchParams<LocalSearchParams>();


  // const [isLoading, setIsLoading] = useState<boolean>(!false);
  const [tabsListed, setTabsListed] = useState<string[]>(["Chapters", "Details"]);
  const [activeTab, setActiveTab] = useState<"Details" | "Chapters">("Details");
  // const [errorData, setErrorData] = useState<null | string>(Error);
  const [numberOfReadChapters, setNumberOfReadChapters] = useState<number>(1);


  const { data: mangaInfo, isLoading: isMangaInfoLoading, error: errorData } = useGetMangaInfo('mangakakalot', mangaUrl!);

  const handleRefresh = async () => {
    // setTimeout(() => setIsLoading(false), 1000); // Simulated loading
  };

  const handleSetLastReadChapterIndex = (index: number) => {
    console.log("Chapter read status changed:", index);
  };

  const handleReadingResume = () => {
    console.log("Resume reading...");
  };

  const handleClearMangaCache = () => {
    Alert.alert(
      "Clearing manga data",
      "All the saved data on this manga will be deleted, do you still wish to proceed?",
      [
        {
          text: "Yes",
          onPress: async () => {
            console.log("Cache cleared");
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: false }
    );
  };

  const handleChapterPress = (chapterId: string, chapterUrl: string) => {
    console.log("Chapter pressed:", chapterId);
    console.log("Manga ID:", mangaId);
    const query = new URLSearchParams({
        chapterUrl: chapterUrl ?? "",
      }).toString();

    if (!mangaId) return;
    router.push(`/manga/${mangaId}/${chapterId}?${query}`);
  };
  

  return (
    <SafeAreaView className="h-full w-full bg-primary">
      <StatusBar backgroundColor={"transparent"} barStyle={"light-content"} />
      <View className="h-full w-full">
        {renderHeader(mangaTitle || "")}
        {/* {!isMangaDetailsLoading && (
          // <Text>{mangaDetails?.mangaDescription}</Text>
        )} */}

      <MangaHeader
        isError={errorData !== null}
        mangaCover={mangaCover}
        mangaId={mangaId || "loading"}
        mangaTitle={mangaTitle}
        mangaUrl={mangaUrl}
        isLoading={isMangaInfoLoading}
        details={{
          author: mangaInfo?.mangaDetails.mangaAuthor,
          status: mangaInfo?.mangaDetails.mangaStatus,
        }}
        numberOfReadChapters={numberOfReadChapters}
        onReadingResume={handleReadingResume}
        chapterCount={mangaInfo?.mangaChapters.length || 0}
      />

      {isMangaInfoLoading ? (
        <>
        <HorizontalRule displayText="Loading..." otherStyles={'mt-2 mx-4'} />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.accent.DEFAULT} />
        </View>
        </>
      ) : errorData ? (
        // You can customize this fallback if you want to show an error message
        <View className="h-full justify-center items-center">
          <Text className="text-red-500">Failed to load manga data.</Text>
        </View>
      ) : (
        <View className="flex-1">
          <TabsNavigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            chapterCount={mangaInfo?.mangaChapters.length || 0}
          />

          {activeTab === "Details" ? (
            <ScrollView
              className="flex-1 bg-primary"
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
            >
              <MangaDetailsContent
                mangaAlternativeNames={mangaInfo?.mangaDetails.mangaAlternativeNames || []}
                mangaAuthor={mangaInfo?.mangaDetails.mangaAuthor || ""}
                mangaStatus={mangaInfo?.mangaDetails.mangaStatus || ""}
                mangaTags={mangaInfo?.mangaDetails.mangaTags || []}
                mangaDescription={mangaInfo?.mangaDetails.mangaDescription || ""}
                totalChapters={mangaInfo?.mangaChapters.length || 0}
                numberOfReadChapters={numberOfReadChapters}
                handleReadingResume={handleReadingResume}
                handleClearMangaCache={handleClearMangaCache}
              />
            </ScrollView>
          ) : (
            <View className="flex-1">
              <ChapterList
                mangaUrl={mangaUrl || ""}
                chaptersData={mangaInfo?.mangaChapters || []}
                listStyles={{ flex: 1 }}
                onRefresh={handleRefresh}
                onChapterReadStatusChange={handleSetLastReadChapterIndex}
                onChapterPress={handleChapterPress}
                isListed={tabsListed.length > 0}
                numberOfReadChapters={numberOfReadChapters}
              />
            </View>
          )}
        </View>
      )}


        
      </View>
    </SafeAreaView>
  );
};

export default MangaInfoScreen;

const renderHeader = (mangaTitle: string) => {
  const handleBackPress = () => {
    router.back();
  };

  return (
    <View className="bg-primary">
      <View className="flex-row justify-between items-center pt-3 mb-5 border-b border-gray-300 mx-4 rounded-lg">
        <TouchableOpacity
          onPress={handleBackPress}
          className="p-3 pr-5"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={26} color="white" />
        </TouchableOpacity>

        <View className="flex-1" >
          <Text className="text-white text-lg font-semibold line-clamp-1">{mangaTitle}</Text>
        </View>

        <View className="flex-row items-center">
          <Pressable className="p-3 mr-2">
            <Ionicons name="heart-outline" size={24} color="white" />
          </Pressable>
          <Pressable className="p-3">
            <Ionicons name="ellipsis-vertical" size={24} color="white" />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

type TabsNavigationProps = {
  activeTab: "Details" | "Chapters";
  setActiveTab: React.Dispatch<React.SetStateAction<"Details" | "Chapters">>;
  chapterCount: number;
};

const TabsNavigation = ({ activeTab, setActiveTab, chapterCount }: TabsNavigationProps) => {
  return (
    <View className="px-4 mb-4">
      <View className="flex-row justify-between bg-transparent rounded-lg overflow-hidden">
        <Pressable
          className={`py-2.5 px-5 flex-1 flex-row justify-center items-center border-b border-white ${
            activeTab === "Details" ? "opacity-100" : "opacity-50"
          }`}
          onPress={() => setActiveTab("Details")}
        >
          <Ionicons name="information-circle" size={16} color="white" style={{ marginRight: 6 }} />
          <Text className={`text-sm ${activeTab === "Details" ? "text-white" : "text-gray-300"}`}>
            Details
          </Text>
        </Pressable>

        <Pressable
          className={`py-2.5 px-5 flex-1 flex-row justify-center items-center border-b border-white ${
            activeTab === "Chapters" ? "opacity-100" : "opacity-50"
          }`}
          onPress={() => setActiveTab("Chapters")}
        >
          <Ionicons name="list" size={16} color="white" style={{ marginRight: 6 }} />
          <Text className={`text-sm ${activeTab === "Chapters" ? "text-white" : "text-gray-300"}`}>
            Chapters
          </Text>
        </Pressable>
      </View>
    </View>
  );
};
