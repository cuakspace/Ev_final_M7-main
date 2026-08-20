const errorHandler = (err, req, res, next) => {
  if (err.code === '23505') {
    return res.status(409).json({
      ok: false,
      message: 'Registro duplicado. Ya existe un valor con esa clave primaria.',
    });
  }

  if (err.code === '23503') {
    return res.status(409).json({
      ok: false,
      message: 'Error de clave foránea. Verifique los datos relacionados.',
    });
  }

  if (['ECONNREFUSED', 'ENOTFOUND', '57P01'].includes(err.code)) {
    return res.status(503).json({
      ok: false,
      message: 'Error al conectar con PostgreSQL.',
    });
  }

  if (['22P02', '23502', '22003', '22007'].includes(err.code)) {
    return res.status(400).json({
      ok: false,
      message: 'Datos inválidos. Verifique la información enviada.',
    });
  }

  console.error(err);

  return res.status(500).json({
    ok: false,
    message: 'Error interno del servidor.',
  });
};

module.exports = { errorHandler };
