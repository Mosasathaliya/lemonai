<template>
  <div class="auth-container">
    <div class="auth-card">
      <!-- Logo -->
      <div class="text-center mb-8">
        <img 
          src="@/assets/images/mighty-agent-logo.svg" 
          alt="Mighty Agent" 
          class="mx-auto h-16 w-auto"
          @error="handleLogoError"
        >
        <h1 class="mt-4 text-2xl font-bold text-gray-900">Welcome to Mighty Agent</h1>
        <p class="mt-2 text-sm text-gray-600">Sign in to your account</p>
      </div>

      <!-- Social Login Buttons -->
      <div class="mt-6">
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <div class="mt-6 grid grid-cols-2 gap-3">
          <button
            @click="handleGoogleLogin"
            class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <span class="sr-only">Sign in with Google</span>
            <svg class="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
            </svg>
          </button>

          <button
            @click="handleMicrosoftLogin"
            class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <span class="sr-only">Sign in with Microsoft</span>
            <svg class="w-5 h-5" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 0H11V11H0V0Z" fill="#F25022"/>
              <path d="M12 0H23V11H12V0Z" fill="#7FBA00"/>
              <path d="M0 12H11V23H0V12Z" fill="#00A4EF"/>
              <path d="M12 12H23V23H12V12Z" fill="#FFB900"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Email/Password Form -->
      <div class="mt-8">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Email Input -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">
              Email address <span class="text-red-500">*</span>
            </label>
            <div class="mt-1">
              <input
                id="email"
                v-model="form.email"
                name="email"
                type="email"
                autocomplete="email"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                :class="{ 'border-red-500': errors.email }"
              >
              <p v-if="errors.email" class="mt-1 text-sm text-red-600">{{ errors.email }}</p>
            </div>
          </div>

          <!-- Password Input -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">
              Password <span class="text-red-500">*</span>
            </label>
            <div class="mt-1 relative">
              <input
                id="password"
                v-model="form.password"
                name="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                required
                class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10"
                :class="{ 'border-red-500': errors.password }"
              >
              <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  <svg
                    class="h-5 w-5"
                    fill="none"
                    :stroke="showPassword ? 'currentColor' : 'none'"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      v-if="!showPassword"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                    <path
                      v-else
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                </button>
              </div>
              <p v-if="errors.password" class="mt-1 text-sm text-red-600">{{ errors.password }}</p>
            </div>
          </div>

          <!-- Remember Me & Forgot Password -->
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input
                id="remember-me"
                v-model="form.rememberMe"
                name="remember-me"
                type="checkbox"
                class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              >
              <label for="remember-me" class="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div class="text-sm">
              <router-link to="/forgot-password" class="font-medium text-indigo-600 hover:text-indigo-500">
                Forgot your password?
              </router-link>
            </div>
          </div>

          <!-- Submit Button -->
          <div>
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              :class="{ 'opacity-50 cursor-not-allowed': isLoading }"
            >
              <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isLoading ? 'Signing in...' : 'Sign in' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Sign Up Link -->
      <div class="mt-6 text-center text-sm">
        <p class="text-gray-600">
          Don't have an account? 
          <router-link to="/register" class="font-medium text-indigo-600 hover:text-indigo-500">
            Sign up
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/user';
import { authService } from '@/services/enhancedAuth';
import { message } from 'ant-design-vue';

export default {
  name: 'EnhancedLogin',
  setup() {
    const router = useRouter();
    const userStore = useUserStore();
    
    const form = reactive({
      email: '',
      password: '',
      rememberMe: false,
    });
    
    const errors = reactive({});
    const isLoading = ref(false);
    const showPassword = ref(false);

    const validateForm = () => {
      let isValid = true;
      errors.email = '';
      errors.password = '';

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!form.email) {
        errors.email = 'Email is required';
        isValid = false;
      } else if (!emailRegex.test(form.email)) {
        errors.email = 'Please enter a valid email address';
        isValid = false;
      }

      // Password validation
      if (!form.password) {
        errors.password = 'Password is required';
        isValid = false;
      } else if (form.password.length < 8) {
        errors.password = 'Password must be at least 8 characters long';
        isValid = false;
      }

      return isValid;
    };

    const handleSubmit = async () => {
      if (!validateForm()) return;
      
      try {
        isLoading.value = true;
        
        const credentials = {
          email: form.email,
          password: form.password,
        };
        
        const user = await authService.login(credentials);
        
        if (form.rememberMe) {
          // Set long-lived token or cookie
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberMe');
        }
        
        // Redirect based on user role or default dashboard
        const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
        router.push(redirectPath);
        
        message.success('Successfully logged in!');
      } catch (error) {
        console.error('Login error:', error);
        message.error(error.message || 'Login failed. Please check your credentials and try again.');
      } finally {
        isLoading.value = false;
      }
    };

    const handleGoogleLogin = async () => {
      try {
        // Redirect to Google OAuth or open popup
        window.location.href = `${process.env.VUE_APP_API_URL}/api/v2/auth/google`;
      } catch (error) {
        console.error('Google login error:', error);
        message.error('Failed to login with Google');
      }
    };

    const handleMicrosoftLogin = async () => {
      try {
        // Redirect to Microsoft OAuth or open popup
        window.location.href = `${process.env.VUE_APP_API_URL}/api/v2/auth/microsoft`;
      } catch (error) {
        console.error('Microsoft login error:', error);
        message.error('Failed to login with Microsoft');
      }
    };

    const handleLogoError = (e) => {
      console.error('Failed to load logo:', e);
      // Fallback to text if logo fails to load
      const logoContainer = e.target.parentElement;
      if (logoContainer) {
        logoContainer.innerHTML = '<h1 class="text-2xl font-bold text-indigo-600">Mighty Agent</h1>';
      }
    };

    return {
      form,
      errors,
      isLoading,
      showPassword,
      handleSubmit,
      handleGoogleLogin,
      handleMicrosoftLogin,
      handleLogoError,
    };
  },
};
</script>

<style scoped>
.auth-container {
  @apply min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8;
}

.auth-card {
  @apply sm:mx-auto sm:w-full sm:max-w-md px-4 py-8 bg-white shadow sm:rounded-lg sm:px-10;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .auth-container {
    @apply px-0;
  }
  
  .auth-card {
    @apply shadow-none rounded-none border-0;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .auth-container {
    @apply bg-gray-900;
  }
  
  .auth-card {
    @apply bg-gray-800 text-white;
  }
  
  .text-gray-700, .text-gray-900 {
    @apply text-gray-200;
  }
  
  .text-gray-600 {
    @apply text-gray-400;
  }
  
  input, button {
    @apply bg-gray-700 border-gray-600 text-white;
  }
}
</style>
