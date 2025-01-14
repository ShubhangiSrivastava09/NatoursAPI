class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message); //calling the parent class constructor with message as argument to set the message property of the object
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default ErrorHandler;
