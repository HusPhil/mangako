import { Category } from "@/services/db/types";
import React from "react";
import { View } from "react-native";
import CategoryItem from "./CategoryItem";

interface CategoryListProps {
  categories: Category[];
}

const CategoryList = ({ categories }: CategoryListProps) => {
  return (
    <View className="gap-2.5">
      {categories.map((category, index) => (
        <CategoryItem
          key={category.category_id}
          id={category.category_id}
          title={category.name}
          isFirst={index === 0}
          isLast={index === categories.length - 1}
        />
      ))}
    </View>
  );
};

export default CategoryList;
