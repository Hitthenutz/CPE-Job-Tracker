class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

function badRequest(message) {
  return new HttpError(400, message);
}

module.exports = { HttpError, badRequest };
