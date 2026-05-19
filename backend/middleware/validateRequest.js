const { ZodError } = require('zod');

function validateRequest(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }));
        return res.status(400).json({ message: 'Invalid request payload', issues });
      }
      next(error);
    }
  };
}

module.exports = validateRequest;