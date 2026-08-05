const express = require('express');
const router = express.Router();
const responsaveisController = require('../controllers/responsaveisController');
const { autenticar, permitir } = require('../middleware/auth');

router.use(autenticar);

router.get('/', responsaveisController.listar);
router.get('/:id', responsaveisController.buscarPorId);
router.put('/:id', responsaveisController.atualizar);
router.delete('/:id', permitir('admin', 'presidente'), responsaveisController.remover);

module.exports = router;
