import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import { UserRole } from "../types";

// Atributos requeridos para crear una invitación
interface InvitacionAttributes {
  id: string;
  codigo: string;
  email: string | null;
  rol: UserRole;
  expira_en: string;
  usada: boolean;
  creada_por: string;
}

// Atributos opcionales (para actualizaciones)
interface InvitacionCreationAttributes
  extends Optional<InvitacionAttributes, "id" | "usada" | "email"> {}

class Invitacion
  extends Model<InvitacionAttributes, InvitacionCreationAttributes>
  implements InvitacionAttributes
{
  public id!: string;
  public codigo!: string;
  public email!: string | null;
  public rol!: UserRole;
  public expira_en!: string;
  public usada!: boolean;
  public creada_por!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Métodos de instancia
  public get esta_expirada(): boolean {
    const hoy = new Date().toISOString().split('T')[0];
    const fechaExp = typeof this.expira_en === 'string' 
      ? this.expira_en 
      : (this.expira_en as Date).toISOString().split('T')[0];
    return !!(hoy && fechaExp && fechaExp < hoy); // Comparación de strings
  }

  public get es_valida(): boolean {
    return !this.usada && !this.esta_expirada;
  }

  public get dias_restantes(): number {
    const hoy = new Date().toISOString().split('T')[0];
    const fechaExp = typeof this.expira_en === 'string' 
      ? this.expira_en 
      : (this.expira_en as Date).toISOString().split('T')[0];
    
    const hoyDate = new Date(hoy + 'T12:00:00');
    const fechaExpDate = new Date(fechaExp + 'T12:00:00');
    const diffMs = fechaExpDate.getTime() - hoyDate.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  public get es_para_conanp(): boolean {
    return this.rol === UserRole.CONANP;
  }

  public get es_para_prestador(): boolean {
    return this.rol === UserRole.PRESTADOR;
  }
}

Invitacion.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    codigo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [8, 20],
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: {
          msg: "Debe ser un email válido",
        },
      },
    },
    rol: {
      type: DataTypes.ENUM(...Object.values(UserRole)),
      allowNull: false,
    },
    expira_en: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
      get() {
        const value = this.getDataValue('expira_en');
        if (!value) return null;
        if (typeof value === 'string') return value.split('T')[0];
        const dateValue = value as Date;
        if (dateValue && typeof dateValue.toISOString === 'function') {
          return dateValue.toISOString().split('T')[0];
        }
        return String(value).split('T')[0];
      },
      comment: "Fecha de expiración en formato YYYY-MM-DD (solo fecha, sin hora)",
    },
    usada: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    creada_por: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
  },
  {
    sequelize,
    modelName: "Invitacion",
    tableName: "invitaciones",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["codigo"],
      },
      {
        fields: ["email"],
      },
      {
        fields: ["expira_en"],
      },
      {
        fields: ["usada"],
      },
    ],
  }
);

export default Invitacion;
