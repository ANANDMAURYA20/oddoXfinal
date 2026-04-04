/**
 * Standard API success response.
 * Usage: res.status(200).json(new ApiResponse(200, data, "Success message"))
 */
class ApiResponse {
  constructor(statusCode, data = null, message = "Success") {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }
}

module.exports = ApiResponse;
