import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, COMPONENT_STYLES } from '../design-system';
import { logger } from '../../backend/utils/logger';
import { CustomQuestionScreenProps } from '../../shared/types/navigation';
import CustomQuestionService, { CustomQuestion } from '../../backend/services/customQuestionService';
import Button from '../components/Button';
import TeamSetupModal from '../components/TeamSetupModal';
import { TeamSetupConfig } from '../../shared/types/teams';
import { FEATURES } from '../../backend/config/features';

const CustomQuestionScreen: React.FC<CustomQuestionScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState(['', '', '', '']); // Start with 4 empty answers
  const [isLoading, setIsLoading] = useState(false);
  const [showTeamSetup, setShowTeamSetup] = useState(false);
  const [savedQuestion, setSavedQuestion] = useState<CustomQuestion | null>(null);

  const handleAddAnswer = () => {
    if (answers.length < 10) { // Limit to 10 answers
      setAnswers([...answers, '']);
    }
  };

  const handleRemoveAnswer = (index: number) => {
    if (answers.length > 2) { // Keep at least 2 answers
      const newAnswers = answers.filter((_, i) => i !== index);
      setAnswers(newAnswers);
    }
  };

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleCreateQuestion = async () => {
    // Validate question
    if (!question.trim()) {
      Alert.alert('Missing Question', 'Please enter a question.');
      return;
    }

    // Validate answers
    const validAnswers = answers.filter(answer => answer.trim().length > 0);
    if (validAnswers.length < 2) {
      Alert.alert('Not Enough Answers', 'Please provide at least 2 answers.');
      return;
    }

    if (validAnswers.length > 10) {
      Alert.alert('Too Many Answers', 'Please provide no more than 10 answers.');
      return;
    }

    setIsLoading(true);
    try {
      logger.log('🔄 Creating custom question...');
      
      // Save the custom question
      const customQuestionService = CustomQuestionService.getInstance();
      const savedQuestion = await customQuestionService.saveCustomQuestion(question.trim(), validAnswers);
      
      logger.log('✅ Custom question created:', savedQuestion.id);
      setSavedQuestion(savedQuestion);
      
      // Check if teams are enabled
      if (FEATURES.teamsEnabled) {
        setShowTeamSetup(true);
      } else {
        // Navigate directly to game with custom question
        navigation.navigate('GameScreen', {
          roomId: 'single-player',
          categoryId: 'Custom',
          customQuestion: savedQuestion,
          isCustomQuestion: true
        });
      }
      
    } catch (error) {
      logger.error('❌ Error creating custom question:', error);
      Alert.alert('Error', 'Failed to create custom question. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleTeamSetupStart = (config: TeamSetupConfig) => {
    try {
      logger.log('🎮 Starting custom question team game with config:', config);
      
      if (!savedQuestion) {
        Alert.alert('Error', 'No question saved');
        return;
      }

      // Navigate to GameScreen with team configuration and custom question
      navigation.navigate('GameScreen', {
        roomId: 'single-player',
        categoryId: 'Custom',
        customQuestion: savedQuestion,
        isCustomQuestion: true,
        teamConfig: config
      });
      
      // Close the modal
      setShowTeamSetup(false);
    } catch (error) {
      logger.error('Error starting custom question team game:', error);
      Alert.alert('Error', 'Failed to start team game. Please try again.');
    }
  };

  const handleTeamSetupClose = () => {
    setShowTeamSetup(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Your Own</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Question Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Question</Text>
            <TextInput
              style={[styles.questionInput, COMPONENT_STYLES.outline]}
              placeholder="Enter your question here..."
              placeholderTextColor="white"
              value={question}
              onChangeText={setQuestion}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Answers Input */}
          <View style={styles.section}>
            <View style={styles.answersHeader}>
              <Text style={styles.sectionTitle}>Answers (2-10)</Text>
              <TouchableOpacity 
                onPress={handleAddAnswer} 
                style={styles.addButton}
                disabled={answers.length >= 10}
              >
                <Text style={styles.addButtonText}>+ Add Answer</Text>
              </TouchableOpacity>
            </View>
            
            {answers.map((answer, index) => (
              <View key={index} style={styles.answerRow}>
                <TextInput
                  style={[styles.answerInput, COMPONENT_STYLES.outline]}
                  placeholder={`Answer ${index + 1}`}
                  placeholderTextColor="white"
                  value={answer}
                  onChangeText={(value) => handleAnswerChange(index, value)}
                />
                {answers.length > 2 && (
                  <TouchableOpacity 
                    onPress={() => handleRemoveAnswer(index)}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeButtonText}>×</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* Instructions */}
          <View style={styles.instructionsSection}>
            <Text style={styles.instructionsTitle}>💡 Tips</Text>
            <Text style={styles.instructionsText}>
              • Write clear, specific questions{'\n'}
              • Provide 2-10 possible answers{'\n'}
              • Answers should be ranked from most to least common{'\n'}
              • You'll play this question in single player mode
            </Text>
          </View>

          {/* Create Button */}
          <View style={styles.createButtonSection}>
            <Button
              title={isLoading ? "Creating..." : "Create & Play"}
              onPress={handleCreateQuestion}
              disabled={isLoading}
              style={styles.createButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Team Setup Modal */}
      <TeamSetupModal
        visible={showTeamSetup}
        onClose={handleTeamSetupClose}
        onStartGame={handleTeamSetupStart}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  backButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  questionInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    fontSize: 16,
    color: 'white',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  answersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  answerInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    fontSize: 16,
    color: 'white',
    marginRight: SPACING.sm,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  instructionsSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    ...COMPONENT_STYLES.outline,
  },
  instructionsTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  instructionsText: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
  },
  createButtonSection: {
    paddingBottom: SPACING.xl,
  },
  createButton: {
    backgroundColor: COLORS.primary,
  },
});

export default CustomQuestionScreen;
