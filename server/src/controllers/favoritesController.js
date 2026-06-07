import { addFavorite, getFavoritesByUser, deleteFavorite } from '../models/favoritesModel.js';

export const getFavorites = async (req, res) => {
  try {
    const favorites = await getFavoritesByUser(req.user.id);
    res.json(favorites);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const createFavorite = async (req, res) => {
  const { word, translation, language } = req.body;

  try {
    const id = await addFavorite(req.user.id, word, translation, language);
    res.status(201).json({ message: 'Favorite added', id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const removeFavorite = async (req, res) => {
  try {
    const affected = await deleteFavorite(req.params.id, req.user.id);
    if (!affected) {
      return res.status(404).json({ message: 'Favorite not found' });
    }
    res.json({ message: 'Favorite removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
