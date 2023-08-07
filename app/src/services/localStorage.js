import AsyncStorage from '@react-native-async-storage/async-storage';

const EMAIL_KEY = 'persistent_email';
const ORG_KEY = 'user_organisation';
const TEAM_KEY = 'selected_team';
const USER_KEY = 'user';

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

export const getTeam = async () => {
  try {
    const team = await AsyncStorage.getItem(TEAM_KEY);
    return team || '';
  } catch (e) {
    console.log('Error getting persistent team: ', e);
  }
};

export const setTeam = async (teamId) => {
  try {
    await AsyncStorage.setItem(TEAM_KEY, teamId);
  } catch (e) {
    console.log('Error setting persistent email: ', e);
  }
};

export const getOrg = async () => {
  try {
    const team = await AsyncStorage.getItem(ORG_KEY);
    return team || '';
  } catch (e) {
    console.log('Error getting persistent team: ', e);
  }
};

export const setOrg = async (orgId) => {
  try {
    await AsyncStorage.setItem(ORG_KEY, orgId);
  } catch (e) {
    console.log('Error setting persistent email: ', e);
  }
};

export const getUser = async () => {
  try {
    const userStr = await AsyncStorage.getItem(USER_KEY);
    return JSON.parse(userStr) || {};
  } catch (e) {
    console.log('Error getting persistent team: ', e);
  }
};

export const setUser = async (user) => {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (e) {
    console.log('Error setting persistent email: ', e);
  }
};
