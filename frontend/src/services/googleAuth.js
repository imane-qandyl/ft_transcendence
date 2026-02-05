class GoogleAuthService {
  constructor() {
    this.clientId = null;
    this.isInitialized = false;
    this.onSuccess = null;
    this.scriptLoading = null;
  }

  async init() {
    if (this.isInitialized) return;

    await this.loadGoogleScript();

    this.clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

    if (!this.clientId) {
      throw new Error('Google Client ID missing');
    }

    if (!window.google?.accounts?.id) {
      throw new Error('Google Identity Services not available');
    }

    window.google.accounts.id.initialize({
      client_id: this.clientId,
      callback: (response) => {
        this.onSuccess?.(response.credential);
      },
    });

    this.isInitialized = true;
  }

  loadGoogleScript() {
    if (this.scriptLoading) return this.scriptLoading;

    this.scriptLoading = new Promise((resolve, reject) => {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });

    return this.scriptLoading;
  }

  onSignIn(callback) {
    this.onSuccess = callback;
  }

  renderButton(container, theme = 'outline', size = 'large') {
    if (!this.isInitialized) {
      throw new Error('Google Auth not initialized');
    }

    window.google.accounts.id.renderButton(container, {
      theme,
      size,
      width: 300,
    });
  }

  signOut() {
    window.google?.accounts?.id.disableAutoSelect();
  }
}

const googleAuthService = new GoogleAuthService();
export default googleAuthService;
