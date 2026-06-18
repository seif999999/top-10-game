import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { logger } from '../../backend/utils/logger';

const CACHE_DIR = `${FileSystem.cacheDirectory}avatars/`;

const hashUrl = (url: string): string => {
  let hash = 5381;
  for (let i = 0; i < url.length; i += 1) {
    hash = ((hash << 5) + hash) + url.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
};

const getCachePathForUrl = (url: string): string => {
  const id = hashUrl(url);
  return `${CACHE_DIR}${id}.png`;
};

const ensureCacheDir = async (): Promise<void> => {
  const info = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
};

export const getCachedAvatarUri = async (remoteUrl: string): Promise<string> => {
  if (!remoteUrl || Platform.OS === 'web' || !FileSystem.cacheDirectory) {
    return remoteUrl;
  }

  const localPath = getCachePathForUrl(remoteUrl);

  try {
    const localInfo = await FileSystem.getInfoAsync(localPath);
    if (localInfo.exists) {
      return localPath;
    }

    await ensureCacheDir();
    const downloaded = await FileSystem.downloadAsync(remoteUrl, localPath);
    return downloaded.uri;
  } catch (error) {
    logger.warn('Avatar cache fallback to network URL', error);
    return remoteUrl;
  }
};
