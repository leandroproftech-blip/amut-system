const express = require('express');
const router = express.Router();
const pacientesController = require('../controllers/pacientesController');
const { autenticar, permitir } = require('../middleware/auth');

router.use(autenticar);

router.get('/', pacientesController.listar);
router.get('/:id', pacientesController.buscarPorId);
router.post('/', pacientesController.criar);
router.put('/:id', pacientesController.atualizar);
router.delete('/:id', permitir('admin', 'presidente'), pacientesController.remover);

module.exports = router;
