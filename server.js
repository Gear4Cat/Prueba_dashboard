const express = require('express');
const db = require('./database'); 
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// --- NUEVA RUTA DE ESTADÍSTICAS ---
app.get('/api/estadisticas', (req, res) => {
  // 1. Obtener el total de postulantes
  db.get('SELECT COUNT(*) as total FROM postulaciones', (err, rowTotal) => {
    if (err) {
      console.error('ERROR SQL TOTAL:', err.message);
      return res.status(500).json({ error: 'Error al calcular estadísticas.' });
    }

    const total = rowTotal ? rowTotal.total : 0;
    if (total === 0) {
      return res.json({ total: 0, puestos: [], nivelesJs: [] });
    }

    // 2. Agrupar por puesto
    db.all('SELECT puesto, COUNT(*) as cantidad FROM postulaciones GROUP BY puesto', (err, rowsPuesto) => {
      if (err) {
        console.error('ERROR SQL PUESTOS:', err.message);
        return res.status(500).json({ error: 'Error al calcular puestos.' });
      }

      const puestos = (rowsPuesto || []).map(p => ({
        puesto: p.puesto || 'No especificado',
        cantidad: p.cantidad,
        porcentaje: ((p.cantidad / total) * 100).toFixed(1)
      }));

      // 3. Agrupar por nivel de JS
      db.all('SELECT nivel_js, COUNT(*) as cantidad FROM postulaciones GROUP BY nivel_js', (err, rowsJs) => {
        if (err) {
          console.error('ERROR SQL NIVEL JS:', err.message);
          return res.status(500).json({ error: 'Error al calcular niveles.' });
        }

        const nivelesJs = (rowsJs || []).map(n => ({
          nivel: n.nivel_js || 'No especificado',
          cantidad: n.cantidad,
          porcentaje: ((n.cantidad / total) * 100).toFixed(1)
        }));

        // Enviar todo consolidado en formato JSON
        res.json({ total, puestos, nivelesJs });
      });
    });
  });
});

app.post('/api/postular', (req, res) => {
  console.log('PAYLOAD RECIBIDO:', req.body);

  const { 
    nombre, edad, numero_cel, email, formacion, 
    puesto, nivel_js, nivel_ts, anios, experiencia 
  } = req.body;

  if (!nombre || !email || !edad) {
    console.warn('FALLO DE VALIDACION: Campos obligatorios faltantes');
    return res.status(400).json({ error: 'Por favor completa todos los campos obligatorios.' });
  }

  const sql = `
    INSERT INTO postulaciones 
    (nombre, edad, numero_cel, email, formacion, puesto, nivel_js, nivel_ts, anios, experiencia)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const parametros = [
    nombre, edad, numero_cel, email, formacion, 
    puesto, nivel_js, nivel_ts, anios, experiencia
  ];

  db.run(sql, parametros, function (err) {
    if (err) {
      console.error('ERROR SQL INSERT:', err.message);
      return res.status(500).json({ error: 'Ocurrió un error al guardar tu postulación.' });
    }

    console.log(`REGISTRO INSERTADO: ID ${this.lastID}`);
    res.status(201).json({ 
      mensaje: '¡Postulación guardada exitosamente!', 
      idPostulacion: this.lastID 
    });
  });
});

app.get('/trabaja', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/postulaciones', (req, res) => { 
  const { area, exp_min, keyword } = req.query;

  let sql = 'SELECT * FROM postulaciones WHERE 1=1';
  const params = [];

  if (area) {
    sql += ' AND LOWER(puesto) = (?)';
    params.push(area);
  }

  if (exp_min) {
    sql += ' AND anios >= ?';
    params.push(Number(exp_min));
  }

  if (keyword) {
    sql += ' AND (LOWER(nombre) LIKE LOWER(?) OR LOWER(email) LIKE LOWER(?) OR LOWER(formacion) LIKE LOWER(?))';
    const likeParam = `%${keyword}%`;
    params.push(likeParam, likeParam, likeParam);
  }

  sql += ' ORDER BY id DESC';

  console.log(`CONSULTANDO BD: "${sql}" | PARAMETROS:`, params);

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('ERROR SQL SELECT:', err.message);
      return res.status(500).json({ error: 'Error al obtener postulaciones.' });
    }
    console.log(`REGISTROS RECUPERADOS: ${rows.length}`);
    res.json(rows);
  });
});

app.delete('/api/postulaciones/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM postulaciones WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('ERROR SQL DELETE:', err.message);
      return res.status(500).json({ error: 'No se pudo eliminar la postulación.' });
    }
    
    if (this.changes === 0) {
      console.warn(`INTENTO DE ELIMINAR ID INEXISTENTE: ${id}`);
      return res.status(404).json({ error: 'Postulación no encontrada.' });
    }

    console.log(`REGISTRO ELIMINADO: ID ${id}`);
    res.json({ mensaje: 'Postulación descartada exitosamente.' });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en: http://localhost:${PORT}`);
});
