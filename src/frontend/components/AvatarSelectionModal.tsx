import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import type { ImageStyle, TextStyle } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../design-system';
import { Avatar } from '../../shared/types';
import { 
  AVAILABLE_AVATARS, 
  NO_AVATAR_OPTION, 
  ALL_AVATAR_OPTIONS,
  AVATAR_GRID_CONFIG 
} from '../utils/avatarConstants';
import { getAvatarUrl, getAvatarDisplayName, isNoAvatar } from '../utils/avatarUtils';
import { getCharacterById } from '../assets/avatars/characters';

interface AvatarSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onAvatarSelect: (avatar: Avatar) => void;
  currentAvatarId?: string;
}

const { width: screenWidth } = Dimensions.get('window');
const avatarSize = AVATAR_GRID_CONFIG.ITEM_SIZE;
const columns = AVATAR_GRID_CONFIG.COLUMNS;
const spacing = AVATAR_GRID_CONFIG.SPACING;

const AvatarSelectionModal: React.FC<AvatarSelectionModalProps> = ({
  visible,
  onClose,
  onAvatarSelect,
  currentAvatarId,
}) => {
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | undefined>(currentAvatarId);

  // Get all avatars (no filtering needed)
  const getFilteredAvatars = (): Avatar[] => {
    return ALL_AVATAR_OPTIONS;
  };

  const handleAvatarSelect = (avatar: Avatar) => {
    setSelectedAvatarId(avatar.id);
  };

  const handleConfirmSelection = () => {
    const selectedAvatar = ALL_AVATAR_OPTIONS.find(avatar => avatar.id === selectedAvatarId);
    if (selectedAvatar) {
      onAvatarSelect(selectedAvatar);
      onClose();
    }
  };

  const renderAvatarItem = ({ item: avatar }: { item: Avatar }) => {
    const isSelected = selectedAvatarId === avatar.id;
    const isNoAvatarOption = isNoAvatar(avatar);
    const displayName = getAvatarDisplayName(avatar);
    const character = getCharacterById(avatar.id);

    return (
      <TouchableOpacity
        style={[
          styles.avatarItem,
          isSelected && styles.selectedAvatarItem,
        ]}
        onPress={() => handleAvatarSelect(avatar)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.avatarContainer,
          isSelected && styles.selectedAvatarContainer,
        ]}>
          {isNoAvatarOption ? (
            <View style={styles.noAvatarIcon}>
              <Text style={styles.noAvatarText}>?</Text>
            </View>
          ) : character ? (
            <View style={[
              styles.characterAvatar,
              { 
                backgroundColor: character.backgroundColor,
                borderColor: character.color,
              }
            ]}>
              <Text style={[
                styles.characterEmoji,
                { color: character.color }
              ]}>
                {character.emoji}
              </Text>
            </View>
          ) : (
            <View style={[
              styles.coloredAvatar,
              { 
                backgroundColor: COLORS.primary
              }
            ]}>
              <Text style={styles.avatarEmoji}>👤</Text>
            </View>
          )}
        </View>
        <Text style={[
          styles.avatarName,
          isSelected && styles.selectedAvatarName,
        ]}>
          {displayName}
        </Text>
        <Text 
          style={[
            styles.avatarDescription,
            isSelected && styles.selectedAvatarDescription,
          ]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {avatar.description}
        </Text>
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Text style={styles.selectedIndicatorText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };


  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Choose Avatar</Text>
          <TouchableOpacity
            style={[
              styles.confirmButton,
              !selectedAvatarId && styles.disabledButton,
            ]}
            onPress={handleConfirmSelection}
            disabled={!selectedAvatarId}
          >
            <Text style={[
              styles.confirmButtonText,
              !selectedAvatarId && styles.disabledButtonText,
            ]}>
              Done
            </Text>
          </TouchableOpacity>
        </View>


        {/* Avatar Grid */}
        <FlatList
          data={getFilteredAvatars()}
          renderItem={renderAvatarItem}
          keyExtractor={(item) => item.id}
          numColumns={columns}
          contentContainerStyle={styles.avatarGrid}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.avatarRow}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  closeButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.fontWeight.medium as TextStyle['fontWeight'],
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.bold as TextStyle['fontWeight'],
    color: COLORS.text,
  },
  confirmButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  confirmButtonText: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as TextStyle['fontWeight'],
  },
  disabledButton: {
    backgroundColor: COLORS.muted,
  },
  disabledButtonText: {
    color: COLORS.muted,
  },
  avatarGrid: {
    padding: SPACING.lg,
  },
  avatarRow: {
    justifyContent: 'space-around',
    marginBottom: SPACING.lg,
  },
  avatarItem: {
    alignItems: 'center',
    width: (screenWidth - SPACING.lg * 2 - SPACING.md * 2) / columns,
    position: 'relative',
    paddingBottom: SPACING.sm,
  },
  selectedAvatarItem: {
    // Additional styling for selected item if needed
  },
  avatarContainer: {
    width: avatarSize,
    height: avatarSize,
    borderRadius: avatarSize / 2,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  selectedAvatarContainer: {
    borderColor: COLORS.primary,
    borderWidth: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  avatarImage: {
    width: avatarSize - 4,
    height: avatarSize - 4,
    borderRadius: (avatarSize - 4) / 2,
  } as ImageStyle,
  characterAvatar: {
    width: avatarSize - 4,
    height: avatarSize - 4,
    borderRadius: (avatarSize - 4) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  characterEmoji: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    textAlign: 'center',
  },
  coloredAvatar: {
    width: avatarSize - 4,
    height: avatarSize - 4,
    borderRadius: (avatarSize - 4) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    textAlign: 'center',
  },
  avatarPlaceholder: {
    width: avatarSize - 4,
    height: avatarSize - 4,
    borderRadius: (avatarSize - 4) / 2,
    backgroundColor: COLORS.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold as TextStyle['fontWeight'],
    color: COLORS.text,
  },
  noAvatarIcon: {
    width: avatarSize - 4,
    height: avatarSize - 4,
    borderRadius: (avatarSize - 4) / 2,
    backgroundColor: COLORS.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noAvatarText: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold as TextStyle['fontWeight'],
    color: COLORS.muted,
  },
  avatarName: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: TYPOGRAPHY.fontWeight.medium as TextStyle['fontWeight'],
  },
  selectedAvatarName: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.fontWeight.semibold as TextStyle['fontWeight'],
  },
  avatarDescription: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: SPACING.xs,
    lineHeight: 16,
    maxWidth: avatarSize + 20,
  },
  selectedAvatarDescription: {
    color: COLORS.primary,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedIndicatorText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: TYPOGRAPHY.fontWeight.bold as TextStyle['fontWeight'],
  },
});

export default AvatarSelectionModal;
