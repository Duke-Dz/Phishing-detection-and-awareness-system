const { param } = require("express-validator");

const uuidParam = (name) =>
  param(name)
    .isUUID()
    .withMessage(`${name} must be a valid UUID`);

const filenameParam = (name = "filename") =>
  param(name)
    .trim()
    .matches(/^[a-f0-9-]+\.(jpg|jpeg|png|webp|pdf|eml)$/i)
    .withMessage(`${name} is invalid`);

module.exports = { filenameParam, uuidParam };
