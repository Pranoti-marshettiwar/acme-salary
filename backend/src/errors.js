export class AppError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
export class ValidationError extends AppError {
  constructor(details) { super(400, 'Validation failed', details); }
}
export class NotFoundError extends AppError {
  constructor(what = 'Employee') { super(404, `${what} not found`); }
}
export class ConflictError extends AppError {
  constructor(message) { super(409, message); }
}
