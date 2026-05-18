const validator = require('validator');

function validateEmail(email) {
  return validator.isEmail(email);
}

function validateUniversityId(universityId) {
  return typeof universityId === 'string' && /^[A-Za-z0-9]{8,15}$/.test(universityId);
}

module.exports = { validateEmail, validateUniversityId };
