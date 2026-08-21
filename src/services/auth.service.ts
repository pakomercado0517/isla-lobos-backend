import { AppError } from "../lib/AppError"
import { generateAccessToken, generateRefreshToken } from "../lib/authTokens"
import { Invitacion, User } from "../models"
import bcrypt from "bcryptjs"
import {  AuthServiceResponse, RegisterUserDTO, UserBase } from "../types/auth.types"
import { RegisterRequest, UserRole } from "../types"
import { randomUUID } from "crypto"


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