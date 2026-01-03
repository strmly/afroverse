import { Request, Response } from 'express';
import {
  initSelfieUpload,
  completeSelfieUpload,
  deleteSelfie,
  getUserSelfies,
  uploadSelfieProxy,
} from '../services/media.service';
import { logger } from '../utils/logger';
import { Types } from 'mongoose';
import multer from 'multer';

/**
 * Media Controller
 * 
 * HTTP handlers for selfie upload pipeline.
 */

/**
 * POST /media/selfies/init
 * 
 * Initialize selfie upload and get signed URL
 */
export async function handleInitSelfieUpload(req: Request, res: Response) {
  try {
    // Check authentication
    if (!req.userId) {
      logger.warn('Init selfie upload: No userId', {
        hasUser: !!req.user,
        headers: Object.keys(req.headers),
      });
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    }
    
    const userId = new Types.ObjectId(req.userId);
    
    // Debug logging - log the entire request
    logger.info('Init selfie upload request', {
      userId: req.userId,
      body: req.body,
      bodyType: typeof req.body,
      bodyKeys: Object.keys(req.body || {}),
      contentType: req.headers['content-type'],
    });
    
    const { mimeType } = req.body;
    
    if (!mimeType) {
      logger.warn('mimeType missing from request', {
        body: req.body,
        bodyKeys: Object.keys(req.body || {}),
      });
      return res.status(400).json({
        error: 'invalid_request',
        message: 'mimeType is required',
      });
    }
    
    const result = await initSelfieUpload(userId, mimeType);
    
    if (!result.success) {
      const statusCode = result.errorCode === 'limit_reached' ? 403 : 400;
      
      return res.status(statusCode).json({
        error: result.errorCode,
        message: result.error,
      });
    }
    
    return res.status(200).json({
      selfieId: result.selfieId,
      uploadUrl: result.uploadUrl,
      headers: result.headers,
    });
  } catch (error) {
    logger.error('Error in handleInitSelfieUpload', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to initialize upload',
    });
  }
}

/**
 * POST /media/selfies/complete
 * 
 * Complete selfie upload and activate
 */
export async function handleCompleteSelfieUpload(req: Request, res: Response) {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const { selfieId, width, height, sizeBytes } = req.body;
    
    if (!selfieId || !width || !height || !sizeBytes) {
      return res.status(400).json({
        error: 'invalid_request',
        message: 'selfieId, width, height, and sizeBytes are required',
      });
    }
    
    const result = await completeSelfieUpload(userId, selfieId, {
      width,
      height,
      sizeBytes,
    });
    
    if (!result.success) {
      const statusCode = result.errorCode === 'unauthorized' ? 403 : 
                        result.errorCode === 'not_found' ? 404 : 400;
      
      return res.status(statusCode).json({
        error: result.errorCode,
        message: result.error,
      });
    }
    
    return res.status(200).json({
      status: result.status,
      selfie: result.selfie,
    });
  } catch (error) {
    logger.error('Error in handleCompleteSelfieUpload', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to complete upload',
    });
  }
}

/**
 * GET /media/selfies
 * 
 * Get user's selfies
 */
export async function handleGetSelfies(req: Request, res: Response) {
  try {
    const userId = new Types.ObjectId(req.userId!);
    
    const selfies = await getUserSelfies(userId);
    
    return res.status(200).json({
      selfies: selfies.map((s: any) => ({
        id: s._id,
        mimeType: s.mimeType,
        width: s.width,
        height: s.height,
        sizeBytes: s.sizeBytes,
        status: s.status,
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    logger.error('Error in handleGetSelfies', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to get selfies',
    });
  }
}

/**
 * DELETE /media/selfies/:id
 * 
 * Delete selfie
 */
export async function handleDeleteSelfie(req: Request, res: Response) {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const { id } = req.params;
    
    const result = await deleteSelfie(userId, id);
    
    if (!result.success) {
      const statusCode = result.error === 'Unauthorized' ? 403 : 404;
      
      return res.status(statusCode).json({
        error: result.error === 'Unauthorized' ? 'unauthorized' : 'not_found',
        message: result.error,
      });
    }
    
    return res.status(200).json({
      message: 'Selfie deleted successfully',
    });
  } catch (error) {
    logger.error('Error in handleDeleteSelfie', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to delete selfie',
    });
  }
}

/**
 * Configure multer for file uploads
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  },
});

/**
 * Multer middleware for single file upload
 */
export const uploadMiddleware = upload.single('file');

/**
 * POST /media/selfies/upload
 * 
 * Upload selfie via proxy (server-side upload to avoid CORS)
 */
export async function handleUploadSelfie(req: Request, res: Response) {
  try {
    // Check authentication
    if (!req.userId) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required',
      });
    }

    const userId = new Types.ObjectId(req.userId);
    const file = (req as any).file;

    if (!file) {
      return res.status(400).json({
        error: 'invalid_request',
        message: 'File is required',
      });
    }

    logger.info('Proxy selfie upload request', {
      userId: req.userId,
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    });

    const result = await uploadSelfieProxy(userId, file.buffer, file.mimetype);

    if (!result.success) {
      const statusCode = result.errorCode === 'limit_reached' ? 403 :
                        result.errorCode === 'file_too_large' ? 413 : 400;

      return res.status(statusCode).json({
        error: result.errorCode,
        message: result.error,
      });
    }

    return res.status(200).json({
      selfieId: result.selfieId,
      selfie: {
        id: result.selfie._id.toString(),
        mimeType: result.selfie.mimeType,
        width: result.selfie.width,
        height: result.selfie.height,
        sizeBytes: result.selfie.sizeBytes,
        status: result.selfie.status,
        createdAt: result.selfie.createdAt,
      },
    });
  } catch (error) {
    logger.error('Error in handleUploadSelfie', error);
    return res.status(500).json({
      error: 'internal_error',
      message: 'Failed to upload selfie',
    });
  }
}

