import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import { UserRole } from "../types";

// Estados de permiso
export enum EstadoPermiso {
  VIGENTE = "vigente",
  POR_VENCER = "por_vencer",
  VENCIDO = "vencido",
  SUSPENDIDO = "suspendido",
}

// Atributos requeridos para crear un usuario
interface UserAttributes {
  id: string;
  nombre: string;
  email: string;
  password: string;
  telefono?: string;
  rol: UserRole;
  activo: boolean;
  // Campos de vigencia de permisos
  fechaVencimientoPermiso?: Date;
  estadoPermiso: EstadoPermiso;
  diasNotificacion: number;
  ultimaNotificacion?: Date;
  motivoSuspension?: string;
  // Campos de recuperación de contraseña
  passwordResetToken?: string | null;
  passwordResetExpires?: Date | null;
}

// Atributos opcionales (para actualizaciones)
interface UserCreationAttributes
  extends Optional<
    UserAttributes,
    | "id"
    | "telefono"
    | "activo"
    | "fechaVencimientoPermiso"
    | "estadoPermiso"
    | "diasNotificacion"
    | "ultimaNotificacion"
    | "motivoSuspension"
    | "passwordResetToken"
    | "passwordResetExpires"
  > {}

class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: string;
  public nombre!: string;
  public email!: string;
  public password!: string;
  public telefono?: string;
  public rol!: UserRole;
  public activo!: boolean;
  // Campos de vigencia de permisos
  public fechaVencimientoPermiso?: Date;
  public estadoPermiso!: EstadoPermiso;
  public diasNotificacion!: number;
  public ultimaNotificacion?: Date;
  public motivoSuspension?: string;
  // Campos de recuperación de contraseña
  public passwordResetToken?: string | null;
  public passwordResetExpires?: Date | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Métodos de instancia
  public override toJSON() {
    const values = Object.assign({}, this.get());
    if ("password" in values) {
      delete (values as any).password; // No incluir password en JSON
    }
    return values;
  }

  // Método para verificar si el permiso está próximo a vencer
  public isPermisoPorVencer(): boolean {
    if (!this.fechaVencimientoPermiso) return false;
    const hoy = new Date();
    const diasRestantes = Math.ceil(
      (this.fechaVencimientoPermiso.getTime() - hoy.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return diasRestantes <= this.diasNotificacion && diasRestantes > 0;
  }

  // Método para verificar si el permiso está vencido
  public isPermisoVencido(): boolean {
    if (!this.fechaVencimientoPermiso) return false;
    return new Date() > this.fechaVencimientoPermiso;
  }

  // Método para obtener días restantes del permiso
  public getDiasRestantesPermiso(): number | null {
    if (!this.fechaVencimientoPermiso) return null;
    const hoy = new Date();
    return Math.ceil(
      (this.fechaVencimientoPermiso.getTime() - hoy.getTime()) /
        (1000 * 60 * 60 * 24)
    );
  }

  // Método para actualizar estado del permiso
  public async actualizarEstadoPermiso(): Promise<void> {
    if (!this.fechaVencimientoPermiso) {
      this.estadoPermiso = EstadoPermiso.VIGENTE;
      return;
    }

    if (this.isPermisoVencido()) {
      this.estadoPermiso = EstadoPermiso.VENCIDO;
    } else if (this.isPermisoPorVencer()) {
      this.estadoPermiso = EstadoPermiso.POR_VENCER;
    } else {
      this.estadoPermiso = EstadoPermiso.VIGENTE;
    }

    await this.save();
  }

  // Método para verificar si el token de recuperación es válido
  public isPasswordResetTokenValid(): boolean {
    if (!this.passwordResetToken || !this.passwordResetExpires) {
      return false;
    }
    return new Date() < this.passwordResetExpires;
  }

  // Método para limpiar el token de recuperación
  public async clearPasswordResetToken(): Promise<void> {
    this.passwordResetToken = null;
    this.passwordResetExpires = null;
    await this.save();
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100],
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [6, 255],
      },
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        is: /^[\+]?[1-9][\d]{0,15}$/,
      },
    },
    rol: {
      type: DataTypes.ENUM(...Object.values(UserRole)),
      allowNull: false,
      defaultValue: UserRole.PRESTADOR,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    // Campos de vigencia de permisos
    fechaVencimientoPermiso: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Fecha de vencimiento del permiso de operación",
    },
    estadoPermiso: {
      type: DataTypes.ENUM(...Object.values(EstadoPermiso)),
      allowNull: false,
      defaultValue: EstadoPermiso.VIGENTE,
      comment: "Estado actual del permiso",
    },
    diasNotificacion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
      validate: {
        min: 1,
        max: 365,
      },
      comment: "Días antes del vencimiento para enviar notificaciones",
    },
    ultimaNotificacion: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Última fecha en que se envió notificación de vencimiento",
    },
    motivoSuspension: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Motivo de suspensión del permiso",
    },
    // Campos de recuperación de contraseña
    passwordResetToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Token temporal para recuperación de contraseña",
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Fecha de expiración del token de recuperación",
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["email"],
      },
    ],
  }
);

export default User;
