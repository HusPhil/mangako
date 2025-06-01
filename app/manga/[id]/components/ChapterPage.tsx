import { MangaChapterPage } from '@/services/ResponseTypes';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Text, View } from 'react-native';

interface ChapterPageProps {
	item: MangaChapterPage;
	screenWidth: number;
	blurhash: string;
}

const ChapterPage = ({ item, screenWidth, blurhash }: ChapterPageProps) => {
	const [hasError, setHasError] = useState(false);
	const [retryKey, setRetryKey] = useState(0);
	
	const aspectRatio = item.pageWidth / item.pageHeight;
	// Calculate height based on maintaining aspect ratio at screen width
	const imageHeight = screenWidth / aspectRatio;

	const handleRetry = () => {
		setHasError(false);
		setRetryKey(prev => prev + 1); // Force re-render of image
	};

	return (
		<View 
			style={{ 
				width: screenWidth, 
				height: imageHeight 
			}} 
			className="justify-center items-center"
		>
			{hasError ? (
				<View className="justify-center items-center bg-secondary w-full h-full">
					<Text className="font-pbold text-xl text-accent text-center px-4">
						Failed to load image
					</Text>
          <Text className="text-white mt-2 text-center px-4 text-sm">
						Touch the screen to retry
					</Text>
				</View>
			) : (
				<Image
					key={retryKey} // Force re-mount on retry
					source={{
						uri: Math.random() < 0.2 ? 'https://invalid-url-for-testing.com/fake-image.jpg' : item.pageImageUrl,
						headers: {
							'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
							Accept: 'image/*',
							'Accept-Language': 'en-US,en;q=0.9',
							Referer: 'https://mangakakalot.com/',
						},
					}}
					style={{
						width: screenWidth,
						height: imageHeight,
					}}
					contentFit="cover"
					placeholderContentFit="cover"
					contentPosition="center"
					transition={100}
					recyclingKey={`${item.pageId}-${retryKey}`}
					allowDownscaling={false}
					placeholder={{ blurhash: item.pageBlurhash || blurhash }}
					onError={(error) => {
						console.error('CHAPTER PAGE ERROR:', error.error);
						setHasError(true);
					}}
				/>
			)}
		</View>
	);
};

export default ChapterPage;
