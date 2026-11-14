import {
  addFavorite,
  findFavorite,
  getFavoritesByUser,
  deleteFavorite,
} from "../models/favoritesModel.js";

export const getFavorites = async (req, res) => {
  res.json(await getFavoritesByUser(req.user.id, req.query.language));
};

export const createFavorite = async (req, res) => {
  const { word, translation, language } = req.body;

  const existing = await findFavorite(req.user.id, word, language);
  if (existing) {
    return res
      .status(409)
      .json({ message: "Already in your favorites", id: existing.id });
  }

  let id;
  try {
    id = await addFavorite(req.user.id, word, translation, language);
  } catch (err) {
    // Saved twice at once (a double click): the unique key keeps one.
    if (err.code !== "ER_DUP_ENTRY") throw err;
    const saved = await findFavorite(req.user.id, word, language);
    return res.status(409).json({ message: "Already in your favorites", id: saved?.id });
  }
  res.status(201).json({ id, word, translation, language });
};

export const removeFavorite = async (req, res) => {
  const affected = await deleteFavorite(req.params.id, req.user.id);
  if (!affected) {
    return res.status(404).json({ message: "Favorite not found" });
  }
  res.json({ message: "Favorite removed" });
};
