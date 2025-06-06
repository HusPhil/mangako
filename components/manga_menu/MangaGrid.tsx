import {
	MangaRender,
	MangaResponse,
	SourceStatus,
} from '@/services/ResponseTypes';
import { ContentStyle, FlashList } from '@shopify/flash-list';
import React, { memo, ReactElement, useCallback } from 'react';
import { Text, View } from 'react-native';
import MangaCard from './MangaCard';

type MangaGridItem = MangaResponse | MangaRender;

interface MangaGridProps<T extends MangaGridItem> {
	mangaData?: T[];
	numColumns: number;
	listStyles?: ContentStyle;
	isLoading?: boolean;
	listEmptyComponent?: ReactElement;
	getSourceId: (item: T) => string;
	onEndReached?: () => void;
}
const MangaGrid = <T extends MangaGridItem>({
	mangaData,
	numColumns,
	listStyles,
	isLoading,
	listEmptyComponent,
	getSourceId,
	onEndReached,
}: MangaGridProps<T>) => {
	const placeholderData: T[] = new Array(3 * 10)
		.fill(null)
		.map((_, index) => ({
			mangaSource: {
				sourceUrl: '',
				sourceId: '',
				sourceName: '',
				sourceStatus: SourceStatus.DEPRECATED,
			},
			mangaId: `placeholder-${index}`,
			mangaTitle: '',
			mangaUrl: '',
			mangaCover: '',
			// Type assertion since we can't know the exact shape of T at compile time
		})) as T[];

	const MangaText = ({ mangaTitle }: { mangaTitle: string }) => {
		return (
			<View className="absolute  bg-opacity-0 bottom-0 w-full justify-end py-1 bg-secondary-100">
				<Text
					className="text-white text-xs text-left px-1 font-pregular overflow-auto"
					numberOfLines={3}
				>
					{mangaTitle || 'Loading..'}
				</Text>
			</View>
		);
	};

	const renderItem = useCallback(
		({ item }: { item: T }) => (
			<View
				className={`w-full px-2 mt-3 h-[150] ${
					isLoading ? 'animate-pulse' : ''
				}`}
			>
				<MangaCard
					mangaSourceId={getSourceId(item)}
					mangaId={item.mangaId}
					mangaUrl={item.mangaUrl}
					mangaTitle={item.mangaTitle}
					mangaCover={item.mangaCover}
					containerStyles={'my-1 w-[100%]'}
					coverStyles={'w-[100%] h-[150px]'}
					disabled={isLoading}
				>
					<MangaText mangaTitle={item.mangaTitle} />
				</MangaCard>
			</View>
		),
		[isLoading]
	);

	return (
		<View className="flex-1 px-2">
			<FlashList
				data={mangaData || placeholderData}
				renderItem={renderItem}
				keyExtractor={(item, index) =>
					item?.mangaId ?? `placeholder-${index}`
				}
				estimatedItemSize={150}
				numColumns={numColumns}
				contentContainerStyle={listStyles}
				showsVerticalScrollIndicator={false}
				ListEmptyComponent={listEmptyComponent}
				onEndReached={onEndReached}
				onEndReachedThreshold={0.5}
			/>
		</View>
	);
};

export default memo(MangaGrid) as <T extends MangaGridItem>(
	props: MangaGridProps<T>
) => ReactElement;
