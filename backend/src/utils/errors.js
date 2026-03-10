class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado') {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Sin permisos suficientes') {
    super(message, 403);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Datos inválidos', errors = []) {
    super(message, 400);
    this.errors = errors;
  }
}

module.exports = { AppError, NotFoundError, UnauthorizedError, ForbiddenError, ValidationError };
