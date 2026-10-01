import { updateTargetLanguage, findUserById } from "../models/userModel.js";
import { publicUser } from "../utils/authToken.js";

export const setLanguage = async (req, res) => {
  await updateTargetLanguage(req.user.id, req.body.language);
  const user = await findUserById(req.user.id);
  res.json({ user: publicUser(user) });
};
