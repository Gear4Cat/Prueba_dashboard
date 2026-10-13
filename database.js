const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./datos.db', (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err.message);
  } else {
    console.log('Conexión exitosa a la base de datos SQLite.');
  }
});

db.run(`
  CREATE TABLE IF NOT EXISTS postulaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    edad INTEGER,
    numero_cel TEXT,
    email TEXT,
    formacion TEXT,
    puesto TEXT,
    nivel_js TEXT,
    nivel_ts TEXT,
    anios INTEGER,
    experiencia TEXT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

module.exports = db;