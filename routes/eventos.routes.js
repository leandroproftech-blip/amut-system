
console.log('✅ Novas rotas de eventos carregadas');

const express = require('express');
const router = express.Router();
const eventosController = require('../controllers/eventosController');
const { autenticar, permitir } = require('../middleware/auth');

router.use(autenticar);

router.get('/', eventosController.listar);
router.get('/paciente/:pacienteId', eventosController.historicoPorPaciente);
router.get('/:id', eventosController.buscarPorId);
router.post('/', eventosController.criar);
router.post('/:id/presencas', eventosController.registrarPresencas);
router.put('/:id', eventosController.atualizar);
router.delete('/:id', permitir('admin', 'presidente'), eventosController.remover);

module.exports = router;