import { Router } from 'express';
const router = Router();

// GET all floors with their tables
router.get('/', (req, res) => {
  const floors = req.db.prepare('SELECT * FROM floors ORDER BY id').all();
  const tables = req.db.prepare('SELECT * FROM tables WHERE is_active = 1 ORDER BY table_number').all();

  const result = floors.map(floor => ({
    ...floor,
    tables: tables.filter(t => t.floor_id === floor.id)
  }));

  res.json(result);
});

// GET single floor with tables
router.get('/:id', (req, res) => {
  const floor = req.db.prepare('SELECT * FROM floors WHERE id = ?').get(req.params.id);
  if (!floor) return res.status(404).json({ error: 'Floor not found' });

  const tables = req.db.prepare('SELECT * FROM tables WHERE floor_id = ? AND is_active = 1 ORDER BY table_number').all(req.params.id);
  res.json({ ...floor, tables });
});

// PATCH table status
router.patch('/tables/:id/status', (req, res) => {
  const { status } = req.body;
  if (!['available', 'occupied', 'reserved', 'self_order'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  req.db.prepare('UPDATE tables SET status = ?, last_activity = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);
  const table = req.db.prepare('SELECT * FROM tables WHERE id = ?').get(req.params.id);

  req.io.emit('table-updated', table);
  res.json(table);
});

export default router;
