/**
 * Universal Secure Authentication Service
 * Uses D1 database for secure user data storage
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'mighty-agent-secret-key-change-in-production';

class UniversalAuth {
  constructor() {
    this.workerUrl = process.env.WORKER_URL || 'http://localhost:3000';
  }

  async query(sql, params = []) {
    const response = await fetch(`${this.workerUrl}/__d1/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql, params })
    });
    return await response.json();
  }

  hashPassword(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  }

  generateSalt() {
    return crypto.randomBytes(16).toString('hex');
  }

  generateToken(userId, email) {
    return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  async register(email, password, username) {
    const salt = this.generateSalt();
    const hashedPassword = this.hashPassword(password, salt);
    
    const sql = `INSERT INTO sys_user (user_email, user_password, user_salt, user_name, user_nickname, user_status, created_at) 
                 VALUES (?, ?, ?, ?, ?, 1, datetime('now'))`;
    
    try {
      await this.query(sql, [email, hashedPassword, salt, username, username]);
      return { success: true, message: 'User registered successfully' };
    } catch (error) {
      return { success: false, message: 'Email already exists' };
    }
  }

  async login(email, password) {
    const sql = `SELECT id, user_email, user_password, user_salt, user_name, user_status 
                 FROM sys_user WHERE user_email = ? AND deleted_at IS NULL`;
    
    const result = await this.query(sql, [email]);
    
    if (!result.results || result.results.length === 0) {
      return { success: false, message: 'Invalid credentials' };
    }

    const user = result.results[0];
    
    if (user.user_status !== 1) {
      return { success: false, message: 'Account disabled' };
    }

    const hashedPassword = this.hashPassword(password, user.user_salt);
    
    if (hashedPassword !== user.user_password) {
      return { success: false, message: 'Invalid credentials' };
    }

    const token = this.generateToken(user.id, user.user_email);
    
    await this.query(
      `UPDATE sys_user SET last_login_time = datetime('now') WHERE id = ?`,
      [user.id]
    );

    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.user_email,
        username: user.user_name
      }
    };
  }

  async getUserById(userId) {
    const sql = `SELECT id, user_email, user_name, avatar, points 
                 FROM sys_user WHERE id = ? AND deleted_at IS NULL`;
    
    const result = await this.query(sql, [userId]);
    return result.results?.[0] || null;
  }

  async changePassword(userId, oldPassword, newPassword) {
    const sql = `SELECT user_password, user_salt FROM sys_user WHERE id = ?`;
    const result = await this.query(sql, [userId]);
    
    if (!result.results?.[0]) {
      return { success: false, message: 'User not found' };
    }

    const user = result.results[0];
    const hashedOldPassword = this.hashPassword(oldPassword, user.user_salt);
    
    if (hashedOldPassword !== user.user_password) {
      return { success: false, message: 'Incorrect password' };
    }

    const newSalt = this.generateSalt();
    const hashedNewPassword = this.hashPassword(newPassword, newSalt);
    
    await this.query(
      `UPDATE sys_user SET user_password = ?, user_salt = ? WHERE id = ?`,
      [hashedNewPassword, newSalt, userId]
    );

    return { success: true, message: 'Password changed' };
  }
}

module.exports = UniversalAuth;
