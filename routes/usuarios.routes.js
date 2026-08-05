const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const { autenticar, permitir } = require('../middleware/auth');

router.use(autenticar);
router.use(permitir('admin')); // Apenas administradores gerenciam usuários

router.get('/', usuariosController.listar);
router.get('/:id', usuariosController.buscarPorId);
router.post('/', usuariosController.criar);
router.put('/:id', usuariosController.atualizar);
router.delete('/:id', usuariosController.remover);

module.exports = router;
