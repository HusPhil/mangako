import MangaGrid from '@/components/manga_menu/MangaGrid'
import { colors } from '@/constants'
import { Manga } from '@/services/ResponseTypes'
import { useSearchMangaMutation } from '@/services/useGetSearchedManga'
import { Ionicons } from '@expo/vector-icons'
import React, { useCallback, useState } from 'react'
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

interface SearchResponse {
  results: Manga[]
}

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Manga[]>([])
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')

  const {
    mutate: searchManga,
    error,
    isPending,
    isError,
    reset: resetMutation
  } = useSearchMangaMutation()

  // Handle search with debounce
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text)
    // Reset results if search is cleared
    if (!text.trim()) {
      setSearchResults([])
      setDebouncedSearchTerm('')
      resetMutation()
      return
    }

    // return () => clearTimeout(timeoutId)
  }, [searchManga, resetMutation])

  // Handle manual search on submit
  const handleManualSearch = () => {
    searchManga(
        { 
          source: 'mangakakalot', 
          keyword: searchQuery.trim() 
        },
        {
          onSuccess: (data: SearchResponse) => {
            setSearchResults(data.results)
          },
          onError: (error: Error) => {
            console.error('Search failed:', error)
          }
        }
      )
  }

  const EmptyListComponent = () => {
    if (isError && error) {
      return (
        <View className="flex-1 justify-center items-center mt-10 px-4">
          <Ionicons 
            name="alert-circle-outline" 
            size={48} 
            color={colors.accent.DEFAULT} 
          />
          <Text className="text-white text-base text-center mt-4">
            {error instanceof Error ? error.message : 'An error occurred while searching'}
          </Text>
          <Pressable 
            className="mt-4 bg-accent px-6 py-2 rounded-lg flex-row items-center"
            onPress={() => {
              resetMutation()
              handleManualSearch()
            }}
          >
            <Ionicons name="refresh" size={18} color="white" className="mr-2" />
            <Text className="text-white font-medium ml-2">Try Again</Text>
          </Pressable>
        </View>
      )
    }

    if (!debouncedSearchTerm) {
      return (
        <View className="flex-1 justify-center items-center mt-10">
          <Ionicons 
            name="search" 
            size={48} 
            color="white" 
            style={{ opacity: 0.5 }} 
          />
          <Text className="text-white text-base opacity-50 mt-4 text-center px-4">
            Search for your favorite manga by title
          </Text>
        </View>
      )
    }

    if (!isPending && searchResults.length === 0) {
      return (
        <View className="flex-1 justify-center items-center mt-10">
          <Ionicons 
            name="book-outline" 
            size={48} 
            color="white" 
            style={{ opacity: 0.5 }} 
          />
          <Text className="text-white text-base opacity-50 mt-4 text-center px-4">
            No results found for "{debouncedSearchTerm}"
          </Text>
          <Text className="text-accent-300 text-sm mt-2 text-center px-4">
            Try using different keywords or check your spelling
          </Text>
        </View>
      )
    }

    return null
  }

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <View className="px-4 py-2 mb-2 ">
        <View className="flex-row items-center bg-secondary px-4 rounded-2xl h-12 ">
          <Ionicons 
            name="search" 
            size={24} 
            color={isPending ? colors.accent.DEFAULT : "white"} 
          />
          <TextInput
            className="flex-1 ml-3 text-white tracking-wide py-3 text-base"
            placeholder="Search manga..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            style={{
              fontSize: 16,
              fontFamily: 'System'
            }}
            value={searchQuery}
            onChangeText={handleSearchChange}
            onSubmitEditing={handleManualSearch}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isPending}
          />
          {isPending && (
            <ActivityIndicator 
              size="small" 
              color={colors.accent.DEFAULT}
              className="ml-2" 
            />
          )}
          {searchQuery.length > 0 && !isPending && (
            <Pressable
              onPress={() => handleSearchChange('')}
              className="ml-2 p-1.5"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close-circle" size={22} color="gray" />
            </Pressable>
          )}
        </View>
      </View>

      <MangaGrid
        mangaData={searchResults}
        numColumns={3}
        isLoading={isPending}
        listEmptyComponent={<EmptyListComponent />}
        onEndReached={() => {
          // TODO: Implement pagination
          console.log('Reached end of list')
        }}
        listStyles={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  )
}

export default Search
