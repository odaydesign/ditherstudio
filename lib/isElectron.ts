export const isElectron = (): boolean => {
    if (typeof window === 'undefined') return false;

    // Check for the user agent set by Electron
    const userAgent = window.navigator.userAgent.toLowerCase();

    // Also check for window.process.type (renderer) or typical electron object
    // But user agent is the standard way if we don't expose node integration directly
    return userAgent.includes(' electron/');
};
