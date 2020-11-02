import AsyncStorage from '@react-native-community/async-storage';

const EMAIL_KEY = 'persistent_email';

export const setEmail = async (email) => {
  try {
    await AsyncStorage.setItem(EMAIL_KEY, email);
  } catch (e) {
    console.log('Error setting persistent email: ', e);
  }
};

export const getEmail = async () => {
  try {
    const email = await AsyncStorage.getItem(EMAIL_KEY);
    return email || '';
  } catch (e) {
    console.log('Error getting persistent email: ', e);
  }
};
