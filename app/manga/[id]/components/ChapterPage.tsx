import { MangaChapterPage } from '@/services/ResponseTypes';
import { Image } from 'expo-image';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChapterPageRef } from './manga_reader/useChapterPageErrors';

interface ChapterPageProps {
	item: MangaChapterPage;
	screenWidth: number;
	blurhash: string;
	onErrorRegister?: (id: string, ref: ChapterPageRef) => void;
	onErrorClear?: (id: string) => void;
}

const ChapterPage = forwardRef<ChapterPageRef, ChapterPageProps>(
	({ item, screenWidth, blurhash, onErrorRegister, onErrorClear }, ref) => {
		const [hasError, setHasError] = useState(false);
		const [retryKey, setRetryKey] = useState(0);

		const aspectRatio = item.pageWidth / item.pageHeight;
		const imageHeight = screenWidth / aspectRatio;

		const reload = () => {
			setHasError(false);
			setRetryKey((prev) => prev + 1);
		};

		useImperativeHandle(ref, () => ({ reload }));

		useEffect(() => {
			if (hasError && onErrorRegister) {
				onErrorRegister(item.pageId, { reload });
			} else if (!hasError && onErrorClear) {
				onErrorClear(item.pageId);
			}
		}, [hasError]);

		return (
			<View
				style={{ width: screenWidth, height: imageHeight }}
				className="justify-center items-center flex-1"
			>
				{hasError ? (
					<Pressable
						onPress={reload}
						className="justify-center items-center bg-secondary w-full h-full"
					>
						<Text className="font-pbold text-xl text-accent text-center px-4">
							Failed to load image
						</Text>
						<Text className="text-white mt-2 text-center px-4 text-sm">
							Tap to retry
						</Text>
					</Pressable>
				) : (
					<Image
						key={retryKey}
						source={{
							uri: false ? '' : item.pageImageUrl,
							headers: {
								'User-Agent':
									'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
								Accept: 'image/*',
								'Accept-Language': 'en-US,en;q=0.9',
								Referer: 'https://mangakakalot.com/',
							},
						}}
						style={{ width: screenWidth, height: imageHeight }}
						contentFit="cover"
						placeholderContentFit="cover"
						contentPosition="center"
						transition={100}
						recyclingKey={`${item.pageId}-${retryKey}`}
						allowDownscaling={false}
						placeholder={{
							blurhash: item.pageBlurhash || blurhash,
						}}
						onLoad={() => {
							onErrorClear?.(item?.pageId);
						}}
						onError={(error) => {
							console.error('CHAPTER PAGE ERROR:', error.error);
							setHasError(true);
						}}
					/>
				)}
			</View>
		);
	}
);

export default ChapterPage;
