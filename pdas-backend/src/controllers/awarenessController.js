const { AwarenessContent } = require("../models");
const { createError, requireFields } = require("../utils/validators");
const { buildPaginationMeta, getPagination } = require("../utils/pagination");

const listAwarenessContent = async (req, res) => {
  const pagination = getPagination(req.query);
  const where = ["admin", "analyst"].includes(req.user?.role)
    ? {}
    : { is_published: true };

  const { count, rows: lessons } = await AwarenessContent.findAndCountAll({
    where,
    order: [
      ["category", "ASC"],
      ["difficulty", "ASC"],
      ["created_at", "DESC"],
    ],
    limit: pagination.limit,
    offset: pagination.offset,
  });

  res.json({
    success: true,
    count: lessons.length,
    pagination: buildPaginationMeta({ count, ...pagination }),
    data: lessons,
  });
};

const getAwarenessContent = async (req, res) => {
  const lesson = await AwarenessContent.findByPk(req.params.contentId);
  if (!lesson) {
    throw createError("Awareness content not found", 404);
  }

  if (!lesson.is_published && !["admin", "analyst"].includes(req.user.role)) {
    throw createError("This lesson is not published", 403);
  }

  res.json({
    success: true,
    data: lesson,
  });
};

const createAwarenessContent = async (req, res) => {
  requireFields(req.body, ["title", "category", "description"]);

  const lesson = await AwarenessContent.create({
    title: req.body.title,
    category: req.body.category,
    description: req.body.description,
    body: req.body.body || null,
    difficulty: req.body.difficulty || "beginner",
    duration_minutes: req.body.duration_minutes || 5,
    is_published: Boolean(req.body.is_published),
    created_by: req.user.user_id,
  });

  res.status(201).json({
    success: true,
    data: lesson,
  });
};

const updateAwarenessContent = async (req, res) => {
  const lesson = await AwarenessContent.findByPk(req.params.contentId);
  if (!lesson) {
    throw createError("Awareness content not found", 404);
  }

  await lesson.update(req.body);

  res.json({
    success: true,
    data: lesson,
  });
};

const deleteAwarenessContent = async (req, res) => {
  const lesson = await AwarenessContent.findByPk(req.params.contentId);
  if (!lesson) {
    throw createError("Awareness content not found", 404);
  }

  await lesson.destroy();

  res.json({
    success: true,
    message: "Awareness content deleted",
  });
};

module.exports = {
  listAwarenessContent,
  getAwarenessContent,
  createAwarenessContent,
  updateAwarenessContent,
  deleteAwarenessContent,
};
