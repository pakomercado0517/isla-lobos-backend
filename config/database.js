require("dotenv").config();

module.exports = {
  development: {
    url: process.env.DB_URL,
    dialect: "postgres",
    logging: console.log,
    timezone: "America/Mexico_City",
    dialectOptions: {
      timezone: "local",
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
    },
  },
  test: {
    url: process.env.DB_URL_TEST || process.env.DB_URL,
    dialect: "postgres",
    logging: false,
    timezone: "America/Mexico_City",
    dialectOptions: {
      timezone: "local",
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
    },
  },
  production: {
    url: process.env.DB_URL,
    dialect: "postgres",
    logging: false,
    timezone: "America/Mexico_City",
    dialectOptions: {
      timezone: "local",
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
    },
  },
};
