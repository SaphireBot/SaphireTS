import mysql from "mysql2/promise";
import { env } from "node:process";

const localhost = env.MACHINE === "localhost";

export default new class MySQL {

  declare connection: mysql.Connection;

  constructor() {
    this.connect();
  }

  async connect() {
    try {
      const connection = await mysql.createConnection(this.config);
      this.connection = connection;
      // console.log("MySQL Server - Online");
      await this.checkDatabases();
    } catch (err) {
      console.log(err);
    }
  }

  async checkDatabases() {
    for await (const name of ["db", "users", "guilds"])
      await this.checkOrCreateDatabase(name);
  }

  async checkOrCreateDatabase(databaseName: string) {
    // const res = await this.connection.query(
    //   `CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4`,
    // );
    return databaseName;
  }

  get config(): mysql.ConnectionOptions {
    return {
      host: localhost ? "localhost" : "mysql",
      user: localhost ? "root" : env.MYSQL_USER,
      password: env.MYSQL_PASSWORD,
      database: localhost ? "db" : env.MYSQL_DATABASE,
      port: localhost ? 8080 : 3306,
    };
  }

};