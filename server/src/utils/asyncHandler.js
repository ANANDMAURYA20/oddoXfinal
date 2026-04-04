/**
 * Wraps an async controller function so you never need try/catch.
 * Any thrown error is automatically passed to next() → errorHandler.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
