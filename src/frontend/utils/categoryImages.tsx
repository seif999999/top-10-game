/**
 * Shared category images for carousel display.
 * Mount CategoryImagePreloader early (e.g. HomeScreen) for instant load when user opens Categories.
 */
import React from 'react';
import { View, StyleSheet, Image } from 'react-native';

export const categoryImages: Record<string, number> = {
  Random: require('../assets/images/random.webp'),
  Sports: require('../assets/images/sports.jpeg'),
  Movies: require('../assets/images/movies.jpg'),
  Music: require('../assets/images/music.webp'),
  Science: require('../assets/images/science.jpg'),
  Geography: require('../assets/images/geography.jpg'),
  Food: require('../assets/images/food.webp'),
  Technology: require('../assets/images/technology.jpg'),
  Masry: require('../assets/images/egypt.jpg'),
  Custom: require('../assets/images/createyourown.jpg'),
};

const preloaderStyle = StyleSheet.create({
  root: { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 },
});

/** Invisible preloader - mount on HomeScreen for early cache warm, or on category screens */
export function CategoryImagePreloader(): React.ReactElement {
  return (
    <View style={preloaderStyle.root} pointerEvents="none" collapsable>
      {Object.entries(categoryImages).map(([id, source]) => (
        <Image
          key={id}
          source={source}
          style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
        />
      ))}
    </View>
  );
}
