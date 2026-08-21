import bcrypt from "bcryptjs"

export const hashPassword = async (password: string) => {
  const saltRounds = 12
  const hashedPassword = await bcrypt.hash(password, saltRounds)
  return hashedPassword
}

export const comparePassword = async (password: string, hashedPassword: string) => {
  const isValid = await bcrypt.compare(password, hashedPassword)
  return isValid
}