import { useState } from "react";

export type ModalType = "add" | "delete" | "edit" | null;

// Generic type for selectable items - you can extend this based on your needs
export interface SelectableItem {
  id?: string;
  name: string;
  [key: string]: any;
}

const useMangaListModal = <T extends SelectableItem>() => {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedItems, setSelectedItems] = useState<T[]>([]);
  const [tabTitleToAdd, setTabTitleToAdd] = useState("");
  const [isSorting, setIsSorting] = useState(false);
  const [renamingTabId, setRenamingTabId] = useState<string | null>(null);

  const openModal = (type: ModalType) => {
    setActiveModal(type);
    // Clear selections when opening a new modal
    if (type !== activeModal) {
      setSelectedItems([]);
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setRenamingTabId(null);
    setIsSorting(false);
    setTabTitleToAdd("");
    setSelectedItems([]);
  };

  const toggleItemSelection = (item: T) => {
    setSelectedItems(prev => {
      const itemKey = item.id || item.name;
      const isSelected = prev.some(selectedItem => 
        (selectedItem.id || selectedItem.name) === itemKey
      );

      if (isSelected) {
        return prev.filter(selectedItem => 
          (selectedItem.id || selectedItem.name) !== itemKey
        );
      } else {
        return [...prev, item];
      }
    });
  };

  const selectAllItems = (items: T[]) => {
    setSelectedItems(items);
  };

  const clearAllSelections = () => {
    setSelectedItems([]);
  };

  const isItemSelected = (item: T): boolean => {
    const itemKey = item.id || item.name;
    return selectedItems.some(selectedItem => 
      (selectedItem.id || selectedItem.name) === itemKey
    );
  };

  const selectItems = (items: T[]) => {
    setSelectedItems(items);
  };

  return {
    // Modal state
    activeModal,
    tabTitleToAdd,
    setTabTitleToAdd,
    openModal,
    closeModal,
    isSorting,
    setIsSorting,
    renamingTabId,
    setRenamingTabId,
    isAddModalVisible: activeModal === "add",
    isDeleteModalVisible: activeModal === "delete",
    isEditModalVisible: activeModal === "edit",
    
    // Selection state
    selectedItems,
    hasSelectedItems: selectedItems.length > 0,
    selectedCount: selectedItems.length,
    
    // Selection actions
    toggleItemSelection,
    selectAllItems,
    clearAllSelections,
    isItemSelected,
    selectItems,
  };
};

export default useMangaListModal;