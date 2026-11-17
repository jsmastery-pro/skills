'use strict';

// A fixture account store. Passwords are kept as scrypt hashes, never in clear.
const { scryptSync, randomBytes, timingSafeEqual } = require('node:crypto');

function hash(password, salt) {
  return scryptSync(password, salt, 32);
}

const users = new Map();

function addUser(email, password, notes) {
  const salt = randomBytes(16);
  users.set(email, { email, salt, hash: hash(password, salt), notes });
}

addUser('demo@example.com', 'demo-password', ['Buy milk', 'Call the bank']);
addUser('other@example.com', 'other-password', ['Private note of another person']);

function findUser(email, password) {
  const user = users.get(String(email || '').trim().toLowerCase());
  if (!user) return null;
  const candidate = hash(String(password || ''), user.salt);
  return timingSafeEqual(candidate, user.hash) ? user : null;
}

function notesFor(email) {
  return users.get(email)?.notes ?? [];
}

module.exports = { findUser, notesFor };
