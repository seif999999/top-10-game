import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING } from '../utils/constants';
import { Category } from '../types';

type Props = {
  category: Category;
  onPress?: () => void;
  isExpanded?: boolean;
};

const CategoryCard: React.FC<Props> = ({ category, onPress, isExpanded = false }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.card} activeOpacity={0.7}>
      <View style={styles.cardContent}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{category.name}</Text>
          {category.description ? <Text style={styles.subtitle}>{category.description}</Text> : null}
        </View>
        <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: SPACING.xs
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  textContainer: {
    flex: 1,
    gap: 6
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700'
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 14
  },
  expandIcon: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600'
  }
});

export default CategoryCard;


