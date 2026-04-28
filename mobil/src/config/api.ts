import { Platform } from 'react-native';

const DEV_PORT = '5000';

/**
 * Fiziksel cihazda bilgisayarınızın LAN IP'sini yazın (örn. "192.168.1.10").
 * Boş bırakılırsa: Android emülatör → 10.0.2.2, iOS simülatör → localhost.
 */
const DEV_API_HOST_OVERRIDE = '';

export function getApiBase(): string {
  if (__DEV__) {
    const host =
      DEV_API_HOST_OVERRIDE.trim() ||
      (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');
    return `http://${host}:${DEV_PORT}`;
  }
  return 'https://your-api.example.com';
}
