import http from "@/utils/http.js";
import { v4 as uuidv4 } from 'uuid';
import { useUserStore } from "@/store/modules/user";
import { message } from 'ant-design-vue';
import { useRouter } from 'vue-router';

const userStore = useUserStore();
const router = useRouter();

// Security configurations
const SECURITY = {
  PASSWORD_MIN_LENGTH: 12,
  PASSWORD_RETRY_LIMIT: 5,
  PASSWORD_LOCKOUT_TIME: 15 * 60 * 1000, // 15 minutes
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes
};

class EnhancedAuth {
  constructor() {
    this.retryCount = 0;
    this.lockoutUntil = 0;
    this.refreshTokenTimeout = null;
  }

  // Enhanced login with rate limiting and security features
  async login(credentials) {
    try {
      // Check if account is temporarily locked
      if (this.isAccountLocked()) {
        const remainingTime = Math.ceil((this.lockoutUntil - Date.now()) / 60000);
        throw new Error(`Too many failed attempts. Please try again in ${remainingTime} minutes.`);
      }

      // Basic validation
      if (!this.validateCredentials(credentials)) {
        this.handleFailedAttempt();
        throw new Error('Invalid credentials format');
      }

      // Prepare request with device fingerprint
      const deviceId = this.getDeviceId();
      const requestData = {
        ...credentials,
        deviceId,
        deviceInfo: this.getDeviceInfo(),
      };

      // Call login API
      const response = await http.post('/api/v2/auth/login', requestData);
      
      if (response.data?.access_token) {
        this.handleSuccessfulLogin(response.data);
        return response.data;
      }

      throw new Error('Authentication failed');
    } catch (error) {
      this.handleFailedAttempt();
      throw this.handleError(error);
    }
  }

  // Enhanced registration with security checks
  async register(userData) {
    try {
      if (!this.validateRegistration(userData)) {
        throw new Error('Invalid registration data');
      }

      // Add security metadata
      const registrationData = {
        ...userData,
        ipAddress: this.getClientIP(),
        userAgent: navigator.userAgent,
        registrationDate: new Date().toISOString(),
      };

      const response = await http.post('/api/v2/auth/register', registrationData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Token management
  setAuthTokens(tokens) {
    if (tokens?.access_token) {
      localStorage.setItem('access_token', tokens.access_token);
      
      if (tokens.refresh_token) {
        localStorage.setItem('refresh_token', tokens.refresh_token);
        this.startTokenRefresh(tokens.expires_in || 3600);
      }
      
      if (tokens.user) {
        userStore.setUser(tokens.user);
      }
    }
  }

  // Token refresh logic
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) throw new Error('No refresh token available');

      const response = await http.post('/api/v2/auth/refresh-token', {
        refresh_token: refreshToken,
        deviceId: this.getDeviceId(),
      });

      this.setAuthTokens(response.data);
      return response.data;
    } catch (error) {
      this.logout();
      throw error;
    }
  }

  // Logout with cleanup
  logout() {
    // Clear tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    // Clear user data
    userStore.clearUser();
    
    // Clear refresh timer
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }
    
    // Redirect to login
    router.push('/login');
  }

  // Helper methods
  isAccountLocked() {
    return this.lockoutUntil > Date.now();
  }

  validateCredentials(credentials) {
    const { email, password } = credentials;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    return email && 
           password && 
           password.length >= SECURITY.PASSWORD_MIN_LENGTH &&
           emailRegex.test(email);
  }

  validateRegistration(userData) {
    const { email, password, name } = userData;
    return this.validateCredentials({ email, password }) && name && name.length >= 2;
  }

  handleSuccessfulLogin(authData) {
    // Reset security counters
    this.retryCount = 0;
    this.lockoutUntil = 0;
    
    // Set auth tokens
    this.setAuthTokens(authData);
    
    // Log login event
    this.logSecurityEvent('login_success', {
      userId: authData.user?.id,
      timestamp: new Date().toISOString(),
    });
  }

  handleFailedAttempt() {
    this.retryCount++;
    
    if (this.retryCount >= SECURITY.PASSWORD_RETRY_LIMIT) {
      this.lockoutUntil = Date.now() + SECURITY.PASSWORD_LOCKOUT_TIME;
      message.error(`Account temporarily locked. Please try again in ${SECURITY.PASSWORD_LOCKOUT_TIME / 60000} minutes.`);
    } else {
      message.warning(`Invalid credentials. ${SECURITY.PASSWORD_RETRY_LIMIT - this.retryCount} attempts remaining.`);
    }
  }

  startTokenRefresh(expiresIn) {
    // Set a timeout to refresh the token before it expires
    const refreshThreshold = expiresIn > SECURITY.TOKEN_REFRESH_THRESHOLD 
      ? expiresIn - SECURITY.TOKEN_REFRESH_THRESHOLD 
      : expiresIn * 0.8;
    
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
    }
    
    this.refreshTokenTimeout = setTimeout(() => {
      this.refreshToken().catch(error => {
        console.error('Token refresh failed:', error);
        this.logout();
      });
    }, refreshThreshold);
  }

  // Utility methods
  getDeviceId() {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = uuidv4();
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  }

  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  getClientIP() {
    // In a real app, this would be set by your backend
    return '';
  }

  logSecurityEvent(eventType, data) {
    // In a real app, send this to your logging service
    console.log(`[Security Event] ${eventType}`, data);
  }

  handleError(error) {
    console.error('Auth Error:', error);
    
    if (error.response) {
      // Handle HTTP errors
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          return new Error('Invalid credentials. Please try again.');
        case 403:
          return new Error('Access denied. Please contact support.');
        case 429:
          return new Error('Too many requests. Please try again later.');
        default:
          return new Error(data?.message || 'An error occurred. Please try again.');
      }
    }
    
    return error;
  }
}

export const authService = new EnhancedAuth();
export default authService;
