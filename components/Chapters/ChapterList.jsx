import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { FlashList } from "@shopify/flash-list";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  PermissionsAndroid,
  RefreshControl,
  Text,
  ToastAndroid,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";

import colors from "@/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import shorthash from "shorthash";
import {
  CHAPTER_LIST_MODE,
  READ_MARK_MODE,
} from "../../app/screens/_manga_info";
import { fetchData as fetchChapterPages } from "../../app/screens/_manga_reader";
import {
  CONFIG_READ_WRITE_MODE,
  DOWNLOAD_STATUS,
  downloadFolderNameInRoot,
  getMangaDownloadPermissionDir,
  readMangaConfigData,
  saveMangaConfigData,
} from "../../services/Global";
import HorizontalRule from "../HorizontalRule";
import ChapterListItem from "./ChapterListItem";

const ChapterList = ({
  mangaUrl,
  chaptersData,
  headerComponent,
  listStyles,
  onRefresh,
  isListed,
  onChapterReadStatusChange,
  onListModeChange,
  onChapterSelect,
}) => {
  const [showBtnToBottom, setShowBtnToBottom] = useState(false);
  const [showBtnToTop, setShowBtnToTop] = useState(false);
  const [chapterList, setChapterList] = useState(chaptersData);

  const flashListref = useRef(null);
  const previousScrollY = useRef(0);
  const listModeRef = useRef(CHAPTER_LIST_MODE.SELECT_MODE);
  const controllerRef = useRef(null);
  const [readMarkMode, setReadMarkMode] = useState(READ_MARK_MODE.MARK_AS_READ);
  const selectedChapters = useRef([]);

  const handleScrollToTop = () => {
    const flashList = flashListref.current;
    if (flashList) {
      flashList.scrollToOffset({ offset: 0, animated: true });
    }
  };

  const handleScrollToEnd = () => {
    const flashList = flashListref.current;
    if (flashList) {
      flashList.scrollToEnd({ animated: true });
    }
  };

  const handleChapterPress = useCallback((chapterData) => {
    if (listModeRef.current !== CHAPTER_LIST_MODE.MULTI_SELECT_MODE) {
      router.push({
        pathname: "screens/manga_reader",
        params: {
          currentChapterData: JSON.stringify(chapterData),
          currentChapterIndex: chapterData.index,
          isListedAsString: isListed,
          mangaUrl,
          isDownloadedAsString:
            chapterData?.isDownloaded?.downloadStatus ===
            DOWNLOAD_STATUS.DOWNLOADED,
        },
      });
      return;
    }

    //indicate that the item was selected or deselected
    setChapterList((prev) => {
      const newChapterList = [...prev];
      newChapterList[chapterData.index] = {
        ...newChapterList[chapterData.index],
        isSelected: newChapterList[chapterData.index].isSelected
          ? !newChapterList[chapterData.index].isSelected
          : true,
      };
      return newChapterList;
    });

    // add or remove (if already selected)
    const chapterUrlToDataMap = new Map();
    selectedChapters.current.forEach((item) => {
      chapterUrlToDataMap.set(item.chapterUrl, item);
    });

    if (chapterUrlToDataMap.has(chapterData.chapterUrl)) {
      console.log("meron na");
      selectedChapters.current = selectedChapters.current.filter(
        (item) => item.chapterUrl !== chapterData.chapterUrl
      );
    } else {
      selectedChapters.current.push(chapterData);
    }

    if (selectedChapters.current.length < 1) {
      listModeRef.current = CHAPTER_LIST_MODE.SELECT_MODE;
    }
  }, []);

  const handleLongPress = useCallback(
    (chapterData) => {
      setReadMarkMode(
        chapterList[chapterData.index]?.finished
          ? READ_MARK_MODE.MARK_AS_UNREAD
          : READ_MARK_MODE.MARK_AS_READ
      );

      listModeRef.current = CHAPTER_LIST_MODE.MULTI_SELECT_MODE;
      Vibration.vibrate(100);

      // add or remove (if already selected)
      const chapterUrlToDataMap = new Map();
      selectedChapters.current.forEach((item) => {
        chapterUrlToDataMap.set(item.chapterUrl, item);
      });

      if (chapterUrlToDataMap.has(chapterData.chapterUrl)) {
        selectedChapters.current = selectedChapters.current.filter(
          (item) => item.chapterUrl !== chapterData.chapterUrl
        );
      } else {
        selectedChapters.current.push(chapterData);
      }

      //indicate that the item was selected or deselected
      setChapterList((prev) => {
        const newChapterList = [...prev];

        if (selectedChapters.current.length > 1) {
          let rangeEnd = selectedChapters.current[0].index;
          let rangeStart =
            selectedChapters.current[selectedChapters.current.length - 1].index;

          if (
            selectedChapters.current[0].index >
            selectedChapters.current[selectedChapters.current.length - 1].index
          ) {
            rangeStart = selectedChapters.current[0].index;
            rangeEnd =
              selectedChapters.current[selectedChapters.current.length - 1]
                .index;
          }

          for (let index = rangeStart - 1; index >= rangeEnd + 1; index--) {
            newChapterList[index] = {
              ...newChapterList[index],
              isSelected: true,
            };
            if (
              !chapterUrlToDataMap.has(newChapterList[index].chapterUrl) &&
              index !== rangeStart &&
              index !== rangeEnd
            ) {
              selectedChapters.current.push({
                ...newChapterList[index],
                index,
              });
            }
          }
        }

        newChapterList[chapterData.index] = {
          ...newChapterList[chapterData.index],
          isSelected: newChapterList[chapterData.index].isSelected
            ? !newChapterList[chapterData.index].isSelected
            : true,
        };
        return newChapterList;
      });

      if (selectedChapters.current.length < 1) {
        listModeRef.current = CHAPTER_LIST_MODE.SELECT_MODE;
      }
    },
    [chaptersData, mangaUrl, chapterList]
  );

  const handleScroll = (event) => {
    const {
      nativeEvent: {
        contentOffset: { y },
        contentSize: { height: contentHeight },
        layoutMeasurement: { height: visibleHeight },
      },
    } = event;

    const isScrollingDown = previousScrollY.current < y;
    const isScrollingUp = previousScrollY.current > y;

    const upwardThreshold = contentHeight * 0.95;
    const downwardThreshold = contentHeight * 0.05;
    const midPoint = contentHeight * 0.5;

    if (y === 0) {
      setShowBtnToTop(false);
    } else if (y + visibleHeight >= contentHeight) {
      setShowBtnToBottom(false);
    } else if (isScrollingDown) {
      setShowBtnToTop(false);
      setShowBtnToBottom(y > downwardThreshold && y < midPoint);
    } else if (isScrollingUp) {
      setShowBtnToBottom(false);
      setShowBtnToTop(y < upwardThreshold && y > midPoint);
    }

    previousScrollY.current = y;
  };

  const getChapterCurrentPageList = useCallback(async () => {
    try {
      const savedMangaConfigData = await readMangaConfigData(
        mangaUrl,
        CONFIG_READ_WRITE_MODE.MANGA_ONLY,
        isListed
      );
      // console.log("savedMangaConfigData", savedMangaConfigData)

      let retrievedReadingStatusList = {};
      let retrievedLastPageReadList = {};
      let retrievedDownloadedChaptersList = {};

      if (savedMangaConfigData?.manga?.readingStats) {
        retrievedReadingStatusList = savedMangaConfigData.manga.readingStats;
      }

      if (savedMangaConfigData?.manga?.lastPageReadList) {
        retrievedLastPageReadList = savedMangaConfigData.manga.lastPageReadList;
      }

      if (savedMangaConfigData?.manga?.downloadedChapters) {
        retrievedDownloadedChaptersList =
          savedMangaConfigData.manga.downloadedChapters;
      }

      let lastReadChapterIndex = 0;
      let numberOfReadChapters = 0;

      setChapterList((prev) => {
        const newChapterList = prev.map((item, index) => {
          const newChapterInfo = { ...item };

          if (retrievedReadingStatusList) {
            if (retrievedReadingStatusList[item.chapterUrl]) {
              newChapterInfo["finished"] =
                retrievedReadingStatusList[item.chapterUrl].finished;
            }
          }

          if (retrievedDownloadedChaptersList) {
            if (retrievedDownloadedChaptersList[item.chapterUrl]) {
              newChapterInfo["isDownloaded"] =
                retrievedDownloadedChaptersList[item.chapterUrl];
            }
          }

          if (retrievedLastPageReadList) {
            if (retrievedLastPageReadList[item.chapterUrl]) {
              newChapterInfo["lastPageRead"] =
                retrievedLastPageReadList[item.chapterUrl];
            }
          }

          const currReadStatus = newChapterInfo.finished;
          if (!currReadStatus) {
            // ToastAndroid.show("Chapter not read yet: " + index, ToastAndroid.SHORT)
            lastReadChapterIndex = index;
            onChapterReadStatusChange(
              lastReadChapterIndex,
              numberOfReadChapters
            );
          } else {
            numberOfReadChapters += 1;
            onChapterReadStatusChange(
              lastReadChapterIndex,
              numberOfReadChapters
            );

            // ToastAndroid.show("Chapter read: " + index, ToastAndroid.SHORT)
          }

          return newChapterInfo;
        });
        return newChapterList;
      });
    } catch (error) {
      console.error("Error fetching chapter current page list:", error);
    }
  }, []);

  const handleFetchReadingStatus = useCallback((chapterUrl, readingStatus) => {
    setChapterList((prev) =>
      prev.map((item) => {
        if (item.chapterUrl === chapterUrl) {
          return {
            ...item,
            finished: readingStatus,
          };
        }
        return item;
      })
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      getChapterCurrentPageList();
    }, [])
  );

  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, []);

  const switchToSelectMode = useCallback(() => {
    listModeRef.current = CHAPTER_LIST_MODE.SELECT_MODE;
    setChapterList((prev) =>
      prev.map((item) => {
        if (item.isSelected) {
          return {
            ...item,
            isSelected: false,
          };
        }
        return item;
      })
    );
  }, []);

  const multiSelectModeClose = useCallback(() => {
    switchToSelectMode();
    selectedChapters.current = [];
  }, []);

  const handleMarkAsRead = useCallback(async () => {
    switchToSelectMode();

    if (selectedChapters.current.length < 1) return;

    const savedMangaConfigData = await readMangaConfigData(
      mangaUrl,
      CONFIG_READ_WRITE_MODE.MANGA_ONLY,
      isListed
    );

    let newReadingStats = {};

    if (savedMangaConfigData?.manga?.readingStats) {
      newReadingStats = savedMangaConfigData.manga.readingStats;
    }

    const chapterUrlToDataMap = new Map();

    selectedChapters.current.forEach((item) => {
      newReadingStats[item.chapterUrl] = {
        finished: readMarkMode === READ_MARK_MODE.MARK_AS_READ,
      };
      chapterUrlToDataMap.set(item.chapterUrl, item);
    });

    setChapterList((prev) =>
      prev.map((item) => {
        if (chapterUrlToDataMap.has(item.chapterUrl)) {
          return {
            ...item,
            finished: readMarkMode === READ_MARK_MODE.MARK_AS_READ,
          };
        }
        return item;
      })
    );

    await saveMangaConfigData(
      mangaUrl,
      "N/A",
      { readingStats: newReadingStats },
      isListed,
      CONFIG_READ_WRITE_MODE.MANGA_ONLY
    );

    await getChapterCurrentPageList();

    selectedChapters.current = [];
  }, [chaptersData, mangaUrl, listModeRef.current, readMarkMode]);

  const handleSelectAll = useCallback(() => {
    //indicate that the item was selected or deselected
    selectedChapters.current = [];
    setChapterList((prev) =>
      prev.map((item, index) => {
        const newChapterListItem = { ...item, isSelected: true, index };
        selectedChapters.current.push(newChapterListItem);
        return newChapterListItem;
      })
    );
  }, [chapterList]);

  const handleSelectInverse = useCallback(() => {
    //indicate that the item was selected or deselected
    selectedChapters.current = [];
    setChapterList((prev) =>
      prev.map((item, index) => {
        const newChapterListItem = {
          ...item,
          isSelected: item.isSelected ? !item.isSelected : true,
          index,
        };

        if (!item.isSelected) {
          selectedChapters.current.push(newChapterListItem);
        }

        return newChapterListItem;
      })
    );
  }, [chapterList]);

  const handleSwitchReadMode = useCallback(() => {
    if (readMarkMode === READ_MARK_MODE.MARK_AS_READ) {
      setReadMarkMode(READ_MARK_MODE.MARK_AS_UNREAD);
    } else {
      setReadMarkMode(READ_MARK_MODE.MARK_AS_READ);
    }
  }, [chapterList, readMarkMode]);

  const convertDocumentUriToTreeUri = useCallback((documentUri) => {
    // Regular expression to match and extract parts of the URI
    const regex =
      /^content:\/\/com\.android\.externalstorage\.documents\/tree\/([^\/]+)\/document\/(.+)$/;

    // Perform the match
    const match = documentUri.match(regex);
    if (match) {
      // Extract the tree part and document path
      const treePart = match[1]; // primary%3ADocuments
      const documentPath = match[2]; // primary%3ADocuments%2FMangaKo

      // Construct the Tree URI
      return `content://com.android.externalstorage.documents/tree/${documentPath}`;
    } else {
      // If the URI doesn't match the expected format, return it unchanged
      return documentUri;
    }
  }, []);

  const askForDownloadRootDirPermission = useCallback(async () => {
    try {
      const downloadFolderInRoot =
        FileSystem.StorageAccessFramework.getUriForDirectoryInRoot(
          downloadFolderNameInRoot
        );
      const { downloadPermissionFileName, downloadPermissionFilePath } =
        getMangaDownloadPermissionDir(mangaUrl);

      const downloadPermissionRequest =
        await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(
          downloadFolderInRoot
        );
      if (downloadPermissionRequest.granted) {
        await FileSystem.writeAsStringAsync(
          downloadPermissionFilePath,
          downloadPermissionRequest.directoryUri,
          { encoding: FileSystem.EncodingType.UTF8 }
        );
        return;
      }

      ToastAndroid.show(
        "Failed to get download directory.",
        ToastAndroid.SHORT
      );
    } catch (error) {
      console.error(
        `An error occured while asking download root dir permission ${error}`
      );
    }
  }, []);

  const checkDownloadDirPermission = useCallback(async () => {
    try {
      // await ensureDirectoryExists(downloadDir)
      const granted = await PermissionsAndroid.requestMultiple(
        [
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        ],
        {
          title: "External Storage Access Permission",
          message: "App needs access to your storage to read and write files",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        }
      );

      if (
        granted[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] !==
          PermissionsAndroid.RESULTS.GRANTED ||
        granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] !==
          PermissionsAndroid.RESULTS.GRANTED
      ) {
        return false;
      }

      const downloadFolderInRoot =
        FileSystem.StorageAccessFramework.getUriForDirectoryInRoot(
          downloadFolderNameInRoot
        );

      if (!downloadFolderInRoot) {
        ToastAndroid.show(
          "Downloads folder not found, please create one.",
          ToastAndroid.SHORT
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error(
        `An error occured when checking download permission: ${error}`
      );
      return false;
    }
  }, []);

  const getPagesFromChapters = useCallback(async (chapters, signal) => {
    try {
      const fetchPagePromises = chapters.map(
        async (chapter) =>
          await fetchChapterPages(
            mangaUrl,
            chapter.chapterUrl,
            signal,
            isListed
          )
      );

      const fetchPromiseResult = await Promise.allSettled(fetchPagePromises);

      const pagesFromChapters = fetchPromiseResult.map((result, index) => {
        if (!result.value.error && result?.value && result?.value.data) {
          return { [chapters[index].chapterUrl]: result.value.data };
        }
      });

      return pagesFromChapters;
    } catch (error) {
      console.error(
        `An error occured while getting pages from chapters ${error}`
      );
      return [];
    }
  }, []);

  const getDownloadResumablesForEachPages = useCallback(
    (chapterPagesOfEachChapter) => {
      try {
      } catch (error) {
        console.error(
          `An error occured while getting the download resumables for each pages ${error}`
        );
      }
    },
    []
  );

  const handleDownload = useCallback(async () => {
    try {
      if (selectedChapters.current.length < 1) return;

      controllerRef.current = new AbortController();
      const signal = controllerRef.current.signal;

      const firstSelectedChapter = selectedChapters.current[0];
      const selectedItemChapterPages = await fetchChapterPages(
        mangaUrl,
        firstSelectedChapter.chapterUrl,
        signal,
        isListed
      );

      if (selectedItemChapterPages.error) {
        console.error(selectedItemChapterPages.error);
        throw selectedItemChapterPages.error;
      }

      const selectedChaptersAsJsonString = JSON.stringify(
        selectedChapters.current
      );
      const selectedChaptersCacheKey = shorthash.unique(
        selectedChaptersAsJsonString
      );

      await AsyncStorage.setItem(
        selectedChaptersCacheKey,
        selectedChaptersAsJsonString
      );

      router.navigate({
        pathname: "(tabs)/download",
        params: {
          selectedChaptersCacheKey,
          mangaUrl,
          isListed,
        },
      });

      console.log("Success");
    } catch (error) {
      console.error(`An error occured during download of chapter ${error}`);
    }
  }, []);

  const handleDeleteDownload = useCallback(async () => {
    if (selectedChapters.current.length === 0) {
      ToastAndroid.show("No chapters selected", ToastAndroid.SHORT);
      return;
    }

    Alert.alert(
      "Delete downloads",
      "These chapters will be removed from your device, do you still wish to proceed?",
      [
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            try {
              // First, get the current manga config
              const mangaRetrievedConfigData = await readMangaConfigData(
                mangaUrl,
                CONFIG_READ_WRITE_MODE.MANGA_ONLY,
                isListed
              );

              let downloadedChapters =
                mangaRetrievedConfigData?.manga?.downloadedChapters || {};

              // Delete physical files and update config
              await Promise.all(
                selectedChapters.current.map(async (chapterData) => {
                  const chapterKey = shorthash.unique(chapterData.chapterUrl);
                  const parentKey = shorthash.unique(mangaUrl);
                  const chapterDir = `${
                    isListed
                      ? FileSystem.documentDirectory
                      : FileSystem.cacheDirectory
                  }${parentKey}/${chapterKey}`;

                  try {
                    // Delete the physical files
                    const dirInfo = await FileSystem.getInfoAsync(chapterDir);
                    if (dirInfo.exists) {
                      await FileSystem.deleteAsync(chapterDir, {
                        idempotent: true,
                      });
                    }

                    // Remove from downloadedChapters in config
                    if (downloadedChapters[chapterData.chapterUrl]) {
                      delete downloadedChapters[chapterData.chapterUrl];
                    }
                  } catch (err) {
                    console.warn(
                      `Error deleting chapter ${chapterData.chapterTitle}:`,
                      err
                    );
                  }
                })
              );

              // Save the updated config
              await saveMangaConfigData(
                mangaUrl,
                CONFIG_READ_WRITE_MODE.MANGA_ONLY,
                { downloadedChapters },
                isListed,
                CONFIG_READ_WRITE_MODE.MANGA_ONLY
              );

              // Reset UI state
              setChapterList((prev) => {
                const newChapterList = [...prev];
                // Update download status for deleted chapters
                selectedChapters.current.forEach((chapter) => {
                  if (newChapterList[chapter.index]) {
                    newChapterList[chapter.index] = {
                      ...newChapterList[chapter.index],
                      isSelected: false,
                      isDownloaded: false, // Reset download status
                    };
                  }
                });
                return newChapterList;
              });

              selectedChapters.current = [];
              listModeRef.current = CHAPTER_LIST_MODE.SELECT_MODE;
              ToastAndroid.show(
                "Selected downloads deleted",
                ToastAndroid.SHORT
              );
            } catch (error) {
              console.error("Error deleting downloads:", error);
              ToastAndroid.show("Error deleting downloads", ToastAndroid.SHORT);
            }

            setChapterList((prev) => {
              const newChapterList = [...prev];
              return newChapterList;
            });
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: false }
    );
  }, [mangaUrl, isListed]);

  const handleDownloadLongPress = useCallback(async () => {
    const { downloadPermissionFileName, downloadPermissionFilePath } =
      getMangaDownloadPermissionDir(mangaUrl);

    try {
      await FileSystem.deleteAsync(downloadPermissionFilePath, {
        idempotent: true,
      });

      ToastAndroid.show("Download settings cleared", ToastAndroid.SHORT);
    } catch (error) {
      ToastAndroid.show(
        "Failed to clear the Download settings",
        ToastAndroid.SHORT
      );
    }
  }, []);

  const renderItem = useCallback(
    ({ item, index }) => (
      <View className="w-full px-2">
        <ChapterListItem
          chapterData={{ ...item, index }}
          currentManga={{ manga: mangaUrl, chapter: item.chapterUrl }}
          chapterTitle={item.chTitle}
          publishedDate={item.publishDate}
          onPress={handleChapterPress}
          onLongPress={handleLongPress}
          finished={item.finished}
          onFetchReadingStatus={handleFetchReadingStatus}
          currentPage={item.lastPageRead || 0}
          isListed={isListed}
          isDownloaded={item.isDownloaded}
          isSelected={item.isSelected}
          listMode={item.listMode}
        />
      </View>
    ),
    [handleChapterPress, handleLongPress, mangaUrl, listModeRef.current]
  );

  const keyExtractor = useCallback(
    (item, index) => {
      return ` ${item.chapterUrl}-${index}`;
    },
    [chapterList]
  );

  return (
    <View className="flex-1">
      <View className="h-full relative">
        <FlashList
          ref={flashListref}
          data={chapterList}
          renderItem={renderItem}
          estimatedItemSize={800}
          contentContainerStyle={listStyles}
          ListEmptyComponent={
            <View className="flex-1 w-full my-5 justify-center items-center">
              <MaterialIcons name="not-interested" size={50} color="white" />
              <Text className="text-white font-pregular mt-2">
                No available chapters..
              </Text>
              <Text className="text-white font-pregular mt-2 text-center">
                Pull down to refresh.
              </Text>
            </View>
          }
          refreshControl={<RefreshControl onRefresh={onRefresh} />}
          ListHeaderComponent={<View>{headerComponent}</View>}
          onScroll={handleScroll}
          keyExtractor={keyExtractor}
        />
      </View>
      {showBtnToBottom && (
        <TouchableOpacity
          className="absolute bottom-5 p-3 bg-primary rounded-xl self-center"
          onPress={handleScrollToEnd}
        >
          <AntDesign name="downcircle" size={24} color="white" />
        </TouchableOpacity>
      )}
      {showBtnToTop && (
        <TouchableOpacity
          className="absolute bottom-5 p-3 bg-primary rounded-xl self-center"
          onPress={handleScrollToTop}
        >
          <AntDesign name="upcircle" size={24} color="white" />
        </TouchableOpacity>
      )}
      {listModeRef.current === CHAPTER_LIST_MODE.MULTI_SELECT_MODE && (
        <View
          className="bg-primary w-full py-1 px-1 justify-between absolute top-0"
          key={listModeRef.current}
        >
          <View className=" flex-row justify-start items-center my-2">
            <TouchableOpacity
              className="px-2 flex-row justify-center items-center"
              onPress={multiSelectModeClose}
            >
              <View>
                <MaterialIcons
                  name="close"
                  size={18}
                  color={colors.accent.DEFAULT}
                />
              </View>
              <Text className="text-white ml-2 font-pregular text-xs text-left">
                Close
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-2 flex-row justify-center items-center"
              onPress={handleSelectAll}
            >
              <View>
                <MaterialIcons
                  name="select-all"
                  size={18}
                  color={colors.accent.DEFAULT}
                />
              </View>
              <Text className="text-white ml-2 font-pregular text-xs text-left">
                Select all
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-2 flex-row justify-center items-center"
              onPress={handleSelectInverse}
            >
              <View>
                <MaterialCommunityIcons
                  name="select-group"
                  size={18}
                  color={colors.accent.DEFAULT}
                />
              </View>
              <Text className="text-white ml-2 font-pregular text-xs text-left">
                Select inverse
              </Text>
            </TouchableOpacity>
          </View>

          <HorizontalRule otherStyles={"mx-2"} />

          <View className="flex-row flex-1 mt-4 mb-2 mx-2 justify-around">
            <TouchableOpacity
              className="flex-row justify-center items-center"
              onPress={handleMarkAsRead}
              onLongPress={handleSwitchReadMode}
              key={readMarkMode}
            >
              <View>
                <MaterialIcons
                  name={
                    readMarkMode === READ_MARK_MODE.MARK_AS_READ
                      ? "check-box"
                      : "indeterminate-check-box"
                  }
                  size={20}
                  color="white"
                />
              </View>
              <Text className="text-white ml-2 font-pregular text-xs text-left">
                {readMarkMode === READ_MARK_MODE.MARK_AS_READ
                  ? "Mark as read"
                  : "Mark as unread"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row justify-center items-center"
              onPress={handleDownload}
              onLongPress={handleDownloadLongPress}
            >
              <View>
                <MaterialIcons name="file-download" size={20} color="white" />
              </View>
              <Text className="text-white ml-2 font-pregular text-xs text-left">
                Download
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row justify-center items-center"
              onPress={handleDeleteDownload}
            >
              <View>
                <MaterialIcons
                  name="file-download-off"
                  size={20}
                  color="white"
                />
              </View>
              <Text className="text-white ml-2 font-pregular text-xs text-left">
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export default ChapterList;
