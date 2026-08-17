import { Pool } from "pg";

const pool = new Pool({
  host: "localhost",
  user: "admin",
  password: "senha123",
  database: "aula_db",
  port: 5432,
});

export default pool;
