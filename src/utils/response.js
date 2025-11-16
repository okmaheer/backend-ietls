// utils/response.js

// Success response
export const success = (res, data = null, message = "Success", code = 200) => {
  return res.status(code).json({
    success: true,
    message,
    data
  });
};

// Error response
export const error = (res, error = "Something went wrong", code = 500) => {
  const isErrorObject = error instanceof Error;

  const errorResponse = {
    success: false,
    message: isErrorObject ? error.message : error,
    timestamp: new Date().toISOString(),
  };

  // Show full error in development only
  if (process.env.NODE_ENV === "development" && isErrorObject) {
    errorResponse.fullError = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return res.status(code).json(errorResponse);
};