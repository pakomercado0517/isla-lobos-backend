import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import {
  activateUserService,
  createUserService,
  deleteUserService,
  getAllUsersService,
  getUserByIdService,
  getUserStatsService,
  hardDeleteUserService,
  updateProfileService,
  updateUserService,
} from '../services/user.service';
import {
  CreateUserDTO,
  GetUsersQuery,
  UpdateProfileDTO,
  UpdateUserDTO,
} from '../types/user.types';

class UserController {
  static getAllUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await getAllUsersService(req.query as unknown as GetUsersQuery);
    res.status(200).json(response);
  });

  static getUserById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await getUserByIdService(req.params['userId'] as string);
    res.status(200).json(response);
  });

  static createUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await createUserService(req.body as CreateUserDTO);
    res.status(201).json(response);
  });

  static updateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await updateUserService(
      req.params['userId'] as string,
      req.body as UpdateUserDTO
    );
    res.status(200).json(response);
  });

  static deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await deleteUserService(req.params['userId'] as string);
    res.status(200).json(response);
  });

  static activateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await activateUserService(req.params['userId'] as string);
    res.status(200).json(response);
  });

  static hardDeleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await hardDeleteUserService(req.params['userId'] as string);
    res.status(200).json(response);
  });

  static updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const response = await updateProfileService(req.user!.id, req.body as UpdateProfileDTO);
    res.status(200).json(response);
  });

  static getUserStats = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const response = await getUserStatsService();
    res.status(200).json(response);
  });
}

export default UserController;
