const { errorResponse } = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  console.error('Unhandled Application Error:', err);

  // Handle SyntaxError in JSON body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return errorResponse(res, 'Invalid JSON body in request.', 400);
  }

  // Handle duplicate key errors from Postgres
  if (err.code === '23505') {
    return errorResponse(res, 'A record with this information already exists.', 409, {
      detail: err.detail,
    });
  }

  // Handle foreign key violation from Postgres
  if (err.code === '23503') {
    return errorResponse(res, 'Referenced record was not found.', 400, {
      detail: err.detail,
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error.';
  return errorResponse(res, message, statusCode, process.env.NODE_ENV === 'development' ? err.stack : null);
};

module.exports = {
  errorHandler,
};
