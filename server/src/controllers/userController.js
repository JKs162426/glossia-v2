import {
  updateTargetLanguage,
  findUserWithLanguage,
} from "../models/userModel.js";

export const getMe = async (req, res) => {
  try {
    const user = await findUserWithLanguage(req.user.id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const setLanguage = async (req, res) => {
  const { language } = req.body;

  if (!language) {
    return res.status(400).json({ message: "Language is required" });
  }

  try {
    await updateTargetLanguage(req.user.id, language);
    res.json({ message: "Language updated", language });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
