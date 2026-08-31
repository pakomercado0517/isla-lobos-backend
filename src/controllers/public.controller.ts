import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import { getHomepageStatsService, getPuertoStatusService } from '../services/public.service';

class PublicController {
  static getHomepageStats = asyncHandler(async (_req: Request, res: Response) => {
    const response = await getHomepageStatsService();
    res.status(200).json(response);
  });

  static getPuertoStatus = asyncHandler(async (_req: Request, res: Response) => {
    const response = await getPuertoStatusService();
    res.status(200).json(response);
  });
}

export default PublicController;
