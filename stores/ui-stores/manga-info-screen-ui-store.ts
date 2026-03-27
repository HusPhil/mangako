import { create } from "zustand";

type ModalType = "add_to_library" | null;

interface MagaInfoScreenUIStore {
  activeModal: ModalType;
  modalData: any; // Used to pass IDs or names for editing/deleting
  openModal: (type: ModalType, data?: any) => void;
  closeModal: () => void;
}

export const useMangaInfoScreenUIStore = create<MagaInfoScreenUIStore>(
  (set) => ({
    activeModal: null,
    modalData: null,
    openModal: (type, data = null) =>
      set({ activeModal: type, modalData: data }),
    closeModal: () => set({ activeModal: null, modalData: null }),
  }),
);

export default useMangaInfoScreenUIStore;
