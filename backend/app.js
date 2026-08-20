const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const paisesRoutes = require('./src/routes/paises.routes');
const pool = require('./src/config/database');
const { errorHandler } = require('./src/helpers/errorHandler');

const app = express();
const PORT = process.env.PORT || 3501;

app.use(cors());
app.use(express.json());
app.use('/paises', paisesRoutes);

app.use((req, res) => {
  res.status(404).json({ ok: false, message: 'Ruta no encontrada' });
});

app.use(errorHandler);

pool
  .query('SELECT 1')
  .then(() => {
    console.log('Conexión a PostgreSQL establecida correctamente.');
  })
  .catch((error) => {
    console.error('No se pudo conectar a PostgreSQL:', error.message);
  });

app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});
