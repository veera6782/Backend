export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` })
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error)
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Please provide valid questionnaire data',
      errors: Object.values(error.errors).map((fieldError) => fieldError.message)
    })
  }

  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ message: 'Request body must be valid JSON' })
  }

  console.error(error)
  res.status(500).json({ message: 'An unexpected server error occurred' })
}
