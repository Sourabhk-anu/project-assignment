import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

export const sequelize = new Sequelize(
  process.env.DB_NAME || 'rbac_enterprise',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || 'Sourabh@#$123',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  }
);

// Test the connection
sequelize.authenticate()
  .then(() => {
    console.log("Connected to DB:", sequelize.getDatabaseName());
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });