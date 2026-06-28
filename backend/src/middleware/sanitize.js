/**
 * Global input sanitization middleware.
 *
 * Strips MongoDB operators ($ne, $gt …) and removes XSS payloads from
 * req.body / req.query / req.params before any controller sees them.
 */

const mongoSanitize = require("express-mongo-sanitize");
const xssClean      = require("xss-clean");
const hpp           = require("hpp");

/**
 * Returns an array of middleware that should be mounted globally
 * in server.js BEFORE any route handlers.
 */
module.exports = function globalSanitizers() {
  return [
    // 1. Strip MongoDB query operators from body/query/params
    mongoSanitize({ replaceWith: "_" }),

    // 2. Strip HTML / script tags from user-supplied strings
    xssClean(),

    // 3. Prevent HTTP Parameter Pollution
    //    (removes duplicate query params; whitelist any intentional duplicates)
    hpp(),
  ];
};
