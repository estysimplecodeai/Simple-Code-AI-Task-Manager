const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");
const request = require("supertest");
const { buildApp } = require("../src/app");

let mongod;

async function setupDb() {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}

async function teardownDb() {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}

async function clearDb() {
  const { collections } = mongoose.connection;
  for (const key of Object.keys(collections)) await collections[key].deleteMany({});
}

function api() {
  return request(buildApp());
}

// Returns { token, user }. Creates the user directly via the model.
async function makeUser({ role = "developer", email, name = "Test User", password = "pw123456" } = {}) {
  const User = require("../src/models/User");
  const { hash } = require("../src/lib/password");
  const u = await User.create({
    name, email: email || `${role}_${Date.now()}@test.com`,
    role, status: "active", passwordHash: await hash(password),
  });
  const { signJwt } = require("../src/lib/token");
  return { user: u, token: signJwt({ sub: u.id, role: u.role }) };
}

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

module.exports = { setupDb, teardownDb, clearDb, api, makeUser, auth };
