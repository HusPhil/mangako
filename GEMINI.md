# GEMINI.md - Project Context & Instructions

This document provides essential context and instructions for AI agents working on the **MangaKoV3 (mangako-v3)** project.

## Project Overview
**MangaKoV3** is a mobile application built with **React Native** and **Expo**. It is designed as a modern, high-performance manga reader.

- **Main Technologies:** React 19, React Native 0.81, Expo (SDK 54), TypeScript, Expo Router.
- **Architecture:** 
  - **Routing:** File-based routing using `expo-router` located in the `app/` directory.
  - **State Management:** (TBD - currently using standard React hooks and context).
  - **Styling:** Custom themed components and hooks for seamless Light/Dark mode support.
  - **Icons:** Cross-platform icon strategy using SF Symbols (iOS) and Material Symbols (Android/Web).

## Building and Running
The following commands are defined in `package.json`:

| Command | Description |
| :--- | :--- |
| `npm install` | Install all project dependencies. |
| `npm start` | Start the Expo development server (Expo CLI). |
| `npm run android` | Start the app on an Android emulator or device. |
| `npm run ios` | Start the app on an iOS simulator or device. |
| `npm run web` | Start the app in a web browser. |
| `npm run lint` | Run ESLint to check for code quality issues. |
| `npm run reset-project` | **WARNING:** Moves the starter code to `app-example` and creates a blank `app` directory. |

## Development Conventions

### 1. Imports & Path Aliases
Always use the `@/` path alias to refer to the project root. This is configured in `tsconfig.json`.
- **Example:** `import { Colors } from '@/constants/theme';`

### 2. Theming & Styling
Maintain consistent theme support by using the provided themed components and hooks:
- **Components:** Use `ThemedText` and `ThemedView` instead of standard React Native components where possible.
- **Hooks:** Use `useThemeColor` to access theme-aware colors within custom components.
- **Constants:** Theme definitions are located in `constants/theme.ts`.

### 3. Routing & Navigation
- Routes are defined by the file structure in the `app/` directory.
- Use `Stack`, `Tabs`, and `Link` from `expo-router`.
- Shared layout configurations are in `app/_layout.tsx` (Root) and `app/(tabs)/_layout.tsx` (Tab navigation).

### 4. Component Structure
- **UI Components:** Generic, reusable UI elements should be placed in `components/ui`.
- **Feature Components:** Feature-specific components belong in `components/`.

### 5. Icons
- Use the `IconSymbol` component (`components/ui/icon-symbol.tsx`) for a unified icon API. 
- It maps SF Symbol names to equivalent icons on Android/Web.

## Key Files Summary
- `app/_layout.tsx`: Root layout with ThemeProvider and initial Stack navigation.
- `app/(tabs)/_layout.tsx`: Tab bar configuration.
- `constants/theme.ts`: Central source of truth for colors and fonts.
- `hooks/use-theme-color.ts`: Hook for resolving colors based on the current theme.
- `components/themed-text.tsx`: Custom `Text` component with built-in theme support.
