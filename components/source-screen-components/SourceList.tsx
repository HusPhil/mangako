import { Source } from "@/types/ResponseTypes";
import React from "react";
import { Text, View } from "react-native";
import SourceItem from "./SourceItem";

interface SourceListProps {
  sources: Source[];
}

const SourceList = ({ sources }: SourceListProps) => {
  if (sources.length === 0) {
    return (
      <View className="py-10 items-center">
        <Text className="text-white/40 italic">No sources found...</Text>
      </View>
    );
  }

  return (
    <View className="mt-4">
      <Text className="text-white/60 text-xs font-bold uppercase mb-4 tracking-widest ml-1">
        Available Providers
      </Text>
      {sources.map((source) => (
        <SourceItem key={source.sourceId} source={source} />
      ))}
    </View>
  );
};

export default SourceList;
