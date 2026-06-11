const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const config = require("../config");

const signJwt = (payload) => jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpires });
const verifyJwt = (token) => jwt.verify(token, config.jwtSecret);
const randomToken = () => crypto.randomBytes(24).toString("base64url");

module.exports = { signJwt, verifyJwt, randomToken };
