// In your useChapterListControls hook, ensure you're updating state efficiently:

import { useRef, useState } from "react";

import { MangaChapter } from "@/services/ResponseTypes";
import { useCallback } from "react";



const useChapterSelection = () => {
    const [selectionModeOn, setSelectionModeOn] = useState(false);
    const selectedChaptersRef = useRef<Set<string>>(new Set());
    const chapterIdToIndexMap = useRef<Map<string, number>>(new Map());
    const chapterRefs = useRef<Map<string, any>>(new Map());
  
    const toggleSelectChapter = useCallback((chapter: MangaChapter, index: number) => {
      console.log('toggleSelectChapter', chapter.chapterId, index);
      const isSelected = selectedChaptersRef.current.has(chapter.chapterId);
      
      if (isSelected) {
        selectedChaptersRef.current.delete(chapter.chapterId);
        chapterIdToIndexMap.current.delete(chapter.chapterId);
      } else {
        selectedChaptersRef.current.add(chapter.chapterId);
        chapterIdToIndexMap.current.set(chapter.chapterId, index);
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
      console.log("getSelectedChapters", chapterRefs.current.get(Array.from(selectedChaptersRef.current.keys())[0]));
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

    const selectInverseChapters = useCallback((chapters: MangaChapter[]) => {
      chapters.forEach(chapter => {

        const chapterRef = chapterRefs.current.get(chapter.chapterId);
        if (selectedChaptersRef.current.has(chapter.chapterId)) {
          selectedChaptersRef.current.delete(chapter.chapterId);
          if (chapterRef?.updateSelection) {
            chapterRef.updateSelection(false);
          }
        } else {
          selectedChaptersRef.current.add(chapter.chapterId);
          if (chapterRef?.updateSelection) {
            chapterRef.updateSelection(true);
          }
        }
      });
    }, []);

    const selectChapterRange = useCallback(
      (chapters: MangaChapter[], targetIndex: number) => {
        const selectedIds = [...selectedChaptersRef.current];
        const firstSelectedId = selectedIds[0];
    
        if (!firstSelectedId) {
          console.warn("No chapter selected to create a range from.");
          return;
        }
    
        const firstChapterIndex = chapterIdToIndexMap.current.get(firstSelectedId);
    
        if (firstChapterIndex == null) {
          console.warn("First chapter index not found in index map.", firstSelectedId);
          return;
        }
    
        const startIndex = Math.min(firstChapterIndex, targetIndex);
        const endIndex = Math.max(firstChapterIndex, targetIndex);
    
        console.log(`Selecting chapters from index ${startIndex} to ${endIndex}`);
    
        for (let i = startIndex; i <= endIndex; i++) {
          const chapter = chapters[i];
          if (!chapter) {
            console.warn(`Chapter not found at index ${i}`);
            continue;
          }
    
          selectedChaptersRef.current.add(chapter.chapterId);
          chapterIdToIndexMap.current.set(chapter.chapterId, i);
          const chapterRef = chapterRefs.current.get(chapter.chapterId);
          chapterRef?.updateSelection?.(true);
        }
        console.log("chapterIdToIndexMap.current", chapterIdToIndexMap.current);
      },
      []
    );
    
  
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
      selectChapterRange,
      toggleSelectChapter,
      turnOnSelectionMode,
      turnOffSelectionMode,
      getSelectedChapters,
      getSelectedCount,
      registerChapterRef,
      unregisterChapterRef,
      selectAllChapters,
      clearAllSelections,
      selectInverseChapters,
    };
  };

  export default useChapterSelection;