
import { Player, Fixture } from '../types';

const STORAGE_KEY = 'pgd_fc26_local_data';

export const saveLocalData = (players: Player[], fixtures: Fixture[]) => {
  try {
    const data = JSON.stringify({ players, fixtures });
    localStorage.setItem(STORAGE_KEY, data);
  } catch (error) {
    console.error('Failed to save to local storage', error);
  }
};

export const getLocalData = (): { players: Player[], fixtures: Fixture[] } | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to parse local storage data', error);
    return null;
  }
};
