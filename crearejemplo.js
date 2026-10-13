const fs = require('fs');
const path = require('path');
const db = require('./database');

const nombresPool = ['Carlos', 'Sofía', 'Mateo', 'Valentina', 'Lucas', 'Camila', 'Diego', 'Lucía', 'Joaquín', 'Martina', 'Andrés', 'Elena', 'Gabriel', 'Mariana', 'Nicolás'];
const apellidosPool = ['Gómez', 'López', 'Pérez', 'Rodríguez', 'Fernández', 'Mendoza', 'Vargas', 'Quispe', 'Flores', 'Sánchez', 'Torres', 'Rojas', 'Mamani', 'Romero'];
const puestos = ['Frontend', 'Backend', 'Diseno UI/UX'];
const niveles = ['Básico', 'Intermedio', 'Avanzado', 'Ninguno'];
const formaciones = ['Estudiante Universitario', 'Autodidacta', 'Licenciatura/Ingenieria', 'Postgrado/Maestria'];
const dominios = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const registros = [];
for (let i = 1; i <= 50; i++) {
  const nombre = `${getRandom(nombresPool)} ${getRandom(apellidosPool)}`;
  const edad = getRandomInt(20, 45);
  const numero_cel = `7${getRandomInt(1000000, 9999999)}`;
  const email = `${nombre.toLowerCase().replace(/\s+/g, '.')}${getRandomInt(1, 99)}@${getRandom(dominios)}`;
  const formacion = getRandom(formaciones);
  const puesto = getRandom(puestos);
  const nivel_js = getRandom(niveles);
  const nivel_ts = getRandom(niveles);
  const anios = getRandomInt(0, 10);
  const experiencia = `Experiencia de ${anios} años trabajando con ${puesto} en proyectos web y bases de datos.`;

  registros.push({ nombre, edad, numero_cel, email, formacion, puesto, nivel_js, nivel_ts, anios, experiencia });
}

const csvHeader = 'nombre,edad,numero_cel,email,formacion,puesto,nivel_js,nivel_ts,anios,experiencia\n';
const csvRows = registros.map(r => 
  `"${r.nombre}",${r.edad},"${r.numero_cel}","${r.email}","${r.formacion}","${r.puesto}","${r.nivel_js}","${r.nivel_ts}",${r.anios},"${r.experiencia}"`
).join('\n');

const csvPath = path.join(__dirname, 'postulantes.csv');
fs.writeFileSync(csvPath, csvHeader + csvRows, 'utf8');
console.log('Archivo postulantes.csv generado exitosamente.');

const content = fs.readFileSync(csvPath, 'utf8');
const lines = content.trim().split('\n').slice(1);

const sql = `
  INSERT INTO postulaciones 
  (nombre, edad, numero_cel, email, formacion, puesto, nivel_js, nivel_ts, anios, experiencia)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

db.serialize(() => {
  const stmt = db.prepare(sql);
  let insertados = 0;

  lines.forEach(line => {
    const cols = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map(c => c.replace(/^"|"$/g, ''));
    
    if (cols && cols.length >= 10) {
      stmt.run([
        cols[0],           
        Number(cols[1]),   
        cols[2],           
        cols[3],           
        cols[4],           
        cols[5],           
        cols[6],           
        cols[7],           
        Number(cols[8]),   
        cols[9]            
      ]);
      insertados++;
    }
  });

  stmt.finalize(() => {
    console.log(`Se insertaron ${insertados} registros en la base de datos.`);
  });
});