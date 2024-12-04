/**
 * Validates the request body and headers for required keys and non-empty values.
 *
 * @param {object} req The Express request object.
 * @param {object} res The Express response object.
 * @returns {boolean} True if validation passes, false otherwise.  Sends error response if validation fails.
 */
function validateRequest(req, res) {
  const requiredBodyKeys = ['filter', 'filter.name', 'filter.startTime', 'filter.endTime'];
  const requiredHeaderKeys = ['projectid', 'env', 'access-token'];

  // Validate request body
  for (const key of requiredBodyKeys) {
    const value = key.split('.').reduce((obj, i) => obj && obj[i], req.body);
    if (!value || value.toString().trim() === '') {
      return sendErrorResponse(res, `Request body key '${key}' is missing or empty.`);
    }
  }

  // Validate request headers
  for (const key of requiredHeaderKeys) {
    const value = req.header(key);
    if (!value || value.toString().trim() === '') {
      return sendErrorResponse(res, `Request header '${key}' is missing or empty.`);
    }
  }

  // Validate date/time format
  const startTime = req.body.filter.startTime;
  const endTime = req.body.filter.endTime;
  const dateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

  if (!dateTimeRegex.test(startTime)) {
    return sendErrorResponse(res, `Invalid 'startTime' format. Please use YYYY-MM-DDTHH:mm format.`);
  }
  if (!dateTimeRegex.test(endTime)) {
    return sendErrorResponse(res, `Invalid 'endTime' format. Please use YYYY-MM-DDTHH:mm format.`);
  }

  return true;
}

/**
 * Sends a standardized error response.
 *
 * @param {object} res The Express response object.
 * @param {string} message The error message.
 */
function sendErrorResponse(res, message) {
  res.status(400).json({ error: message });
  return false;
}

module.exports = { validateRequest };
