import { secureStorage } from '../../services/secure-storage.service';

export {
  secureStorage as sessionStorage,
  type StoredTokens as SessionTokens,
} from '../../services/secure-storage.service';

export const getSessionTokens = secureStorage.getTokens;
export const saveSessionTokens = secureStorage.saveTokens;
export const removeSessionTokens = secureStorage.clearTokens;
