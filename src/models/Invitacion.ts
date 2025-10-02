import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import { UserRole } from "../types";
import { getCurrentMexicoTime } from "../utils/dateUtils";

// Atributos requeridos para crear una invitación
interface InvitacionAttributes {
  id: string;
  codigo: string;
  email: string | null;
  rol: UserRole;
  expira_en: Date;
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
  public expira_en!: Date;
  public usada!: boolean;
  public creada_por!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Métodos de instancia
  public get esta_expirada(): boolean {
    return getCurrentMexicoTime() > this.expira_en;
  }

  public get es_valida(): boolean {
    return !this.usada && !this.esta_expirada;
  }

  public get dias_restantes(): number {
    const now = getCurrentMexicoTime();
    const diffMs = this.expira_en.getTime() - now.getTime();
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
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
      comment:
        "Fecha de expiración en zona horaria de México (America/Mexico_City)",
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
