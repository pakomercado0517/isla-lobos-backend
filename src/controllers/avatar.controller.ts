import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import {
  deleteAvatarService,
  generateDefaultAvatarService,
  getAvatarInfoService,
  getCloudinaryStatsService,
  uploadAvatarService,
} from '../services/avatar.service';
import { AppError } from '../lib/AppError';

export class AvatarController {
  static uploadAvatar = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) throw new AppError('No se ha subido ningún archivo', 400);

    const response = await uploadAvatarService(req.user!.id, req.file);
    res.status(201).json(response);
  });

  static deleteAvatar = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await deleteAvatarService(req.user!.id);
    res.status(200).json(response);
  });

  static generateDefaultAvatar = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { backgroundColor, textColor } = req.body;
    const response = await generateDefaultAvatarService(req.user!.id, backgroundColor, textColor);
    res.status(201).json(response);
  });

  static getAvatarInfo = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await getAvatarInfoService(req.user!.id);
    res.status(200).json(response);
  });

  static getCloudinaryStats = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const response = await getCloudinaryStatsService();
    res.status(200).json(response);
  });
}

export default AvatarController;
