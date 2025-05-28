// src/hooks/useMangaList.ts
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Manga } from '../ResponseTypes';
import { cleanUnusedManga, ensureMangaListFolder, readMangaListFile, writeMangaListFile } from './mangaListUtils';
import { MangaList, Tab } from './types';

const DEFAULT_MANGA_LIST: MangaList = { tabs: [], manga: {} };

export function useMangaList() {
  const [mangaList, setMangaList] = useState<MangaList>(DEFAULT_MANGA_LIST);
  const [isReady, setIsReady] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        await ensureMangaListFolder();
        await cleanUnusedManga();
        const data = await readMangaListFile();
        if (data) setMangaList(data);
        setIsReady(true);
      })();
    }, [])
  );

  const saveMangaList = async (data: MangaList) => {
    setMangaList(data);
    await writeMangaListFile(data);
  };

  const addTab = async (name: string) => {
    const normalizedName = name.trim().toLowerCase();
  
    const tabExists = mangaList.tabs.some(
      tab => tab.name.trim().toLowerCase() === normalizedName
    );
  
    if (tabExists) {
      console.warn(`Tab "${name}" already exists.`);
      return;
    }
  
    const newTab: Tab = {
      id: normalizedName.replace(/\s/g, '-'),
      name,
      order: mangaList.tabs.length,
      mangaIds: [],
    };
  
    const updated = { ...mangaList, tabs: [...mangaList.tabs, newTab] };
    await saveMangaList(updated);
    setMangaList(updated);
  };
  

  const addMangaToTab = async (tabId: string, manga: Manga) => {
    const mangaExists = !!mangaList.manga[manga.mangaId];
    const updatedTabs = mangaList.tabs.map((tab) =>
      tab.id === tabId
        ? { ...tab, mangaIds: [...new Set([...tab.mangaIds, manga.mangaId])] }
        : tab
    );
    const updated: MangaList = {
      tabs: updatedTabs,
      manga: mangaExists ? mangaList.manga : { ...mangaList.manga, [manga.mangaId]: manga },
    };
    await saveMangaList(updated);
    setMangaList(updated);
  };

  const addToMangaFavorites = async (manga: Manga) => {
    console.log("addToMangaFavorites", manga);
    const mangaExists = !!mangaList.manga[manga.mangaId];
    const favoritesTab = mangaList.tabs.find((tab) => tab.id === "favorites");
    
    if (!favoritesTab) {
      await addTab("favorites");
    }

    const updatedTabs = mangaList.tabs.map((tab) =>
      tab.id === favoritesTab?.id
        ? { ...tab, mangaIds: [...new Set([...tab.mangaIds, manga.mangaId])] }
        : tab
    );
    const updated: MangaList = {
      tabs: updatedTabs,
      manga: mangaExists ? mangaList.manga : { ...mangaList.manga, [manga.mangaId]: manga },
    };
    await saveMangaList(updated);
    setMangaList(updated);
  };

  const isMangaFavorite = (mangaId: string) => {
    return mangaList.tabs.some((tab) => tab.mangaIds.includes(mangaId));
  };

  const deleteTab = async (tabId: string) => {
    console.log("deleteTab", tabId);
    const updatedTabs = mangaList.tabs.filter((tab) => tab.id !== tabId);
    const updated: MangaList = {
      tabs: updatedTabs,
      manga: mangaList.manga,
    };
    await saveMangaList(updated);
    setMangaList(updated);
  };

  const deleteSelectedTabs = async (tabIds: string[]) => {
    if (tabIds.length === 0) return;
    
    console.log("deleteSelectedTabs", tabIds);
    const updatedTabs = mangaList.tabs.filter((tab) => !tabIds.includes(tab.id));
    const updated: MangaList = {
      tabs: updatedTabs,
      manga: mangaList.manga,
    };
    await saveMangaList(updated);
  };

  const updateTabOrder = async (tabs: Tab[]) => {
    const updated: MangaList = {
      tabs,
      manga: mangaList.manga,
    };
    await saveMangaList(updated);
    setMangaList(updated);
  };

  const renameTab = async (tabId: string, newName: string) => {
    const updatedTabs = mangaList.tabs.map((tab) =>
      tab.id === tabId ? { ...tab, name: newName } : tab
    );
    const updated: MangaList = {
      tabs: updatedTabs,
      manga: mangaList.manga,
    };
    await saveMangaList(updated);
    setMangaList(updated);
  };

  
  return {
    mangaList,
    isReady,
    isMangaFavorite,
    addTab,
    addMangaToTab,
    addToMangaFavorites,
    deleteTab,
    deleteSelectedTabs,
    saveMangaList,
    updateTabOrder,
    renameTab,
  };
}
