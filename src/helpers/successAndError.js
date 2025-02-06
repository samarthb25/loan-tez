const errorResponse = (status, message, error = null) => ({
  status,
  success: false,
  message,
  error,
});

const successResponse = (status, message, data = null) => ({
  status,
  success: true,
  message,
  data,
});

export { successResponse, errorResponse };
