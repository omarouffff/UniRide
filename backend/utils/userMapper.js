function toSafeUser(user) {
  if (!user) return null;
  const {
    passwordHash,
    twoFactorSecret,
    emailVerificationToken,
    passwordResetToken,
    passwordResetExpires,
    emailVerificationExpires,
    ...safe
  } = user;
  return safe;
}

module.exports = { toSafeUser };
