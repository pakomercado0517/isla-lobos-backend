import { AppError } from "../lib/AppError"
import { generateAccessToken, generateRefreshToken } from "../lib/authTokens"
import { Invitacion, User } from "../models"
import bcrypt from "bcryptjs"
import { AuthServiceResponse, RegisterUserDTO } from "../types/auth.types"
import { RegisterRequest, UserRole } from "../types"
import { randomUUID } from "crypto"
import RefreshToken from "../models/RefreshToken"
import { Op } from "sequelize"
import { comparePassword, hashPassword } from "../utils/password.utils"


export const loginService = async (email: string, password: string): Promise<AuthServiceResponse> => {
  const user = await User.findOne({ where: { email: email.toLocaleLowerCase()}})

  if(!user) throw new AppError("Usuario no encontrado", 404)
  if(!user.activo) throw new AppError("Usuario no activo", 403)

  const isPasswordValid = await bcrypt.compare(password, user.password)
  if(!isPasswordValid) throw new AppError("Contraseña incorrecta", 401)

  const accessToken = generateAccessToken({
    id: user.id,
    email: user.email,
    rol: user.rol,
    nombre: user.nombre,
  })

  const refreshToken = await generateRefreshToken(user.id)

  return {
    status: "success",
    message: "Inicio de sesión exitoso",
    data: {
      user: user.toJSON(),
      accessToken,
      refreshToken,
    }
  }
}

export const registerService = async (data: RegisterRequest): Promise<AuthServiceResponse> => {
  const { nombre, email, password, telefono, avatar_url, codigo_invitacion } = data

  const existingUser = await User.findOne({ where: { email: email.toLocaleLowerCase()}})
  if(existingUser) throw new AppError("El email ya está en uso", 409)

  let rol = UserRole.PRESTADOR
  if(codigo_invitacion) {
    const invitacion = await Invitacion.findOne({ where: { codigo: codigo_invitacion}})
    if(!invitacion) throw new AppError("Código de invitación inválido", 400)
    if(invitacion.usada) throw new AppError("Código de invitación ya utilizado", 400)
    if(invitacion.esta_expirada) throw new AppError("Código de invitación expirado", 400)
    rol = invitacion.rol
    await invitacion.update({ usada: true })
  }
  const saltRounds = 12
  const hashedPassword = await bcrypt.hash(password, saltRounds)

  const userData: RegisterUserDTO = {
    id: randomUUID(),
    nombre: nombre.trim(),
    email: email.toLocaleLowerCase().trim(),
    password: hashedPassword,
    rol,
    activo: true,
  }

  if(telefono?.trim()) userData.telefono = telefono.trim()
  if(avatar_url?.trim()) userData.avatar_url = avatar_url.trim()

  const newUser = await User.create(userData)

  const accessToken = generateAccessToken({
    id: newUser.id,
    email: newUser.email,
    rol: newUser.rol,
    nombre: newUser.nombre,
  })

  const refreshToken = await generateRefreshToken(newUser.id)

  return {
    status: "success",
    message: "Usuario registrado exitosamente",
    data: {
      user: newUser.toJSON(),
      accessToken,
      refreshToken
    }
  }
}

export const verifyTokenService = async (userId: string): Promise<AuthServiceResponse> => {
  //recuerda poner en el controller (user.id)
  const user = await User.findByPk(userId)
  if(!user || !user.activo) throw new AppError("Usuario no encontrado o inactivo", 401)

  return {
    status: "success",
    message: "Token válido",
    data: {
      user: user.toJSON()
    }
  }
}

export const refreshTokenService = async (refreshToken: string) => {
  const tokenDoc = await RefreshToken.findOne({ where: {
    token: refreshToken,
    isRevoked: false,
    expiresAt: {
      [Op.gt]: new Date(),
    }
  },
  include: [
    {model: User, as: "user"}
  ]
})
  if(!tokenDoc || !tokenDoc.user || !tokenDoc.user.activo) throw new AppError('Refresh Token inválido o expirado', 401)
  
  const accessToken = generateAccessToken({
    id: tokenDoc.user.id,
    email: tokenDoc.user.email,
    rol: tokenDoc.user.rol,
    nombre: tokenDoc.user.nombre,
  })

  return {
    status: "success",
    message: "Token renovado exitosamente",
    data: {
      accessToken,
    }
  }
}

export const logoutService = async (refreshToken: string): Promise<AuthServiceResponse> => {
  await RefreshToken.update(
    { isRevoked: true },
    {
      where: {
        token: refreshToken,
        isRevoked: false
      }
    }
  )

  return {
    status: "success",
    message: "Sesión cerrada exitosamente"
  }
}

export const changePasswordService = async (userId: string, currentPassword: string, newPassword: string): Promise<AuthServiceResponse> => {
  const user = await User.findByPk(userId)
  if(!user) throw new AppError("Usuario no encontrado", 404)

  const isCurrentPasswordValid = await comparePassword(currentPassword, user.password)
  if(!isCurrentPasswordValid) throw new AppError("Contraseña actual incorrecta", 401)

  const hashedNewPassword = await hashPassword(newPassword)

  await user.update({ password: hashedNewPassword})

  return {
    status:"success",
    message: "Contraseña actualizada exitosamente"
  }
}