import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database";
import { RefreshToken as RefreshTokenType } from "../types";
import User from "./User";

class RefreshToken extends Model implements RefreshTokenType {
  public id!: string;
  public token!: string;
  public userId!: string;
  public expiresAt!: Date;
  public isRevoked!: boolean;
  public created_at!: Date;
  public updated_at!: Date;

  // Timestamps
  // public readonly created_at!: Date;
  // public readonly updated_at!: Date;

  // Asociaciones
  public readonly user?: User;
}

RefreshToken.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    token: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isRevoked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: "RefreshToken",
    tableName: "refresh_tokens",
    underscored: true,
  }
);

// Asociaciones
RefreshToken.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

User.hasMany(RefreshToken, {
  foreignKey: "userId",
  as: "refreshTokens",
});

export default RefreshToken;
