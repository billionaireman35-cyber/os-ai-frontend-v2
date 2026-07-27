import { api } from './api';

let tokenCache = {};

export const fetchTokens = async (chain = 'polygon') => {
  if (tokenCache[chain]) return tokenCache[chain];
  try {
    const res = await api.get(`/tokens/tokens?chain=${chain}`);
    tokenCache[chain] = res.data;
    return res.data;
  } catch (e) {
    console.error('Failed to fetch tokens:', e);
    return [];
  }
};
