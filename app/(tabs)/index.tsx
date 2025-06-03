import ModalAddTab from '@/components/manga_home/ModalAddTab';
import ModalDeleteTabs from '@/components/manga_home/ModalDeleteTabs';
import ModalEditTabs from '@/components/manga_home/ModalEditTabs';
import TabsView from '@/components/manga_home/TabsView';
import MangaListHeader from '@/components/manga_list/MangaListHeader';
import { colors } from '@/constants';
import { Tab } from '@/services/manga_list/types';
import { useMangaList } from '@/services/manga_list/useMangaList';
import useMangaListModal from '@/services/manga_list/useMangaListModal';
import Constants from 'expo-constants';
import { useEffect } from 'react';
import { Platform, StatusBar, View } from 'react-native';

const MangaListScreen = () => {
	const {
		mangaList,
		isReady,
		addTab,
		deleteTab,
		addMangaToTab,
		deleteSelectedTabs,
		updateTabOrder,
		renameTab,
	} = useMangaList();

	const {
		activeModal,
		isDeleteModalVisible,
		isAddModalVisible,
		isEditModalVisible,
		isSorting,
		selectedItems,
		tabTitleToAdd,
		renamingTabId,
		setRenamingTabId,
		setIsSorting,
		setTabTitleToAdd,
		toggleItemSelection,
		openModal,
		closeModal,
	} = useMangaListModal();

	const handleShowModalAddTab = () => {
		openModal('add');
	};

	const handleShowModalDeleteTabs = () => {
		openModal('delete');
		// deleteTab("favorites");
	};

	const handleShowModalEditTabs = async () => {
		await addMangaToTab('favorites', {
			mangaId: 'c2e9c5eeeb6b5fdc078e161f2bad76fe',
			mangaTitle: 'kems Magic Emperor',
			mangaUrl: 'https://www.mangakakalot.gg/manga/magic-emperor',
			mangaCover:
				'https://mangako-page-image-proxy.manga-image-proxy.workers.dev/?url=https%3A%2F%2Fimg-r1.2xstorage.com%2Fthumb%2Fmagic-emperor.webp',
		});
		openModal('edit');
	};

	const handleDeleteTab = async () => {
		if (selectedItems.length === 0) return;
		deleteSelectedTabs(selectedItems.map((item) => item.id || ''));
		closeModal();
	};

	const handleSelectItem = (tab: Tab) => {
		toggleItemSelection(tab);
	};

	const handleAddTab = () => {
		addTab(tabTitleToAdd);
		closeModal();
	};

	const handleReordered = async (fromIndex: number, toIndex: number) => {
		setIsSorting(true);
		const copy = [...mangaList.tabs]; // Don't modify react data in-place
		const removed = copy.splice(fromIndex, 1);
		copy.splice(toIndex, 0, removed[0]); // Now insert at the new pos
		await updateTabOrder(copy);
		setIsSorting(false);
	};

	const handleRenameTab = async (tabId: string, newName: string) => {
		await renameTab(tabId, newName);
		closeModal();
	};

	useEffect(() => {
		StatusBar.setBackgroundColor(colors.secondary.DEFAULT);
		StatusBar.setBarStyle('light-content');
	}, []);

	const viewStyle =
		Platform.OS === 'android'
			? { paddingTop: Constants.statusBarHeight }
			: {};
	return (
		<View className="flex-1 bg-primary" style={viewStyle}>
			<MangaListHeader
				handleShowAddTab={handleShowModalAddTab}
				handleShowDeleteTab={handleShowModalDeleteTabs}
				handleShowSortTab={handleShowModalEditTabs}
			/>

			<ModalAddTab
				visible={isAddModalVisible}
				onClose={closeModal}
				handleAddTab={handleAddTab}
				setTabTitleToAdd={setTabTitleToAdd}
			/>

			<ModalDeleteTabs
				visible={isDeleteModalVisible}
				tabs={mangaList.tabs}
				handleDeleteTab={handleDeleteTab}
				handleSelectItem={handleSelectItem}
				onClose={closeModal}
			/>

			<ModalEditTabs
				visible={isEditModalVisible}
				tabs={mangaList.tabs}
				isSorting={isSorting}
				renamingTabId={renamingTabId}
				setRenamingTabId={setRenamingTabId}
				handleReordered={handleReordered}
				handleRenameTab={handleRenameTab}
				onClose={closeModal}
			/>

			<TabsView
				tabs={mangaList.tabs}
				mangas={mangaList.manga}
				onAddTab={() => handleShowModalAddTab()}
				isLoading={!isReady}
			/>
		</View>
	);
};

export default MangaListScreen;
