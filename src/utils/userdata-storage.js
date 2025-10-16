/**
 * User Data Storage Service
 * Separate R2 bucket for user login/profile data
 */

class UserDataStorage {
  constructor() {
    this.workerUrl = process.env.WORKER_URL || 'http://localhost:3000';
  }

  async saveUserProfile(userId, profileData) {
    const key = `users/${userId}/profile.json`;
    const response = await fetch(`${this.workerUrl}/__userdata/${key}`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
      headers: { 'Content-Type': 'application/json' }
    });
    return await response.json();
  }

  async getUserProfile(userId) {
    const key = `users/${userId}/profile.json`;
    const response = await fetch(`${this.workerUrl}/__userdata/${key}`);
    if (!response.ok) return null;
    return await response.json();
  }

  async saveLoginSession(userId, sessionData) {
    const key = `sessions/${userId}/${Date.now()}.json`;
    const response = await fetch(`${this.workerUrl}/__userdata/${key}`, {
      method: 'PUT',
      body: JSON.stringify(sessionData)
    });
    return await response.json();
  }

  async saveUserPreferences(userId, preferences) {
    const key = `users/${userId}/preferences.json`;
    const response = await fetch(`${this.workerUrl}/__userdata/${key}`, {
      method: 'PUT',
      body: JSON.stringify(preferences)
    });
    return await response.json();
  }

  async getUserPreferences(userId) {
    const key = `users/${userId}/preferences.json`;
    const response = await fetch(`${this.workerUrl}/__userdata/${key}`);
    if (!response.ok) return null;
    return await response.json();
  }

  async deleteUserData(userId) {
    const key = `users/${userId}/profile.json`;
    const response = await fetch(`${this.workerUrl}/__userdata/${key}`, {
      method: 'DELETE'
    });
    return await response.json();
  }
}

module.exports = UserDataStorage;
