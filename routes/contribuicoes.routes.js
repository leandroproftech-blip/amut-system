const express = require('express');
const router = express.Router();
const contribuicoesController = require('../controllers/contribuicoesController');
const { autenticar, permitir } = require('../middleware/auth');

router.use(autenticar);

router.get('/', contribuicoesController.listar);
router.get('/resumo', contribuicoesController.resumo);
router.get('/:id', contribuicoesController.buscarPorId);
router.post('/', contribuicoesController.criar);
router.put('/:id', contribuicoesController.atualizar);
router.delete('/:id', permitir('admin', 'presidente'), contribuicoesController.remover);

module.exports = router;