import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { router, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Pressable,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Get screen dimensions for responsive sizing
const { width } = Dimensions.get("window");
const scrollY = new Animated.Value(0);
const headerHeight = 200; // Adjust this based on your header height
const titleOpacity = scrollY.interpolate({
  inputRange: [headerHeight - 100, headerHeight - 60],
  outputRange: [0, 1],
  extrapolate: "clamp",
});

// Enhanced MangaHeader Component

const MangaInfoScreen = () => {
  const router = useRouter();
  const { mangaId, mangaCover, mangaTitle, mangaUrl } = useLocalSearchParams();

  // State for manga info and UI
  const [isLoading, setIsLoading] = useState(false);
  const [tabsListed, setTabsListed] = useState(["Chapters", "Details"]);
  const [mangaInfo, setMangaInfo] = useState({
    mangaDetails: {
      tags: ["Action", "Adventure", "Fantasy", "Magic"],
      alternativeNames: ["Alt Title 1", "Alt Title 2"],
      author: "Unknown Author",
      status: "Ongoing",
      description:
        "Set in a fantasy world where magic and adventure abound, this manga follows the journey of a young protagonist discovering their powers while navigating through dangerous quests and powerful enemies.",
    },
    chapterList: Array.from({ length: 1000 }, (_, i) => i + 1),
  });
  const [errorData, setErrorData] = useState(null);
  const [numberOfReadChapters, setNumberOfReadChapters] = useState(200);

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate loading
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleSetLastReadChapterIndex = (index) => {
    console.log("Chapter read status changed:", index);
    // This would normally update your reading progress
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

  const [activeTab, setActiveTab] = useState("Details"); // Add state for active tab

  return (
    <SafeAreaView className="h-full w-full bg-primary">
      <StatusBar backgroundColor={"transparent"} barStyle={"dark-content"} />
      <View className="h-full w-full">
        {/* Header with back button and search */}
        {renderHeader(mangaTitle)}

        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator color={"white"} size={"large"} />
            <Text className="font-pregular text-white text-md mt-3">
              Loading chapter list..
            </Text>
          </View>
        ) : !errorData ? (
          <>
            {/* Manga Information Section - Static */}
            <View>
              {/* Manga Cover and Title */}
              <MangaHeader
                key={tabsListed}
                mangaCover={mangaCover}
                mangaId={mangaId}
                mangaTitle={mangaTitle}
                mangaUrl={mangaUrl}
                details={mangaInfo ? mangaInfo.mangaDetails : null}
                isLoading={isLoading}
                tabsListed={tabsListed}
                numberOfReadChapters={numberOfReadChapters}
                onReadingResume={handleReadingResume}
                chapterCount={mangaInfo.chapterList.length}
              />
            </View>

            {/* Tabs navigation */}
            <View className="px-4 mb-4">
              <View className="flex-row justify-between bg-secondary rounded-lg overflow-hidden">
                {/* Details Tab */}
                <Pressable
                  className={`py-2.5 px-5 flex-1 flex-row justify-center items-center ${
                    activeTab === "Details" ? "bg-accent" : "bg-transparent"
                  }`}
                  onPress={() => setActiveTab("Details")}
                >
                  <Ionicons
                    name="information-circle"
                    size={16}
                    color="white"
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    className={`text-sm ${
                      activeTab === "Details"
                        ? "text-white font-pbold"
                        : "text-gray-300 font-pregular"
                    }`}
                  >
                    Details
                  </Text>
                </Pressable>

                {/* Chapters Tab */}
                <Pressable
                  className={`py-2.5 px-5 flex-1 flex-row justify-center items-center ${
                    activeTab === "Chapters" ? "bg-accent" : "bg-transparent"
                  }`}
                  onPress={() => setActiveTab("Chapters")}
                >
                  <Ionicons
                    name="list"
                    size={16}
                    color="white"
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    className={`text-sm ${
                      activeTab === "Chapters"
                        ? "text-white font-pbold"
                        : "text-gray-300 font-pregular"
                    }`}
                  >
                    Chapters ({mangaInfo.chapterList.length})
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Content based on active tab */}
            {activeTab === "Details" ? (
              <Animated.ScrollView
                className="flex-1 bg-primary"
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                  { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
              >
                {/* About This Manga - Redesigned */}
                <View className="mx-4 mt-2 mb-6">
                  <View className="bg-secondary rounded-xl p-5 shadow-sm">
                    <Text className="text-white font-pbold text-lg mb-3">
                      About
                    </Text>
                    <AboutManga details={mangaInfo.mangaDetails} />

                    {/* Author and status info cards */}
                    <View className="flex-row mt-4 space-x-3">
                      <View className="flex-1 bg-primary rounded-lg p-3">
                        <Text className="text-gray-300 text-xs mb-1">
                          Author
                        </Text>
                        <Text className="text-white font-pmedium">
                          {mangaInfo.mangaDetails?.author || "Unknown"}
                        </Text>
                      </View>
                      <View className="flex-1 bg-primary rounded-lg p-3">
                        <Text className="text-gray-300 text-xs mb-1">
                          Status
                        </Text>
                        <View className="flex-row items-center">
                          <View
                            className={`w-2 h-2 rounded-full mr-2 ${
                              mangaInfo.mangaDetails?.status === "Ongoing"
                                ? "bg-green-500"
                                : "bg-blue-500"
                            }`}
                          />
                          <Text className="text-white font-pmedium">
                            {mangaInfo.mangaDetails?.status || "Unknown"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Statistics Card */}
                <View className="mx-4 mb-6">
                  <View className="bg-secondary rounded-xl p-5">
                    <Text className="text-white font-pbold text-lg mb-3">
                      Statistics
                    </Text>
                    <View className="flex-row justify-between">
                      <View className="items-center">
                        <Text className="text-accent font-pbold text-xl">
                          {mangaInfo.chapterList.length}
                        </Text>
                        <Text className="text-gray-300 text-xs">Chapters</Text>
                      </View>
                      <View className="items-center">
                        <Text className="text-accent font-pbold text-xl">
                          {numberOfReadChapters}
                        </Text>
                        <Text className="text-gray-300 text-xs">Read</Text>
                      </View>
                      <View className="items-center">
                        <Text className="text-accent font-pbold text-xl">
                          {Math.round(
                            (numberOfReadChapters /
                              mangaInfo.chapterList.length) *
                              100
                          )}
                          %
                        </Text>
                        <Text className="text-gray-300 text-xs">Complete</Text>
                      </View>
                    </View>

                    {/* Reading progress bar */}
                    <View className="mt-4 mb-2">
                      <View className="h-2 w-full bg-primary rounded-full overflow-hidden">
                        <View
                          className="h-full bg-accent rounded-full"
                          style={{
                            width: `${
                              (numberOfReadChapters /
                                mangaInfo.chapterList.length) *
                              100
                            }%`,
                          }}
                        />
                      </View>
                    </View>
                  </View>
                </View>

                {/* Tags Section - Redesigned */}
                {mangaInfo.mangaDetails &&
                  mangaInfo.mangaDetails.tags.length > 0 &&
                  mangaInfo.mangaDetails.tags[0] !== "" && (
                    <View className="mx-4 mb-6">
                      <View className="bg-secondary rounded-xl p-5">
                        <Text className="text-white font-pbold text-lg mb-3">
                          Tags
                        </Text>
                        <View className="flex-row flex-wrap">
                          {mangaInfo.mangaDetails.tags.map((tag, i) => (
                            <View
                              key={i}
                              className="bg-primary rounded-lg py-2 px-3 m-1 flex-row items-center"
                            >
                              <Ionicons
                                name="pricetag"
                                size={12}
                                color="#9ca3af"
                                className="mr-1"
                              />
                              <Text className="text-white font-pregular text-xs">
                                {tag}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    </View>
                  )}

                {/* Alternative Titles - Redesigned */}
                {mangaInfo.mangaDetails &&
                  mangaInfo.mangaDetails.alternativeNames.length > 0 && (
                    <View className="mx-4 mb-6">
                      <View className="bg-secondary rounded-xl p-5">
                        <Text className="text-white font-pbold text-lg mb-3">
                          Alternative Titles
                        </Text>
                        {mangaInfo.mangaDetails.alternativeNames.map(
                          (title, index) => (
                            <Text
                              key={index}
                              className="text-gray-100 text-sm mb-2 py-2 px-3 bg-primary rounded-lg"
                            >
                              {title}
                            </Text>
                          )
                        )}
                      </View>
                    </View>
                  )}

                {/* Action Buttons - Redesigned */}
                <View className="mx-4 mb-8">
                  <View className="bg-secondary rounded-xl p-5">
                    <Text className="text-white font-pbold text-lg mb-3">
                      Actions
                    </Text>

                    {/* Fancy action buttons with better visual hierarchy */}
                    <View className="space-y-3">
                      {/* Main reading action */}
                      {numberOfReadChapters !==
                        mangaInfo.chapterList.length && (
                        <TouchableOpacity
                          onPress={handleReadingResume}
                          className="bg-accent rounded-lg py-3 flex-row items-center px-4 shadow-sm"
                        >
                          <View className="bg-white bg-opacity-20 p-2 rounded-md mr-3">
                            <MaterialIcons
                              name="play-arrow"
                              size={20}
                              color="white"
                            />
                          </View>
                          <View className="flex-1">
                            <Text className="text-white font-pbold text-sm">
                              {numberOfReadChapters > 0
                                ? `Continue Reading`
                                : "Start Reading"}
                            </Text>
                            {numberOfReadChapters > 0 && (
                              <Text className="text-white text-opacity-70 text-xs">
                                From Chapter {numberOfReadChapters + 1}
                              </Text>
                            )}
                          </View>
                          <MaterialIcons
                            name="chevron-right"
                            size={24}
                            color="white"
                          />
                        </TouchableOpacity>
                      )}

                      {/* Clear data button */}
                      <TouchableOpacity
                        onPress={handleClearMangaCache}
                        className="bg-primary rounded-lg py-3 flex-row items-center px-4"
                      >
                        <View className="bg-red-500 bg-opacity-20 p-2 rounded-md mr-3">
                          <MaterialIcons
                            name="delete-outline"
                            size={20}
                            color="#FC3B2C"
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="text-white font-pmedium text-sm">
                            Clear Data
                          </Text>
                          <Text className="text-white text-opacity-50 text-xs">
                            Remove downloaded chapters and reading progress
                          </Text>
                        </View>
                      </TouchableOpacity>

                      {/* Additional actions */}
                      <TouchableOpacity className="bg-primary rounded-lg py-3 flex-row items-center px-4">
                        <View className="bg-blue-500 bg-opacity-20 p-2 rounded-md mr-3">
                          <Ionicons
                            name="share-social-outline"
                            size={20}
                            color="#60a5fa"
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="text-white font-pmedium text-sm">
                            Share
                          </Text>
                          <Text className="text-white text-opacity-50 text-xs">
                            Share this manga with friends
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Bottom padding for scrolling comfort */}
                <View className="h-20" />
              </Animated.ScrollView>
            ) : (
              /* Chapter List Tab content - FlashList only */
              <View className="flex-1">
                <ChapterList
                  mangaUrl={mangaUrl}
                  chaptersData={mangaInfo.chapterList}
                  listStyles={{ flex: 1 }}
                  onRefresh={handleRefresh}
                  onChapterReadStatusChange={handleSetLastReadChapterIndex}
                  isListed={tabsListed?.length > 0}
                  numberOfReadChapters={numberOfReadChapters}
                />
              </View>
            )}
          </>
        ) : (
          <View className="h-full justify-center items-center">
            <Text className="font-pregular text-white text-base">
              Something went wrong
            </Text>
            <Text className="font-pregular text-white text-base">
              while loading the chapters
            </Text>
            <Text className="font-pregular text-white bg-accent rounded-md px-2 py-1 mt-5">
              Swipe down to retry
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const MangaHeader = ({
  mangaCover,
  mangaId,
  mangaTitle,
  mangaUrl,
  details,
  isLoading,
  tabsListed,
  numberOfReadChapters,
  onReadingResume,
  chapterCount,
}) => {
  const imageWidth = width * 0.3;
  const imageHeight = imageWidth * 1.5;
  const [isFavorite, setIsFavorite] = useState(false);

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // Here you would normally call a function to update favorites in storage
  };

  return (
    <View className="px-4 mb-4">
      <View className="flex-row">
        {/* Cover image */}
        {mangaCover ? (
          <Image
            source={{
              uri: mangaCover,
              headers: {
                Referer: "https://www.mangakakalot.gg/",
                "User-Agent": "Mozilla/5.0 (ExpoApp)",
              },
            }}
            style={{ width: imageWidth, height: imageHeight, borderRadius: 8 }}
            contentFit="cover"
            className="bg-secondary"
          />
        ) : (
          <View
            className="bg-secondary rounded-lg flex items-center justify-center"
            style={{ width: imageWidth, height: imageHeight }}
          >
            <Text className="text-white">No image</Text>
          </View>
        )}

        {/* Title and info */}
        <View className="ml-4 flex-1 justify-between">
          <View>
            <Text className="text-white font-psemibold text-lg">
              {mangaTitle || "No Title"}
            </Text>
            {details && details.author && (
              <Text className="text-gray-100 text-xs mt-1">
                Author: {details.author}
              </Text>
            )}
            <Text className="text-gray-100 text-xs mt-1">
              {details?.status || "Ongoing"}
            </Text>
          </View>
          <View className="mt-2">
            {/* Buttons in a horizontal row */}
            <View className="flex-row space-x-2">
              {/* Primary action - Continue/Start Reading Button - takes more space */}
              <TouchableOpacity
                onPress={onReadingResume}
                className="bg-secondary mr-3 rounded-lg py-2.5 flex-1 flex-row items-center justify-center shadow-sm"
              >
                <Ionicons name="play-circle" size={18} color="white" />
                <Text className="text-white font-psemibold text-sm ml-2">
                  {numberOfReadChapters > 0 ? "Continue" : "Start"}
                </Text>
              </TouchableOpacity>

              {/* Secondary action - Clear cache - smaller width */}
              <TouchableOpacity
                onPress={onReadingResume} // This should be handleClearCache
                className="bg-secondary rounded-lg py-2.5 px-3 flex-row items-center justify-center"
              >
                <Ionicons name="trash-outline" size={16} color="#f0f0f0" />
              </TouchableOpacity>
            </View>

            {/* Reading progress indicator */}
            <View className="mt-3 bg-secondary rounded-full h-1.5 w-full overflow-hidden">
              <View
                className="bg-accent h-full rounded-full"
                style={{
                  width: `${(numberOfReadChapters / chapterCount) * 100}%`,
                }}
              />
              <Text className="text-gray-300 text-xs mt-1 text-right">
                {numberOfReadChapters}/{chapterCount} chapters
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

// About Manga Component
const AboutManga = ({ details }) => {
  const [expanded, setExpanded] = useState(false);

  const description =
    details?.description ||
    "No description available for this manga. Check back later for updates.";

  const truncatedDescription =
    description.length > 150 && !expanded
      ? description.substring(0, 150) + "..."
      : description;

  return (
    <View className="mt-2 bg-secondary rounded-lg p-4 mx-4">
      <Text className="text-white font-psemibold mb-2">About this manga</Text>
      <Text className="text-gray-100 text-sm">{truncatedDescription}</Text>
      {description.length > 150 && (
        <Pressable className="mt-2" onPress={() => setExpanded(!expanded)}>
          <Text className="text-accent font-pmedium text-sm">
            {expanded ? "Less" : "More"}
          </Text>
        </Pressable>
      )}
    </View>
  );
};

// Enhanced Accordion Component

// Enhanced HorizontalRule Component
const HorizontalRule = ({ displayText, otherStyles }) => (
  <View className={`border-t border-secondary ${otherStyles || "mx-4 my-2"}`}>
    <Text className="text-white text-center bg-primary px-2 mt-[-10px] mx-auto">
      {displayText}
    </Text>
  </View>
);

// Enhanced ChapterItem Component
const ChapterItem = ({ chapter, index, onPress, isRead }) => (
  <TouchableOpacity
    onPress={() => onPress(index)}
    className="flex-row items-center justify-between py-3 mx-4 border-b border-secondary"
  >
    <View className="flex-1">
      <Text className="text-white text-sm">Vol 1 Ch. {chapter}</Text>
      <Text className="text-gray-100 text-xs">Chapter {chapter}</Text>
    </View>
    <View className="flex-row items-center">
      <Text className="text-gray-100 text-xs mr-3">May 15, 2023</Text>
      {isRead ? (
        <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
      ) : (
        <Ionicons name="download-outline" size={20} color="white" />
      )}
    </View>
  </TouchableOpacity>
);

// Enhanced ChapterList Component
const ChapterList = ({
  mangaUrl,
  chaptersData,
  listStyles,
  onRefresh,
  onChapterReadStatusChange,
  isListed,
  headerComponent,
  numberOfReadChapters,
}) => {
  const renderChapterItem = ({ item, index }) => (
    <ChapterItem
      chapter={item}
      index={index}
      onPress={onChapterReadStatusChange}
      isRead={index < numberOfReadChapters}
    />
  );
  const ListHeader = () => (
    <>
      {headerComponent}
      <View className="flex-row justify-between items-center mb-2 mx-4">
        <Text className="text-white font-psemibold">
          {chaptersData.length} chapters
        </Text>
        <Pressable>
          <Ionicons name="filter-outline" size={20} color="white" />
        </Pressable>
      </View>
    </>
  );
  return (
    <View className="flex-1" style={listStyles}>
      <FlashList
        data={chaptersData}
        renderItem={renderChapterItem}
        estimatedItemSize={70}
        ListHeaderComponent={ListHeader}
        showsVerticalScrollIndicator={false}
        refreshing={false}
        onRefresh={onRefresh}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  );
};

const handleBackPress = () => {
  router.back();
};

const renderHeader = (mangaTitle) => (
  <View className="bg-primary">
    <View className="flex-row justify-between items-center px-4 py-3">
      {/* Back Button */}
      <Pressable
        onPress={handleBackPress}
        className="p-3 -ml-2"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="arrow-back" size={26} color="white" />
      </Pressable>

      {/* Title Container */}
      <View className="flex-1 px-4">
        <Animated.Text
          style={{
            opacity: titleOpacity,
            color: "white",
            fontWeight: "600",
            textAlign: "center",
          }}
          numberOfLines={1}
        >
          {mangaTitle}
        </Animated.Text>
      </View>

      {/* Right Icons */}
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

export default MangaInfoScreen;
