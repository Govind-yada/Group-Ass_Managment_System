const { errorResponse } = require('../utils/apiResponse');

const validate = (schema) => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Assign parsed/sanitized values
      if (parsed.body) req.body = parsed.body;
      if (parsed.query) req.query = parsed.query;
      if (parsed.params) req.params = parsed.params;

      next();
    } catch (err) {
      if (err.errors) {
        const validationErrors = err.errors.map((e) => ({
          field: e.path.join('.').replace(/^(body|query|params)\./, ''),
          message: e.message,
        }));
        return errorResponse(res, 'Validation failed for request parameters.', 422, validationErrors);
      }
      return errorResponse(res, 'Invalid request payload.', 400);
    }
  };
};

module.exports = {
  validate,
};
