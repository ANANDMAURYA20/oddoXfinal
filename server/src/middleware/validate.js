const ApiError = require("../utils/ApiError");

/**
 * Zod validation middleware.
 * Validates req.body, req.query, or req.params against a Zod schema.
 *
 * Usage:
 *   validate(createProductSchema)           → validates req.body
 *   validate(querySchema, "query")          → validates req.query
 */
const validate = (schema, source = "body") => {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      }));

      throw ApiError.badRequest("Validation failed", errors);
    }

    // Replace with parsed + coerced data
    req[source] = result.data;
    next();
  };
};

module.exports = validate;
