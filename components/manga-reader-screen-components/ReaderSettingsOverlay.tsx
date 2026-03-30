import { MangaChapter } from "@/types/ResponseTypes";
import React, { useState } from "react";
import ReaderSettingBottomBar from "./ReaderSettingBottomBar";
import ReaderSettingChapterNavigation from "./ReaderSettingChapterNavigation";
import ReaderSettingReadModes from "./ReaderSettingReadModes";
import ReaderSettingTopBar from "./ReaderSettingTopBar";

type ModalView = "settings" | "chapters" | null;

interface ReaderSettingsOverlayProps {
  mangaId: string;
  mangaSourceId: string;
  mangaUrl: string;
  onNavigateToPrev: () => void;
  onNavigateToNext: () => void;
  onJumpToPage: (page: number) => void;
  onNavigateToChapter: (chapter: MangaChapter) => void;
}

const ReaderSettingsOverlay = ({
  mangaId,
  mangaSourceId,
  mangaUrl,
  onNavigateToPrev,
  onNavigateToNext,
  onJumpToPage,
  onNavigateToChapter,
}: ReaderSettingsOverlayProps) => {
  const [activeModal, setActiveModal] = useState<ModalView>(null);

  return (
    <>
      <ReaderSettingTopBar
        onOpenChapters={() => setActiveModal("chapters")}
        onOpenSettings={() => setActiveModal("settings")}
      />

      <ReaderSettingBottomBar
        onNavigateToPrev={onNavigateToPrev}
        onNavigateToNext={onNavigateToNext}
        onJumpToPage={onJumpToPage}
      />

      <ReaderSettingChapterNavigation
        isVisible={activeModal === "chapters"}
        onClose={() => setActiveModal(null)}
        onSelectChapter={onNavigateToChapter}
        mangaId={mangaId}
        mangaSourceId={mangaSourceId}
        mangaUrl={mangaUrl}
      />

      <ReaderSettingReadModes
        isVisible={activeModal === "settings"}
        onClose={() => setActiveModal(null)}
      />
    </>
  );
};

export default ReaderSettingsOverlay;
