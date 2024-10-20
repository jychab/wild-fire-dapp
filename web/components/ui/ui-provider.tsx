'use client';

import { createContext, FC, ReactNode, useContext, useState } from 'react';
import { UiLayout } from './ui-layout';

// Enum for categories
export enum Category {
  FOR_YOU = 'For You',
  MEMES = 'Memes',
  NFTS = 'NFTs',
  DEFI = 'Defi',
  GAMES = 'Games',
}

// Define the shape of your context state
interface CategoryContextType {
  category: Category;
  setCategory: (category: Category) => void;
}

// Create the context
const UiContext = createContext<CategoryContextType | undefined>(undefined);

// Custom hook to use the CategoryContext
export const useCategory = () => {
  const context = useContext(UiContext);
  if (!context) {
    throw new Error('useCategory must be used within a UiProvider');
  }
  return context;
};

// Provider component to wrap your app
export const UiProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [category, setCategory] = useState(Category.FOR_YOU);

  return (
    <UiContext.Provider value={{ category, setCategory }}>
      <UiLayout>{children}</UiLayout>
    </UiContext.Provider>
  );
};
