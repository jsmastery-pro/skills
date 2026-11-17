'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { findUser, notesFor } = require('./users');

test('a valid account signs in', () => {
  assert.equal(findUser('demo@example.com', 'demo-password')?.email, 'demo@example.com');
});

test('a wrong password is rejected', () => {
  assert.equal(findUser('demo@example.com', 'nope'), null);
});

test('a person only gets their own notes', () => {
  assert.deepEqual(notesFor('demo@example.com'), ['Buy milk', 'Call the bank']);
});
