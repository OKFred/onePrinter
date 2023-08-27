import mysql from "mysql2/promise";

const env = globalThis.envGetter();

const pool = mysql.createPool({
    host: env.MYSQL_HOST,
    user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
    database: env.MYSQL_DATABASE,
    waitForConnections: true,
    queueLimit: 0,
});

export default pool;
