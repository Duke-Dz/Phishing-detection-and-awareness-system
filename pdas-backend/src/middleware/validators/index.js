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
const {
  updateUserValidator,
  createThreatIntelValidator,
  updateThreatIntelValidator,
} = require("./adminValidators");
const { createAwarenessValidator, updateAwarenessValidator } = require("./awarenessValidators");
const { filenameParam, uuidParam } = require("./commonValidators");
const { updateProfileValidator } = require("./userValidators");

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
  updateThreatIntelValidator,
  createAwarenessValidator,
  updateAwarenessValidator,
  filenameParam,
  uuidParam,
  updateProfileValidator,
};
