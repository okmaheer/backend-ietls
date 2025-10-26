export const success = (res, data = null, message = "Success", code = 200) => {
  return res.status(code).json({ 
    success: true, 
    message, 
    data 
  });
};

export const error = (res, error = "Something went wrong", code = 500) => {
  const isErrorObject = error instanceof Error;
  
  const errorResponse = {
    success: false,
    message: isErrorObject ? error.message : error,
    timestamp: new Date().toISOString(),
  };

  // Show full error in development
  if (process.env.NODE_ENV === "development" && isErrorObject) {
    errorResponse.fullError = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...error
    };
  }

  // Console log for debugging
  console.error("❌ ERROR DETAILS:");
  console.error("Message:", isErrorObject ? error.message : error);
  console.error("Stack:", isErrorObject ? error.stack : "N/A");
  console.error("Full Error:", error);
  console.error("------------------------");

  return res.status(code).json(errorResponse);
};