export const success = (res, data = null, message = "Success") => {
  return res.status(200).json({ success: true, message, data });
};

export const error = (res, message = "Something went wrong", code = 500) => {
  return res.status(code).json({ success: false, message });
};
