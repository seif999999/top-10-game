import React from 'react';
import { View, FlatList, StyleSheet, SafeAreaView, Text, TouchableOpacity } from 'react-native';
import CategoryCard from '../components/CategoryCard';
import { Category } from '../types';
import { COLORS, SPACING } from '../utils/constants';
import { CategoriesScreenProps } from '../types/navigation';

const categories: Category[] = [
  { id: '1', name: 'Sports', description: 'Top 10 athletes and teams' },
  { id: '2', name: 'Movies', description: 'Top 10 films of all time' },
  { id: '3', name: 'Music', description: 'Top 10 songs and artists' },
  { id: '4', name: 'Science', description: 'Top 10 scientific discoveries' },
  { id: '5', name: 'History', description: 'Top 10 historical events' },
  { id: '6', name: 'Geography', description: 'Top 10 countries and landmarks' },
  { id: '7', name: 'Technology', description: 'Top 10 tech innovations' },
  { id: '8', name: 'Literature', description: 'Top 10 books and authors' }
];

const CategoriesScreen: React.FC<CategoriesScreenProps> = ({ navigation }) => {
  const handleCategoryPress = (category: Category) => {
    navigation.navigate('GameLobby', {
      categoryId: category.id,
      categoryName: category.name
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Choose Category</Text>
        <View style={styles.placeholder} />
      </View>
      
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <CategoryCard 
            category={item} 
            onPress={() => handleCategoryPress(item)}
          />
        )}
        numColumns={2}
        columnWrapperStyle={styles.row}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.card
  },
  backButton: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600'
  },
  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700'
  },
  placeholder: {
    width: 50
  },
  list: { 
    padding: SPACING.lg
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: SPACING.md
  }
});

export default CategoriesScreen;


