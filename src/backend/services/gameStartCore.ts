import type { RoomData } from '../../shared/types/game';
import { AppError } from '../../shared/errors';

export type StartGameData = {
  turnOrder: string[];
  firstQuestion: RoomData['questions'][number];
};

export const getStartGameData = (roomData: RoomData, hostId: string): StartGameData => {
  if (roomData.hostId !== hostId) {
    throw new AppError({
      code: 'MP_HOST_ONLY',
      message: 'Only the host can start the game',
      userMessage: 'Only the host can start the game.'
    });
  }

  if (roomData.status !== 'lobby') {
    throw new AppError({
      code: 'MP_ROOM_INVALID_STATE',
      message: `Room is not in lobby state (current: ${roomData.status})`,
      userMessage: 'Room is not ready to start.'
    });
  }

  const playerIds = Object.keys(roomData.players || {});
  if (playerIds.length < 1) {
    throw new AppError({
      code: 'MP_NO_PLAYERS',
      message: 'Need at least 1 player to start',
      userMessage: 'Need at least 1 player to start.'
    });
  }

  if (!roomData.questions || roomData.questions.length === 0) {
    throw new AppError({
      code: 'MP_NO_QUESTIONS',
      message: 'No questions available',
      userMessage: 'No questions available.'
    });
  }

  const firstQuestion = roomData.questions[0];
  if (!firstQuestion) {
    throw new AppError({
      code: 'MP_QUESTION_NOT_FOUND',
      message: 'First question not found',
      userMessage: 'First question not found.'
    });
  }

  const turnOrder = playerIds.sort();
  return { turnOrder, firstQuestion };
};
