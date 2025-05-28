import { colors } from '@/constants';
import { Tab } from '@/services/manga_list/types';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DragList, { DragListRenderItemInfo } from 'react-native-draglist';
import HorizontalRule from '../HorizontalRule';

interface ModalEditTabsProps {
	tabs: Tab[];
	isSorting: boolean;
	handleReordered: (fromIndex: number, toIndex: number) => void;
	handleRenameTab: (tabId: string, newName: string) => void;
	onClose: () => void;
	renamingTabId: string | null;
	setRenamingTabId: (renamingTabId: string | null) => void;
}

// Memoized draggable item component to prevent unnecessary re-renders
const DraggableTabItem = React.memo(({
  item,
  isActive,
  onDragStart,
  onDragEnd,
  renamingTabId,
  handleRenameTab,
  setRenamingTabId,
}: {
  item: Tab;
  isActive: boolean;
  renamingTabId: string | null;
  onDragStart: () => void;
  onDragEnd: () => void;
  handleRenameTab: (tabId: string, newName: string) => void;
  setRenamingTabId: (renamingTabId: string | null) => void;
}) => {
  const isRenaming = renamingTabId === item.id;
  const [localTabName, setLocalTabName] = useState(item.name);
  const inputRef = useRef<TextInput>(null);

  // Sync local state when item name changes or when entering rename mode
  useEffect(() => {
    if (isRenaming) {
      setLocalTabName(item.name);
      // Use requestAnimationFrame for smoother focus timing
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isRenaming, item.name]);

  // Memoize handlers to prevent prop changes
  const handleSave = useCallback(() => {
    const trimmedName = localTabName.trim();
    if (trimmedName && trimmedName !== item.name) {
      handleRenameTab(item.id, trimmedName);
    }
    setRenamingTabId(null);
  }, [localTabName, item.id, item.name, handleRenameTab, setRenamingTabId]);

  const handleEdit = useCallback(() => {
    setRenamingTabId(item.id);
  }, [item.id, setRenamingTabId]);

  // Memoize styles to prevent recalculation
  const containerStyle = useMemo(() => ({
    className: `flex-row items-center justify-between p-3 mb-2 rounded-lg ${
      isActive ? 'bg-accent/20' : 'bg-secondary/50'
    }`
  }), [isActive]);

  return (
    <TouchableOpacity
      className={`flex-row items-center justify-between p-3 mb-2 rounded-lg ${
        isActive ? 'bg-accent/20' : 'bg-secondary/50'
      }`}
      onLongPress={onDragStart}
      onPressOut={onDragEnd}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center space-x-3 max-w-[85%]">
        {isRenaming ? (
          <TextInput
            ref={inputRef}
            className="text-white border-2 border-white rounded-md p-2 flex-1"
            value={localTabName}
            onChangeText={setLocalTabName}
            onBlur={handleSave}
            onSubmitEditing={handleSave}
            returnKeyType="done"
            selectTextOnFocus
          />
        ) : (
          <Text className="font-pmedium text-white text-base capitalize">
            {item.name}
          </Text>
        )}
      </View>

      <View className="flex-row items-center space-x-4">
        {isRenaming ? (
          <TouchableOpacity
            className="p-2 rounded-full bg-accent/20"
            onPress={handleSave}
          >
            <MaterialIcons
              name="save"
              size={18}
              color="white"
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            className="p-2 rounded-full bg-accent/20"
            onPress={handleEdit}
          >
            <MaterialIcons
              name="edit"
              size={18}
              color="white"
            />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
});

DraggableTabItem.displayName = 'DraggableTabItem';

const ModalEditTabs = ({
	onClose,
	tabs,
	isSorting,
	handleReordered,
	handleRenameTab,
	renamingTabId,
	setRenamingTabId,
}: ModalEditTabsProps) => {
	
  // Memoize the render function to prevent recreation on every render
  const draggableRenderItem = useCallback(({
    item,
    onDragStart,
    onDragEnd,
    isActive,
  }: DragListRenderItemInfo<Tab>) => {
    return (
      <DraggableTabItem
        item={item}
        isActive={isActive}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        renamingTabId={renamingTabId}
        handleRenameTab={handleRenameTab}
        setRenamingTabId={setRenamingTabId}
      />
    );
  }, [renamingTabId, handleRenameTab, setRenamingTabId]);

  // Memoize key extractor
  const keyExtractor = useCallback((item: Tab) => item.id, []);

	return (
		<View className="relative  w-full bg-secondary rounded-md p-3 max-h-[420px]">
			<View className="flex-row justify-between items-center">
				<Text className="text-white font-pregular text-center pb-2">
					Sort the tabs however you like!
				</Text>
				<TouchableOpacity
					className="flex-1 items-end p-3"
					onPress={onClose}
				>
					<MaterialIcons name="close" size={20} color="white" />
				</TouchableOpacity>
			</View>
			<HorizontalRule displayText={''} otherStyles={''} />
			<View className="max-h-[75%]">
				<DragList
					keyExtractor={keyExtractor}
					className="mt-3"
					data={tabs}
					onReordered={handleReordered}
					renderItem={draggableRenderItem}
				/>
				
			</View>
      <HorizontalRule displayText={''} otherStyles={''} />
      <View className="flex-row justify-center items-center">
        <Text className="text-white font-pregular text-center pb-2 bg-accent/50 rounded-md p-2 mt-4">
          Long press to reorder tabs
        </Text>
        
      </View>
      {isSorting && (
					<View className="absolute inset-0 bg-black/50 items-center justify-center">
						<ActivityIndicator
							size={25}
							color={colors.accent.DEFAULT}
						/>
					</View>
				)}
		</View>
	);
};

export default React.memo(ModalEditTabs);