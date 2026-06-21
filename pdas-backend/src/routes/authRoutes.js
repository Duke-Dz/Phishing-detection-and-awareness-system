const express = require("express");
const {
  changePassword,
  disableMfa,
  enableMfa,
  forgotPassword,
  getMe,
  login,
  logout,
  refresh,
  register,
  resendVerification,
  resetPassword,
  setupMfa,
  verifyEmail,
} = require("../controllers/authController");
const { asyncHandler } = require("../middleware/errorHandler");
const { protect } = require("../middleware/authMiddleware");
const {
  validate,
  registerValidator,
  loginValidator,
  refreshValidator,
  mfaCodeValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
  verifyEmailValidator,
  resendVerificationValidator,
} = require("../middleware/validators");

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     description: Create a new user account. The first registered user is automatically assigned the admin role. A verification email is sent upon registration.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, full_name, email, password]
 *             properties:
 *               username:
 *                 type: string
 *                 example: johndoe
 *               full_name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecureP@ss123
 *     responses:
 *       201:
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already registered
 */
router.post("/register", registerValidator, validate, asyncHandler(register));

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login to an existing account
 *     description: Authenticate with email/username and password. If MFA is enabled on the account, an mfa_code field is also required.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier, password]
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email address or username
 *               password:
 *                 type: string
 *                 format: password
 *               mfa_code:
 *                 type: string
 *                 description: Required if MFA is enabled on the account
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 data:
 *                   type: object
 *       401:
 *         description: Invalid credentials or MFA required
 *       403:
 *         description: Account disabled
 */
router.post("/login", loginValidator, validate, asyncHandler(login));

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     description: Exchange a valid refresh token for a new access token and refresh token pair (token rotation).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 data:
 *                   type: object
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post("/refresh", refreshValidator, validate, asyncHandler(refresh));

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout
 *     description: Logout the current session. Optionally revoke a specific refresh token or all tokens across devices.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Specific refresh token to revoke
 *               all_devices:
 *                 type: boolean
 *                 description: Set to true to revoke all refresh tokens
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Not authenticated
 */
router.post("/logout", protect, asyncHandler(logout));

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user profile
 *     description: Return the profile of the currently authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         description: Not authenticated
 */
router.get("/me", protect, asyncHandler(getMe));

/**
 * @swagger
 * /auth/mfa/setup:
 *   post:
 *     tags: [Auth]
 *     summary: Set up MFA
 *     description: Generate a new MFA secret for the authenticated user. Returns the secret and an otpauth URL for scanning with an authenticator app.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: MFA secret generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     secret:
 *                       type: string
 *                     otpauth_url:
 *                       type: string
 *       401:
 *         description: Not authenticated
 */
router.post("/mfa/setup", protect, asyncHandler(setupMfa));

/**
 * @swagger
 * /auth/mfa/enable:
 *   post:
 *     tags: [Auth]
 *     summary: Enable MFA
 *     description: Verify a TOTP code against the previously set up secret and enable MFA on the account.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mfa_code]
 *             properties:
 *               mfa_code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: MFA enabled
 *       400:
 *         description: MFA not set up yet
 *       401:
 *         description: Invalid MFA code or not authenticated
 */
router.post("/mfa/enable", protect, mfaCodeValidator, validate, asyncHandler(enableMfa));

/**
 * @swagger
 * /auth/mfa/disable:
 *   post:
 *     tags: [Auth]
 *     summary: Disable MFA
 *     description: Disable multi-factor authentication by verifying the current TOTP code.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mfa_code]
 *             properties:
 *               mfa_code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: MFA disabled
 *       401:
 *         description: Invalid MFA code or not authenticated
 */
router.post("/mfa/disable", protect, mfaCodeValidator, validate, asyncHandler(disableMfa));

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset
 *     description: Send a password reset link to the given email address. Always returns success to prevent email enumeration.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset email sent (if account exists)
 */
router.post("/forgot-password", forgotPasswordValidator, validate, asyncHandler(forgotPassword));

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password with token
 *     description: Reset the user's password using a valid reset token received via email. All refresh tokens are revoked afterwards.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, new_password, confirm_password]
 *             properties:
 *               token:
 *                 type: string
 *                 description: Reset token from the emailed reset link
 *               new_password:
 *                 type: string
 *                 format: password
 *               confirm_password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid, expired, or already-used token
 *       404:
 *         description: User not found
 */
router.post("/reset-password", resetPasswordValidator, validate, asyncHandler(resetPassword));

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change password
 *     description: Change the password of the currently authenticated user by providing the current password and a new password.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [current_password, new_password]
 *             properties:
 *               current_password:
 *                 type: string
 *                 format: password
 *               new_password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Current password is incorrect or not authenticated
 */
router.post("/change-password", protect, changePasswordValidator, validate, asyncHandler(changePassword));

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: Verify email address
 *     description: Verify the user's email address using the 6-digit code sent via email during registration.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp_code]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp_code:
 *                 type: string
 *                 description: 6-digit verification code
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid, expired, or already-used verification token
 *       404:
 *         description: User not found
 */
router.post("/verify-email", verifyEmailValidator, validate, asyncHandler(verifyEmail));

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     tags: [Auth]
 *     summary: Resend verification email
 *     description: Resend the email verification code. Fails if the email is already verified.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification code sent
 *       400:
 *         description: Email is already verified
 */
router.post("/resend-verification", resendVerificationValidator, validate, asyncHandler(resendVerification));

module.exports = router;
