import express from 'express';
import { getFavorites, createFavorite, removeFavorite } from '../controllers/favoritesController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getFavorites);
router.post('/', createFavorite);
router.delete('/:id', removeFavorite);

export default router;
