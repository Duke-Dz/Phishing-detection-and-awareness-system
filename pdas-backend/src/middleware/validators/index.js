const validate = require("./validate");
<<<<<<< HEAD
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
=======
const { registerValidator, loginValidator, refreshValidator, mfaCodeValidator } = require("./authValidators");
>>>>>>> d4e7d0431a4ad3c2532f837939f478298ab505bf
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
<<<<<<< HEAD
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
  verifyEmailValidator,
  resendVerificationValidator,
=======
>>>>>>> d4e7d0431a4ad3c2532f837939f478298ab505bf
  urlScanValidator,
  contentScanValidator,
  createReportValidator,
  updateReportStatusValidator,
  updateUserValidator,
  createThreatIntelValidator,
  createAwarenessValidator,
  updateAwarenessValidator,
};
