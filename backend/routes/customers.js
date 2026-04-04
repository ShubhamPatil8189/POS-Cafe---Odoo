import { Router } from 'express';
const router = Router();

// GET all customers
router.get('/', (req, res) => {
  const { search } = req.query;
  let customers;
  if (search) {
    customers = req.db.prepare("SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? OR email LIKE ? ORDER BY name").all(`%${search}%`, `%${search}%`, `%${search}%`);
  } else {
    customers = req.db.prepare('SELECT * FROM customers ORDER BY created_at DESC').all();
  }
  res.json(customers);
});

// GET single customer
router.get('/:id', (req, res) => {
  const customer = req.db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  // Get order history
  const orders = req.db.prepare(`
    SELECT o.*, t.table_number FROM orders o
    JOIN tables t ON o.table_id = t.id
    WHERE o.customer_id = ?
    ORDER BY o.created_at DESC LIMIT 20
  `).all(req.params.id);

  res.json({ ...customer, orders });
});

// POST new customer
router.post('/', (req, res) => {
  const { name, phone, email, address_line1, address_line2, city, state, country } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const result = req.db.prepare(
    'INSERT INTO customers (name, phone, email, address_line1, address_line2, city, state, country) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(name, phone || '', email || '', address_line1 || '', address_line2 || '', city || '', state || '', country || 'India');
  const customer = req.db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(customer);
});

// PATCH customer
router.patch('/:id', (req, res) => {
  const existing = req.db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Customer not found' });

  const { name, phone, email, address_line1, address_line2, city, state, country } = req.body;
  req.db.prepare(
    'UPDATE customers SET name=?, phone=?, email=?, address_line1=?, address_line2=?, city=?, state=?, country=? WHERE id=?'
  ).run(
    name ?? existing.name, phone ?? existing.phone, email ?? existing.email,
    address_line1 ?? existing.address_line1, address_line2 ?? existing.address_line2,
    city ?? existing.city, state ?? existing.state, country ?? existing.country,
    req.params.id
  );
  const customer = req.db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  res.json(customer);
});

// DELETE customer
router.delete('/:id', (req, res) => {
  req.db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
