// app/_layout.tsx (Using position absolute method)
import { colors } from '@/constants';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import * as NavigationBar from 'expo-navigation-bar';
import { SplashScreen, Stack } from 'expo-router';
import * as SystemUI from 'expo-system-ui';
import React, { useEffect } from 'react';
import {
	ActivityIndicator,
	AppState,
	AppStateStatus,
	Platform,
} from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import '../global.css';
const queryClient = new QueryClient();

export default function RootLayout() {
	const [fontsLoaded] = useFonts({
		'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
		'Poppins-Black': require('../assets/fonts/Poppins-Black.ttf'),
		'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
		'Poppins-ExtraBold': require('../assets/fonts/Poppins-ExtraBold.ttf'),
		'Poppins-ExtraLight': require('../assets/fonts/Poppins-ExtraLight.ttf'),
		'Poppins-Light': require('../assets/fonts/Poppins-Light.ttf'),
		'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
		'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
		'Poppins-Thin': require('../assets/fonts/Poppins-Thin.ttf'),
	});
	// Hide bottom bar
	const hideNavBar = async () => {
		if (Platform.OS !== 'android') return;

		try {
			// Prevent content from moving up when bar is shown
			// await NavigationBar.setPositionAsync("absolute");

			await NavigationBar.setBackgroundColorAsync(
				colors.secondary.DEFAULT
			);

			// Hide bottom bar
			// await NavigationBar.setVisibilityAsync("hidden");

			// Show the bar when user swipes
			// await NavigationBar.setBehaviorAsync("overlay-swipe");

			// Optional: Set background color
			await SystemUI.setBackgroundColorAsync(colors.secondary.DEFAULT);
			// StatusBar.setBackgroundColor(colors.secondary.DEFAULT)

			console.log('Navigation bar hidden successfully');
		} catch (error) {
			console.log('Navigation bar hide error:', error);
		}
	};

	useEffect(() => {
		const handleAppStateChange = (nextAppState: AppStateStatus) => {
			// If app is being used, hide nav bar
			if (nextAppState === 'active') {
				hideNavBar();
			}
		};

		// Subscribe to app state changes
		const appStateSubscription = AppState.addEventListener(
			'change',
			handleAppStateChange
		);

		// Initial hide when component mounts
		hideNavBar();

		// Clean up the event listener when the component unmounts
		return () => {
			appStateSubscription.remove();
		};
	}, []);

	useEffect(() => {
		if (fontsLoaded) {
			SplashScreen.hideAsync();
			// Re-hide navigation bar after splash screen

			setTimeout(() => {
				hideNavBar();
			}, 100);
		}
	}, [fontsLoaded]);

	if (!fontsLoaded) {
		return (
			<SafeAreaView className="flex-1 justify-center items-center bg-primary">
				<ActivityIndicator size="large" color={colors.accent.DEFAULT} />
			</SafeAreaView>
		);
	}

	return (
		<PaperProvider
			theme={{
				dark: true,
				colors: {
					primary: '#FC3B2C',
				},
			}}
		>
			<QueryClientProvider client={queryClient}>
				<Stack
					screenOptions={{
						headerShown: false,
					}}
				>
					{/* Tab layout screen */}
					<Stack.Screen name="(tabs)" />

					{/* Manga section with dynamic ID */}
					<Stack.Screen name="manga/[id]/index" />

					{/* Manga chapter detail */}
					<Stack.Screen
						name="manga/[id]/[chapterId]"
						options={{
							contentStyle: {
								backgroundColor: colors.secondary.DEFAULT,
							},
							animation: 'simple_push',
						}}
					/>
					{/* Search screen */}
					<Stack.Screen
						name="search"
						options={{
							headerShown: false,
							animation: 'simple_push',
						}}
					/>
				</Stack>
			</QueryClientProvider>
		</PaperProvider>
	);
}
