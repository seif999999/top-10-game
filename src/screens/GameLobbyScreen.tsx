import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import Button from '../components/Button';
import Input from '../components/Input';
import { COLORS, SPACING } from '../utils/constants';
import { GameLobbyScreenProps } from '../types/navigation';

const GameLobbyScreen: React.FC<GameLobbyScreenProps> = ({ navigation, route }) => {
  const { categoryId, categoryName } = route.params;
  const [roomCode, setRoomCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [players, setPlayers] = useState(['You']);

  const createRoom = () => {
    setIsHost(true);
    setPlayers(['You']);
  };

  const joinRoom = () => {
    if (roomCode.trim()) {
      setIsHost(false);
      setPlayers(['You', 'Player 2']);
    }
  };

  const startGame = () => {
    navigation.navigate('GameScreen', {
      roomId: 'demo-room',
      categoryId: categoryId
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Game Lobby</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryTitle}>{categoryName}</Text>
          <Text style={styles.categorySubtitle}>Category selected</Text>
        </View>

        {!isHost && players.length === 1 ? (
          <View style={styles.roomOptions}>
            <Text style={styles.sectionTitle}>Join or Create Room</Text>
            
            <View style={styles.createSection}>
              <Text style={styles.optionTitle}>Create New Room</Text>
              <Button title="Create Room" onPress={createRoom} />
            </View>

            <View style={styles.joinSection}>
              <Text style={styles.optionTitle}>Join Existing Room</Text>
              <Input 
                placeholder="Enter room code" 
                value={roomCode} 
                onChangeText={setRoomCode}
              />
              <Button title="Join Room" onPress={joinRoom} />
            </View>
          </View>
        ) : (
          <View style={styles.roomInfo}>
            <Text style={styles.sectionTitle}>Room Info</Text>
            <Text style={styles.roomCode}>Room Code: {roomCode || 'ABC123'}</Text>
            
            <View style={styles.playersSection}>
              <Text style={styles.playersTitle}>Players ({players.length})</Text>
              {players.map((player, index) => (
                <Text key={index} style={styles.playerName}>
                  {player} {index === 0 ? '(You)' : ''}
                </Text>
              ))}
            </View>

            {isHost && (
              <Button 
                title="Start Game" 
                onPress={startGame}
                disabled={players.length < 2}
              />
            )}
          </View>
        )}
      </ScrollView>
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
  content: {
    flex: 1,
    padding: SPACING.lg
  },
  categoryInfo: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    alignItems: 'center'
  },
  categoryTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800'
  },
  categorySubtitle: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: SPACING.xs
  },
  roomOptions: {
    gap: SPACING.xl
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: SPACING.md
  },
  createSection: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.lg,
    gap: SPACING.md
  },
  joinSection: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.lg,
    gap: SPACING.md
  },
  optionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600'
  },
  roomInfo: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.lg,
    gap: SPACING.md
  },
  roomCode: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center'
  },
  playersSection: {
    gap: SPACING.sm
  },
  playersTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600'
  },
  playerName: {
    color: COLORS.muted,
    fontSize: 14,
    paddingLeft: SPACING.md
  }
});

export default GameLobbyScreen;


