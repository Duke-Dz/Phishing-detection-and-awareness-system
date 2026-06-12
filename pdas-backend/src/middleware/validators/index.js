const validate = require("./validate");
const {
  registerValidator,
  loginValidator,
  refreshValidator,
  mfaCodeValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
  verifyEmailValidator,
  resendVerificationValidator,
} = require("./authValidators");
const { urlScanValidator, contentScanValidator } = require("./scanValidators");
const { createReportValidator, updateReportStatusValidator } = require("./reportValidators");
const { updateUserValidator, createThreatIntelValidator } = require("./adminValidators");
const { createAwarenessValidator, updateAwarenessValidator } = require("./awarenessValidators");

module.exports = {
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
  urlScanValidator,
  contentScanValidator,
  createReportValidator,
  updateReportStatusValidator,
  updateUserValidator,
  createThreatIntelValidator,
  createAwarenessValidator,
  updateAwarenessValidator,
};
