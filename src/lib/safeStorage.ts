
/**
 * Safe Local Storage wrapper to handle QuotaExceededError and other potential issues.
 */

export const saveToLocalStorage = (key: string, value: any): boolean => {
  try {
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
    return true;
  } catch (error: any) {
    if (
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    ) {
      console.error(`[Storage] Quota Exceeded for key: ${key}. Local storage is full.`);
      // Optional: Trigger a custom event to show a toast or alert to the user
      window.dispatchEvent(new CustomEvent('pensieve_storage_error', { 
        detail: { 
          message: 'Local storage is full! Please connect to a cloud database (Appwrite/Firebase) to save more items with images.',
          type: 'quota'
        } 
      }));
    } else {
      console.error(`[Storage] Error saving to localStorage for key: ${key}`, error);
    }
    return false;
  }
};

export const getFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`[Storage] Error reading from localStorage for key: ${key}`, error);
    return defaultValue;
  }
};
