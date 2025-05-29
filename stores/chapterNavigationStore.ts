import { ChapterNavigationMap } from '@/services/ResponseTypes';
import { create } from 'zustand';
type ChapterNavigationStore = {
  navigationMap: ChapterNavigationMap;
  setNavigationMap: (navigationMap: ChapterNavigationMap) => void;
};

export const useChapterNavigationStore = create<ChapterNavigationStore>((set) => ({
  navigationMap: {},
  setNavigationMap: (navigationMap) => set({ navigationMap }),
}));
