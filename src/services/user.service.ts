import { col, fn, Op, WhereOptions } from 'sequelize';
import { AppError } from '../lib/AppError';
import User from '../models/User';
import { ApiResponse, UserRole } from '../types';
import {
  CreateUserDTO,
  GetUserByIdResponse,
  GetUsersQuery,
  GetUsersResponse,
  GetUserStatsResponse,
  HardDeleteUserResponse,
  UpdateProfileDTO,
  UpdateUserDTO,
  UserDTO,
  UsuariosPorActivoAgregado,
  UsuariosPorRolAgregado,
} from '../types/user.types';
import { extraerSoloFechaUTC } from '../utils/dateUtils';
import { hashPassword } from '../utils/password.utils';

const USER_EXCLUDE = ['password', 'passwordResetToken', 'passwordResetExpires'] as const;

const totalDe = <T extends { total: string | number }>(
  filas: T[],
  coincide: (item: T) => boolean
): number => Number(filas.find(coincide)?.total ?? 0);

const whereUsers = (filtros: GetUsersQuery): WhereOptions => {
  const where: WhereOptions = {};
  if (filtros.rol) where['rol'] = filtros.rol;
  if (filtros.activo !== undefined) where['activo'] = filtros.activo;
  return where;
};

const toUserDTO = (user: User): UserDTO => {
  const json = user.toJSON() as UserDTO & {
    password?: string;
    passwordResetToken?: string | null;
    passwordResetExpires?: Date | null;
  };
  delete json.password;
  delete json.passwordResetToken;
  delete json.passwordResetExpires;

  return {
    ...json,
    fechaVencimientoPermiso: extraerSoloFechaUTC(json.fechaVencimientoPermiso) ?? null,
    ultimaNotificacion: extraerSoloFechaUTC(json.ultimaNotificacion) ?? null,
  };
};

const requireUser = async (id: string): Promise<User> => {
  const user = await User.findByPk(id, {
    attributes: { exclude: [...USER_EXCLUDE] },
  });
  if (!user) throw new AppError('Usuario no encontrado', 404);
  return user;
};

const assertEmailUnico = async (email: string, excludeId?: string): Promise<void> => {
  const where: WhereOptions = { email };
  if (excludeId) where['id'] = { [Op.ne]: excludeId };

  const existente = await User.findOne({ where, attributes: ['id'] });
  if (!existente) return;

  throw new AppError(
    excludeId ? 'El email ya está registrado por otro usuario' : 'El email ya está registrado',
    409
  );
};

export const getAllUsersService = async (
  query: GetUsersQuery
): Promise<ApiResponse<GetUsersResponse>> => {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;
  const where = whereUsers(query);

  const { count, rows } = await User.findAndCountAll({
    where,
    limit,
    offset: (page - 1) * limit,
    order: [['created_at', 'DESC']],
    attributes: { exclude: [...USER_EXCLUDE] },
  });

  return {
    status: 'success',
    message: 'Usuarios obtenidos exitosamente',
    data: {
      users: rows.map(toUserDTO),
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit) || 0,
      },
    },
  };
};

export const getUserByIdService = async (
  userId: string
): Promise<ApiResponse<GetUserByIdResponse>> => {
  const user = await requireUser(userId);
  return {
    status: 'success',
    message: 'Usuario obtenido exitosamente',
    data: { user: toUserDTO(user) },
  };
};

export const createUserService = async (
  body: CreateUserDTO
): Promise<ApiResponse<GetUserByIdResponse>> => {
  await assertEmailUnico(body.email);

  const hashed = await hashPassword(body.password);
  const newUser = await User.create({
    nombre: body.nombre,
    email: body.email,
    password: hashed,
    rol: body.rol,
    activo: body.activo ?? true,
    diasNotificacion: body.diasNotificacion ?? 30,
    ...(body.telefono !== undefined ? { telefono: body.telefono } : {}),
    ...(body.fechaVencimientoPermiso
      ? { fechaVencimientoPermiso: body.fechaVencimientoPermiso }
      : {}),
  });

  const user = await requireUser(newUser.id);

  return {
    status: 'success',
    message: 'Usuario creado exitosamente',
    data: { user: toUserDTO(user) },
  };
};

export const updateUserService = async (
  userId: string,
  body: UpdateUserDTO
): Promise<ApiResponse<GetUserByIdResponse>> => {
  const user = await User.findByPk(userId);
  if (!user) throw new AppError('Usuario no encontrado', 404);

  if (body.email && body.email !== user.email) {
    await assertEmailUnico(body.email, userId);
  }

  const fechaVencimientoAnterior = user.fechaVencimientoPermiso;
  const diasNotificacionAnterior = user.diasNotificacion;

  if (body.nombre !== undefined) user.nombre = body.nombre;
  if (body.email !== undefined) user.email = body.email;
  if (body.telefono !== undefined) user.telefono = body.telefono;
  if (body.rol !== undefined) user.rol = body.rol;
  if (body.activo !== undefined) user.activo = body.activo;
  if (body.fechaVencimientoPermiso !== undefined) {
    user.fechaVencimientoPermiso = body.fechaVencimientoPermiso;
  }
  if (body.diasNotificacion !== undefined) {
    user.diasNotificacion = body.diasNotificacion;
  }

  await user.save();

  const fechaCambio =
    body.fechaVencimientoPermiso !== undefined &&
    body.fechaVencimientoPermiso !== fechaVencimientoAnterior;
  const diasCambio =
    body.diasNotificacion !== undefined && body.diasNotificacion !== diasNotificacionAnterior;

  if (fechaCambio || diasCambio) {
    await user.actualizarEstadoPermiso();
    await user.reload({ attributes: { exclude: [...USER_EXCLUDE] } });
  }

  return {
    status: 'success',
    message: 'Usuario actualizado exitosamente',
    data: { user: toUserDTO(user) },
  };
};

export const deleteUserService = async (
  userId: string
): Promise<ApiResponse<GetUserByIdResponse>> => {
  const user = await requireUser(userId);
  user.activo = false;
  await user.save();

  return {
    status: 'success',
    message: 'Usuario desactivado exitosamente',
    data: { user: toUserDTO(user) },
  };
};

export const activateUserService = async (
  userId: string
): Promise<ApiResponse<GetUserByIdResponse>> => {
  const user = await requireUser(userId);
  user.activo = true;
  await user.save();

  return {
    status: 'success',
    message: 'Usuario activado exitosamente',
    data: { user: toUserDTO(user) },
  };
};

export const hardDeleteUserService = async (
  userId: string
): Promise<ApiResponse<HardDeleteUserResponse>> => {
  const user = await requireUser(userId);
  const nombre = user.nombre;
  const email = user.email;

  await user.destroy();

  return {
    status: 'success',
    message: 'Usuario eliminado permanentemente del sistema',
    data: {
      deleted_user: {
        id: userId,
        nombre,
        email,
        eliminado_en: new Date().toISOString(),
      },
    },
  };
};

export const updateProfileService = async (
  userId: string,
  body: UpdateProfileDTO
): Promise<ApiResponse<GetUserByIdResponse>> => {
  const user = await requireUser(userId);

  if (body.nombre !== undefined) user.nombre = body.nombre;
  if (body.telefono !== undefined) user.telefono = body.telefono;
  if (body.avatar_url !== undefined) user.avatar_url = body.avatar_url;

  await user.save();

  return {
    status: 'success',
    message: 'Perfil actualizado exitosamente',
    data: { user: toUserDTO(user) },
  };
};

export const getUserStatsService = async (): Promise<ApiResponse<GetUserStatsResponse>> => {
  const [porRolRaw, porActivoRaw] = await Promise.all([
    User.findAll({
      attributes: ['rol', [fn('COUNT', col('id')), 'total']],
      group: ['rol'],
      raw: true,
    }),
    User.findAll({
      attributes: ['activo', [fn('COUNT', col('id')), 'total']],
      group: ['activo'],
      raw: true,
    }),
  ]);

  const porRol = porRolRaw as unknown as UsuariosPorRolAgregado[];
  const porActivo = porActivoRaw as unknown as UsuariosPorActivoAgregado[];
  const total = porRol.reduce((acc, fila) => acc + Number(fila.total), 0);
  const activos = totalDe(
    porActivo,
    (item) => item.activo === true || item.activo === 'true' || item.activo === 1
  );

  return {
    status: 'success',
    message: 'Estadísticas obtenidas exitosamente',
    data: {
      stats: {
        total,
        activos,
        inactivos: total - activos,
        conanp: totalDe(porRol, (item) => item.rol === UserRole.CONANP),
        prestadores: totalDe(porRol, (item) => item.rol === UserRole.PRESTADOR),
      },
    },
  };
};
