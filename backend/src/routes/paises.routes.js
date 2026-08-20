const express = require('express');
const { obtenerPaises, agregarPais, eliminarPais } = require('../controllers/paises.controller');

const router = express.Router();

router.get('/', obtenerPaises);
router.post('/', agregarPais);
router.delete('/:nombre', eliminarPais);

module.exports = router;
