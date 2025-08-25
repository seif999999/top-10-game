import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING } from '../utils/constants';
import { Category } from '../types';

type Props = {
  category: Category;
  onPress?: () => void;
};

const CategoryCard: React.FC<Props> = ({ category, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.card} activeOpacity={0.7}>
      <Text style={styles.title}>{category.name}</Text>
      {category.description ? <Text style={styles.subtitle}>{category.description}</Text> : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    borderRadius: 12,
    gap: 6,
    flex: 1,
    marginHorizontal: SPACING.xs
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700'
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 14
  }
});

export default CategoryCard;


