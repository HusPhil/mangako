import { create } from "zustand";

type ModalType = "add_category" | "edit_category" | "delete_confirm" | null;

interface CategoryScreenUIStore {
  activeModal: ModalType;
  modalData: any; // Used to pass IDs or names for editing/deleting
  openModal: (type: ModalType, data?: any) => void;
  closeModal: () => void;
}

export const useCategoryScreenUIStore = create<CategoryScreenUIStore>(
  (set) => ({
    activeModal: null,
    modalData: null,
    openModal: (type, data = null) =>
      set({ activeModal: type, modalData: data }),
    closeModal: () => set({ activeModal: null, modalData: null }),
  }),
);

export default useCategoryScreenUIStore;
