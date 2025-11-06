import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import {
  TipoNotificacionDashboard,
  PrioridadNotificacionDashboard,
} from "../types";

// Atributos requeridos para crear una notificación
interface NotificacionDashboardAttributes {
  id: string;
  tipo: TipoNotificacionDashboard;
  titulo: string;
  mensaje: string;
  usuario_id: string | null;
  enlace: string | null;
  leida: boolean;
  prioridad: PrioridadNotificacionDashboard;
  metadata: Record<string, string | number | boolean | null>;
  read_at: Date | null;
}

// Atributos opcionales (para actualizaciones)
interface NotificacionDashboardCreationAttributes
  extends Optional<
    NotificacionDashboardAttributes,
    | "id"
    | "usuario_id"
    | "enlace"
    | "leida"
    | "metadata"
    | "read_at"
  > {}

class NotificacionDashboard
  extends Model<
    NotificacionDashboardAttributes,
    NotificacionDashboardCreationAttributes
  >
  implements NotificacionDashboardAttributes
{
  public id!: string;
  public tipo!: TipoNotificacionDashboard;
  public titulo!: string;
  public mensaje!: string;
  public usuario_id!: string | null;
  public enlace!: string | null;
  public leida!: boolean;
  public prioridad!: PrioridadNotificacionDashboard;
  public metadata!: Record<string, string | number | boolean | null>;
  public read_at!: Date | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

NotificacionDashboard.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tipo: {
      type: DataTypes.ENUM(...Object.values(TipoNotificacionDashboard)),
      allowNull: false,
      comment: "Tipo de notificación",
    },
    titulo: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 200],
      },
      comment: "Título de la notificación",
    },
    mensaje: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
      comment: "Mensaje de la notificación",
    },
    usuario_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      comment: "ID del usuario destinatario (null = para todos los CONANP)",
    },
    enlace: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        len: [0, 500],
      },
      comment: "URL relativa para navegar a la acción relacionada",
    },
    leida: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "Indica si la notificación ha sido leída",
    },
    prioridad: {
      type: DataTypes.ENUM(...Object.values(PrioridadNotificacionDashboard)),
      allowNull: false,
      defaultValue: PrioridadNotificacionDashboard.MEDIA,
      comment: "Prioridad de la notificación",
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
      comment: "Datos adicionales de la notificación (embarcacion_id, etc.)",
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Fecha y hora en que se marcó como leída",
    },
  },
  {
    sequelize,
    modelName: "NotificacionDashboard",
    tableName: "notificaciones_dashboard",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ["usuario_id"],
        name: "idx_notificaciones_usuario_id",
      },
      {
        fields: ["leida"],
        name: "idx_notificaciones_leida",
      },
      {
        fields: ["tipo"],
        name: "idx_notificaciones_tipo",
      },
      {
        fields: ["prioridad"],
        name: "idx_notificaciones_prioridad",
      },
      {
        fields: ["created_at"],
        name: "idx_notificaciones_created_at",
      },
      {
        fields: ["usuario_id", "leida"],
        name: "idx_notificaciones_usuario_leida",
      },
    ],
  }
);

export default NotificacionDashboard;

