class AppError extends Error {
  constructor(message, statusCode) {
    super(message); // איתחול מחלקת האב לפני איתחול מאפייני הילד

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // שגיאה תפעולית

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
