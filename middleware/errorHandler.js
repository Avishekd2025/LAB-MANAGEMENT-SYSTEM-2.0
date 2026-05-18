const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.message.includes('Duplicate entry')) {
    return res.status(400).json({ message: 'Email already exists' });
  }

  if (err.message.includes('equipment is already booked')) {
    return res.status(409).json({ message: 'Equipment already booked for this time slot' });
  }

  res.status(err.status || 500).json({
    message: err.message || 'Internal server error'
  });
};

module.exports = errorHandler;
