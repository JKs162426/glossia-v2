// Express 5 forwards rejected promises here, so controllers don't need try/catch.
export const notFound = (req, res) => {
  res.status(404).json({ message: "Route not found" });
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON body" });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ message: "Request body too large" });
  }

  console.error(err);
  // Never leak internal error details (SQL, stack traces) to the client.
  res.status(err.status || 500).json({
    message: err.expose ? err.message : "Something went wrong",
  });
};
