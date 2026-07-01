/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Detect if running in browser
const isBrowser = typeof window !== 'undefined';

const getBoxConfig = () => {
  if (isBrowser) {
    const customClientId = localStorage.getItem('pensieve_box_clientId');
    const customClientSecret = localStorage.getItem('pensieve_box_clientSecret');
    const customDevToken = localStorage.getItem('pensieve_box_devToken');

    // If custom config exists, use it
    if (customClientId && customClientSecret) {
      return {
        clientId: customClientId,
        clientSecret: customClientSecret,
        devToken: customDevToken || undefined
      };
    }
  }
  
  // Fallback to hardcoded config if environment variables aren't available
  return {
    clientId: "9q7or5yfai3213t1qsq426llq8gaxs1g",
    clientSecret: "eDUmEpjXTboXUmfMGnhxnFMoqeLkSw5V",
    devToken: "j1DlOYCh6lgwbPMWdRqHtA4U5vP643gA"
  };
};

export const boxConfig = getBoxConfig();

// Helper function to set custom config (for settings modal)
export const setBoxConfig = (clientId: string, clientSecret: string, devToken?: string) => {
  if (isBrowser) {
    localStorage.setItem('pensieve_box_clientId', clientId);
    localStorage.setItem('pensieve_box_clientSecret', clientSecret);
    if (devToken) {
      localStorage.setItem('pensieve_box_devToken', devToken);
    }
  }
};

// Helper function to clear custom config
export const clearBoxConfig = () => {
  if (isBrowser) {
    localStorage.removeItem('pensieve_box_clientId');
    localStorage.removeItem('pensieve_box_clientSecret');
    localStorage.removeItem('pensieve_box_devToken');
  }
};
