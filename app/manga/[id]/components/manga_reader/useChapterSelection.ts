// In your useChapterListControls hook, ensure you're updating state efficiently:

import { useRef, useState } from "react";

import { MangaChapter } from "@/services/ResponseTypes";
import { useCallback } from "react";

const useChapterSelection = () => {
    const [selectionModeOn, setSelectionModeOn] = useState(false);
    const selectedChaptersRef = useRef<Set<string>>(new Set());
    const chapterRefs = useRef<Map<string, any>>(new Map());
  
    const toggleSelectChapter = useCallback((chapter: MangaChapter) => {
      const isSelected = selectedChaptersRef.current.has(chapter.chapterId);
      
      if (isSelected) {
        selectedChaptersRef.current.delete(chapter.chapterId);
      } else {
        selectedChaptersRef.current.add(chapter.chapterId);
      }
      
      // Direct DOM manipulation
      const chapterRef = chapterRefs.current.get(chapter.chapterId);
      if (chapterRef?.updateSelection) {
        chapterRef.updateSelection(!isSelected);
      }
    }, []);

    const registerChapterRef = useCallback((chapterId: string, ref: any) => {
      chapterRefs.current.set(chapterId, ref);
    }, []);
    
    const unregisterChapterRef = useCallback((chapterId: string) => {
      chapterRefs.current.delete(chapterId);
    }, []);
  
    const turnOnSelectionMode = useCallback(() => {
      setSelectionModeOn(true);
    }, []);
  
    const turnOffSelectionMode = useCallback(() => {
      // Clear all selections visually
      selectedChaptersRef.current.forEach(chapterId => {
        const chapterRef = chapterRefs.current.get(chapterId);
        if (chapterRef?.updateSelection) {
          chapterRef.updateSelection(false);
        }
      });
      
      selectedChaptersRef.current.clear();
      setSelectionModeOn(false);
    }, []);

    const getSelectedChapters = useCallback(() => {
      return Array.from(selectedChaptersRef.current);
    }, []);
    
    const getSelectedCount = useCallback(() => {
      return selectedChaptersRef.current.size;
    }, []);

    const selectAllChapters = useCallback((chapters: MangaChapter[]) => {
      chapters.forEach(chapter => {
        selectedChaptersRef.current.add(chapter.chapterId);
        const chapterRef = chapterRefs.current.get(chapter.chapterId);
        if (chapterRef?.updateSelection) {
          chapterRef.updateSelection(true);
        }
      });
    }, []);
  
    const clearAllSelections = useCallback(() => {
      selectedChaptersRef.current.forEach(chapterId => {
        const chapterRef = chapterRefs.current.get(chapterId);
        if (chapterRef?.updateSelection) {
          chapterRef.updateSelection(false);
        }
      });
      selectedChaptersRef.current.clear();
    }, []);
  
    return {
      selectionModeOn,
      selectedChaptersRef,
      toggleSelectChapter,
      turnOnSelectionMode,
      turnOffSelectionMode,
      getSelectedChapters,
      getSelectedCount,
      registerChapterRef,
      unregisterChapterRef,
      selectAllChapters,
      clearAllSelections,
    };
  };

  export default useChapterSelection;