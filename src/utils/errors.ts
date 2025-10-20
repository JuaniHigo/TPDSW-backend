// src/utils/errors.ts

// Clase base para errores personalizados de la aplicación
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    // Mantiene el stack trace correcto para errores personalizados (solo V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    // Asegura que el nombre de la clase sea el nombre del error
    this.name = this.constructor.name;
  }
}

// Error específico para cuando no se encuentra un recurso (ej: usuario, club)
export class NotFoundError extends AppError {
  constructor(message: string = "Recurso no encontrado") {
    super(message, 404);
  }
}

// Podrías añadir otros errores aquí si los necesitas, por ejemplo:
// export class ValidationError extends AppError {
//   constructor(message: string = "Datos inválidos") {
//     super(message, 400);
//   }
// }

// export class UnauthorizedError extends AppError {
//   constructor(message: string = "No autorizado") {
//     super(message, 401);
//   }
// }

// export class ForbiddenError extends AppError {
//   constructor(message: string = "Acceso prohibido") {
//     super(message, 403);
//   }
// }
