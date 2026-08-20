const Cursor = require('pg-cursor');
const pool = require('../config/database');

const LIMITES = [5, 10, 20];

const limpiarTexto = (valor) =>
  typeof valor === 'string' ? valor.trim() : '';

const esEnteroNoNegativo = (valor) =>
  Number.isInteger(valor) && valor >= 0;

const leerCursor = (cursor, cantidad) =>
  new Promise((resolve, reject) => {
    cursor.read(cantidad, (error, rows) => {
      if (error) reject(error);
      else resolve(rows);
    });
  });

const obtenerPaises = async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 5);

    if (!Number.isInteger(page) || page < 1 || !LIMITES.includes(limit)) {
      return res.status(400).json({
        ok: false,
        message: 'Página o límite inválido',
      });
    }

    const client = await pool.connect();
    let cursor;
    try {
      const countResult = await client.query('SELECT COUNT(*)::int AS total FROM paises');
      const totalItems = countResult.rows[0].total;
      const offset = (page - 1) * limit;
      cursor = client.query(new Cursor(`
        SELECT p.nombre, p.continente, p.poblacion, pp.pib_2019, pp.pib_2020
        FROM paises p
        LEFT JOIN paises_pib pp ON pp.nombre = p.nombre
        ORDER BY p.nombre ASC
      `));
      const rows = await leerCursor(cursor, offset + limit);
      const data = rows.slice(offset).map((pais) => ({
        nombre: pais.nombre,
        continente: pais.continente,
        poblacion: pais.poblacion,
        pib_2019: pais.pib_2019,
        pib_2020: pais.pib_2020,
      }));
      const totalPages = Math.ceil(totalItems / limit);

      return res.json({
        ok: true,
        data,
        pagination: {
          page,
          limit,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      });
    } finally {
      if (cursor) await new Promise((resolve) => cursor.close(() => resolve()));
      client.release();
    }
  } catch (error) {
    next(error);
  }
};

const agregarPais = async (req, res, next) => {
  try {
    const { poblacion, pib_2019, pib_2020 } = req.body;
    const nombre = limpiarTexto(req.body.nombre);
    const continente = limpiarTexto(req.body.continente);

    const numerosValidos = [poblacion, pib_2019, pib_2020].every(
      esEnteroNoNegativo
    );

    if (!nombre || !continente || !numerosValidos) {
      return res.status(400).json({
        ok: false,
        message: 'Datos inválidos para crear el país',
      });
    }

    const client = await pool.connect();
    try {
      const existente = await client.query(
        'SELECT 1 FROM paises WHERE nombre = $1',
        [nombre]
      );
      if (existente.rowCount > 0) {
        return res.status(409).json({
          ok: false,
          message: 'El país ya existe',
        });
      }

      await client.query('BEGIN');
      await client.query(
        'INSERT INTO paises (nombre, continente, poblacion) VALUES ($1, $2, $3)',
        [nombre, continente, poblacion]
      );
      await client.query(
        'INSERT INTO paises_pib (nombre, pib_2019, pib_2020) VALUES ($1, $2, $3)',
        [nombre, pib_2019, pib_2020]
      );
      await client.query(
        `INSERT INTO paises_data_web (nombre_pais, accion) VALUES ($1, 1)
         ON CONFLICT (nombre_pais) DO UPDATE SET accion = EXCLUDED.accion`,
        [nombre]
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return res.status(201).json({
      ok: true,
      message: 'País creado correctamente',
    });
  } catch (error) {
    next(error);
  }
};

const eliminarPais = async (req, res, next) => {
  try {
    const nombre = limpiarTexto(req.params.nombre);

    if (!nombre) {
      return res.status(400).json({
        ok: false,
        message: 'Nombre de país inválido',
      });
    }

    const client = await pool.connect();
    try {
      const existente = await client.query(
        'SELECT 1 FROM paises WHERE nombre = $1',
        [nombre]
      );
      if (existente.rowCount === 0) {
        return res.status(404).json({
          ok: false,
          message: 'El país no existe',
        });
      }

      await client.query('BEGIN');
      await client.query('DELETE FROM paises_pib WHERE nombre = $1', [nombre]);
      await client.query('DELETE FROM paises WHERE nombre = $1', [nombre]);
      await client.query(
        `INSERT INTO paises_data_web (nombre_pais, accion) VALUES ($1, 0)
         ON CONFLICT (nombre_pais) DO UPDATE SET accion = EXCLUDED.accion`,
        [nombre]
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return res.json({
      ok: true,
      message: 'País eliminado correctamente',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerPaises,
  agregarPais,
  eliminarPais,
};