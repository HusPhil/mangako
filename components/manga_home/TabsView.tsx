import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors } from '@/constants';
import { Tab } from '@/services/manga_list/types';

import { MangaRender } from '@/services/ResponseTypes';
import { CaptionsOff } from 'lucide-react-native';
import { MangaGrid } from '../manga_menu';
const Tabs = createMaterialTopTabNavigator();

interface TabViewProps {
	tabs: Tab[];
	mangas: Record<string, MangaRender>;
	onAddTab: () => void;
	isLoading: boolean;
}

const TabsView = ({ tabs, mangas, onAddTab, isLoading }: TabViewProps) => {
	const getTabScreenComponent = useCallback(
		(tabItem: Tab) => {
			if (tabItem.mangaIds.length > 0) {
				return (
					<View className="flex-1 bg-primary pt-3">
						<MangaGrid
							mangaData={tabItem.mangaIds.map((id) => mangas[id])}
							numColumns={3}
							getSourceId={(item) => item.mangaSourceId}
						/>
					</View>
				);
			}
			return (
				<View className="h-full w-full justify-center items-center bg-primary">
					<CaptionsOff size={100} color="white" />
					<Text className="text-center font-pregular text-white mt-3">
						No manga has been added here yet!
					</Text>
				</View>
			);
		},
		[tabs]
	);

	if (isLoading) return null;

	return (
		<View className="flex-1">
			{tabs.length > 0 ? (
				<Tabs.Navigator
					backBehavior="history"
					screenOptions={{
						tabBarActiveTintColor: colors.accent[100],
						tabBarIndicatorStyle: {
							backgroundColor: colors.accent.DEFAULT,
						},
						tabBarLabelStyle: styles.tabBarLabelStyle,
						tabBarStyle: { backgroundColor: 'transparent' },
						tabBarItemStyle: { padding: 10 },
						tabBarScrollEnabled: true,
						tabBarPressColor: colors.accent[100],
						tabBarAllowFontScaling: true,
					}}
				>
					{tabs.map((tabItem, index) => {
						if (tabItem.name) {
							return (
								<Tabs.Screen
									key={tabItem.id}
									name={tabItem.name}
									options={{ title: tabItem.name }}
								>
									{() => getTabScreenComponent(tabItem)}
								</Tabs.Screen>
							);
						}
					})}
				</Tabs.Navigator>
			) : (
				<View className="justify-center items-center h-full w-full">
					<MaterialCommunityIcons
						name="robot-confused-outline"
						size={128}
						color="white"
					/>
					<Text className="font-pregular text-white text-center mt-2">
						No tabs were found!
					</Text>
					<TouchableOpacity
						onPress={onAddTab}
						className="bg-accent-100
						mt-5 py-2 px-3 rounded-md flex-row items-center gap-1 border-white/50 border"
					>
						<MaterialIcons name="add" size={16} color="white" />
						<Text className="text-white text-sm font-pregular">
							Add new Tab
						</Text>
					</TouchableOpacity>
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	tabBarLabelStyle: {
		color: 'white',
		fontFamily: 'Poppins-Regular',
		textTransform: 'uppercase',
		fontSize: 11,
	},
	container: {
		flex: 1,
		backgroundColor: colors.primary.DEFAULT,
	},
	screenContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	screenText: {
		fontSize: 18,
		// fontFamily: ["Poppins-Regular", "sans-serif"],
		color: '#000', // Change this to colors.secondary.DEFAULT if you have a specific color
	},
});

export default React.memo(TabsView);
