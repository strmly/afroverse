import { Router } from 'express';
import {
  handleInitSelfieUpload,
  handleCompleteSelfieUpload,
  handleGetSelfies,
  handleDeleteSelfie,
  handleUploadSelfie,
  uploadMiddleware,
} from '../controllers/media.controller';
import { requireAuth } from '../middleware/auth.middleware';

/**
 * Media Routes
 * 
 * /media/*
 */

const router = Router();

// All media routes require authentication
router.use(requireAuth);

// Selfie upload pipeline
router.post('/selfies/init', handleInitSelfieUpload);
router.post('/selfies/complete', handleCompleteSelfieUpload);
router.post('/selfies/upload', uploadMiddleware, handleUploadSelfie); // Proxy upload endpoint
router.get('/selfies', handleGetSelfies);
router.delete('/selfies/:id', handleDeleteSelfie);

export default router;





