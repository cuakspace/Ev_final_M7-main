const pool = require('../config/database');

const paises = [
  { nombre: 'Luxemburgo', continente: 'Europa', poblacion: 602005 },
  { nombre: 'Suiza', continente: 'Europa', poblacion: 8500000 },
  { nombre: 'Noruega', continente: 'Europa', poblacion: 5367580 },
  { nombre: 'Estados Unidos', continente: 'America', poblacion: 325719178 },
  { nombre: 'Holanda', continente: 'Europa', poblacion: 6100000 },
  { nombre: 'Finlandia', continente: 'Europa', poblacion: 5513000 },
  { nombre: 'Alemania', continente: 'Europa', poblacion: 83149300 },
  { nombre: 'Japon', continente: 'Asia', poblacion: 126150000 },
  { nombre: 'España', continente: 'Europa', poblacion: 47329981 },
  { nombre: 'Chile', continente: 'America', poblacion: 19107216 },
  { nombre: 'Mexico', continente: 'America', poblacion: 128649565 },
  { nombre: 'Brasil', continente: 'America', poblacion: 212216052 },
  { nombre: 'Argentina', continente: 'America', poblacion: 45195777 },
];

const paisesPib = [
  { nombre: 'Luxemburgo', pib_2019: 115200, pib_2020: 116730 },
  { nombre: 'Suiza', pib_2019: 85160, pib_2020: 86670 },
  { nombre: 'Noruega', pib_2019: 82770, pib_2020: 78330 },
  { nombre: 'Estados Unidos', pib_2019: 65060, pib_2020: 67430 },
  { nombre: 'Holanda', pib_2019: 54130, pib_2020: 53870 },
  { nombre: 'Finlandia', pib_2019: 50880, pib_2020: 50770 },
  { nombre: 'Alemania', pib_2019: 49690, pib_2020: 47990 },
  { nombre: 'Japon', pib_2019: 41420, pib_2020: 43040 },
  { nombre: 'España', pib_2019: 31910, pib_2020: 30730 },
  { nombre: 'Chile', pib_2019: 16280, pib_2020: 15850 },
  { nombre: 'Mexico', pib_2019: 9870, pib_2020: 10410 },
  { nombre: 'Brasil', pib_2019: 9160, pib_2020: 8960 },
  { nombre: 'Argentina', pib_2019: 9050, pib_2020: 9730 },
];

const paisesDataWeb = [
  { nombre_pais: 'Luxemburgo', accion: 1 },
  { nombre_pais: 'Suiza', accion: 1 },
  { nombre_pais: 'Noruega', accion: 1 },
  { nombre_pais: 'Estados Unidos', accion: 1 },
  { nombre_pais: 'Holanda', accion: 1 },
  { nombre_pais: 'Finlandia', accion: 1 },
];

const cargarDatos = async () => {
  const client = await pool.connect();
  try {
    console.log('Conexión a PostgreSQL establecida para el seeder.');
    await client.query('BEGIN');
    await client.query('DROP TABLE IF EXISTS paises_pib');
    await client.query('DROP TABLE IF EXISTS paises_data_web');
    await client.query('DROP TABLE IF EXISTS paises');
    await client.query(`
      CREATE TABLE paises (
        nombre VARCHAR(200) PRIMARY KEY,
        continente VARCHAR(200),
        poblacion INTEGER
      )
    `);
    await client.query(`
      CREATE TABLE paises_pib (
        nombre VARCHAR(200) PRIMARY KEY REFERENCES paises(nombre),
        pib_2019 INTEGER,
        pib_2020 INTEGER
      )
    `);
    await client.query(`
      CREATE TABLE paises_data_web (
        nombre_pais VARCHAR(200) PRIMARY KEY,
        accion INTEGER
      )
    `);

    for (const pais of paises) {
      await client.query(
        'INSERT INTO paises (nombre, continente, poblacion) VALUES ($1, $2, $3)',
        [pais.nombre, pais.continente, pais.poblacion]
      );
    }
    for (const pais of paisesPib) {
      await client.query(
        'INSERT INTO paises_pib (nombre, pib_2019, pib_2020) VALUES ($1, $2, $3)',
        [pais.nombre, pais.pib_2019, pais.pib_2020]
      );
    }
    for (const registro of paisesDataWeb) {
      await client.query(
        'INSERT INTO paises_data_web (nombre_pais, accion) VALUES ($1, $2)',
        [registro.nombre_pais, registro.accion]
      );
    }

    await client.query('COMMIT');
    console.log('Seed completado: tablas recreadas y datos cargados correctamente.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al ejecutar el seed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

cargarDatos();
