const sqlite3 = require('sqlite3').verbose();

class Database {
  constructor(filepath) {
    this.filepath = filepath;
    this.db = null;
  }

  /**
   * Initialize database connection and create tables
   */
  async initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.filepath, (err) => {
        if (err) {
          reject(err);
          return;
        }

        // Create tables
        this.db.serialize(() => {
          // Users table
          this.db.run(`
            CREATE TABLE IF NOT EXISTS users (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              username TEXT UNIQUE NOT NULL,
              email TEXT UNIQUE NOT NULL,
              password_hash TEXT NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              two_fa_enabled BOOLEAN DEFAULT 0,
              two_fa_secret TEXT,
              last_login DATETIME
            )
          `, (err) => {
            if (err) {
              console.error('Error creating users table:', err);
              reject(err);
              return;
            }
            console.log('✓ Users table initialized');
          });

          // Create index for faster lookups
          this.db.run(`
            CREATE INDEX IF NOT EXISTS idx_username ON users(username)
          `);

          this.db.run(`
            CREATE INDEX IF NOT EXISTS idx_email ON users(email)
          `, (err) => {
            if (err) {
              reject(err);
            } else {
              console.log('✓ Database indexes created');
              resolve();
            }
          });
        });
      });
    });
  }

  /**
   * Execute parameterized query - PREVENTS SQL INJECTION
   * @param {string} sql - SQL query with ? placeholders
   * @param {array} params - Parameters to bind
   * @returns {Promise}
   */
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  /**
   * Execute parameterized query and get one row
   * @param {string} sql - SQL query with ? placeholders
   * @param {array} params - Parameters to bind
   * @returns {Promise}
   */
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * Execute parameterized query and get all rows
   * @param {string} sql - SQL query with ? placeholders
   * @param {array} params - Parameters to bind
   * @returns {Promise}
   */
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Create a new user
   * @param {string} username - Username
   * @param {string} email - Email address
   * @param {string} passwordHash - Hashed password
   * @returns {Promise<number>} - User ID
   */
  async createUser(username, email, passwordHash) {
    const result = await this.run(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, passwordHash]
    );
    return result.id;
  }

  /**
   * Find user by username - Parameterized query
   * @param {string} username - Username to search
   * @returns {Promise<object|null>} - User object or null
   */
  async findUserByUsername(username) {
    return this.get(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
  }

  /**
   * Find user by email - Parameterized query
   * @param {string} email - Email to search
   * @returns {Promise<object|null>} - User object or null
   */
  async findUserByEmail(email) {
    return this.get(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
  }

  /**
   * Get user by ID
   * @param {number} userId - User ID
   * @returns {Promise<object|null>} - User object or null
   */
  async getUserById(userId) {
    return this.get(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );
  }

  /**
   * Enable 2FA for user
   * @param {number} userId - User ID
   * @param {string} secret - 2FA secret
   */
  async enable2FA(userId, secret) {
    await this.run(
      'UPDATE users SET two_fa_enabled = 1, two_fa_secret = ? WHERE id = ?',
      [secret, userId]
    );
  }

  /**
   * Disable 2FA for user
   * @param {number} userId - User ID
   */
  async disable2FA(userId) {
    await this.run(
      'UPDATE users SET two_fa_enabled = 0, two_fa_secret = NULL WHERE id = ?',
      [userId]
    );
  }

  /**
   * Update last login timestamp
   * @param {number} userId - User ID
   */
  async updateLastLogin(userId) {
    await this.run(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [userId]
    );
  }

  /**
   * Close database connection
   */
  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = Database;
