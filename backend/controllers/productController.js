const prisma = require('../config/database');

// ── Get All Products (with category, variants, extras) ─
exports.getAll = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        product_variants: {
          include: {
            attribute: true
          }
        },
        product_extras: true
      },
      orderBy: { id: 'asc' }
    });

    const result = products.map(product => ({
      ...product,
      image: product.image_url, // Map for frontend
      available: product.is_active ? true : false, // Map for frontend
      sendToKitchen: Boolean(product.send_to_kitchen),
      category: product.category?.name ? product.category.name.toLowerCase() : null,
      category_name: product.category?.name || null,
      category_color: product.category?.color || null,
      variants: product.product_variants.map(v => ({
        ...v,
        attribute_name: v.attribute?.attribute_name
      })),
      extras: product.product_extras,
      product_variants: undefined,
      product_extras: undefined
    }));

    res.json(result);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products.' });
  }
};

// ── Get Single Product ─────────────────────────────────
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: true,
        product_variants: {
          include: {
            attribute: true
          }
        },
        product_extras: true,
        product_attributes: true
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    res.json({
      ...product,
      image: product.image_url, // Map for frontend
      available: product.is_active ? true : false,
      sendToKitchen: Boolean(product.send_to_kitchen),
      category: product.category?.name ? product.category.name.toLowerCase() : null,
      category_name: product.category?.name || null,
      category_color: product.category?.color || null,
      attributes: product.product_attributes,
      variants: product.product_variants.map(v => ({
        ...v,
        attribute_name: v.attribute?.attribute_name
      })),
      extras: product.product_extras,
      product_attributes: undefined,
      product_variants: undefined,
      product_extras: undefined
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product.' });
  }
};

// ── Create Product ─────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const { name, category_id, price, tax, uom, description, image_url, is_active, send_to_kitchen } = req.body;

    if (!name || !category_id || price === undefined) {
      return res.status(400).json({ error: 'Name, category_id, and price are required.' });
    }

    const created = await prisma.product.create({
      data: {
        name,
        category_id: parseInt(category_id),
        price: parseFloat(price),
        tax: tax !== undefined ? parseFloat(tax) : 0,
        uom: uom || 'piece',
        description: description || null,
        image_url: image_url || null,
        is_active: is_active !== undefined ? Boolean(is_active) : true,
        send_to_kitchen: send_to_kitchen !== undefined ? Boolean(send_to_kitchen) : true
      }
    });

    res.status(201).json(created);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product.' });
  }
};

// ── Update Product ─────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category_id, price, tax, uom, description, image_url, is_active, send_to_kitchen, available, sendToKitchen } = req.body;

    const existing = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // Map frontend camelCase to backend snake_case
    const final_is_active = is_active !== undefined ? Boolean(is_active) : (available !== undefined ? Boolean(available) : existing.is_active);
    const final_send_to_kitchen = send_to_kitchen !== undefined ? Boolean(send_to_kitchen) : (sendToKitchen !== undefined ? Boolean(sendToKitchen) : existing.send_to_kitchen);

    const updated = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        name: name !== undefined ? name : existing.name,
        category_id: category_id !== undefined ? parseInt(category_id) : existing.category_id,
        price: price !== undefined ? parseFloat(price) : existing.price,
        tax: tax !== undefined ? parseFloat(tax) : existing.tax,
        uom: uom !== undefined ? uom : existing.uom,
        description: description !== undefined ? description : existing.description,
        image_url: image_url !== undefined ? image_url : existing.image_url,
        is_active: final_is_active,
        send_to_kitchen: final_send_to_kitchen
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product.' });
  }
};

// ── Delete Product ─────────────────────────────────────
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // Prisma handles cascading deletes if configured in schema.prisma,
    // but the schema may not have ON DELETE CASCADE. Let's do it manually in a transaction just in case.
    await prisma.$transaction(async (tx) => {
      await tx.productExtra.deleteMany({ where: { product_id: parseInt(id) } });
      
      const attrs = await tx.productAttribute.findMany({ where: { product_id: parseInt(id) } });
      const attrIds = attrs.map(a => a.id);
      
      if (attrIds.length > 0) {
        await tx.productVariant.deleteMany({ where: { attribute_id: { in: attrIds } } });
      }
      
      await tx.productAttribute.deleteMany({ where: { product_id: parseInt(id) } });
      await tx.product.delete({ where: { id: parseInt(id) } });
    });

    res.json({ message: 'Product deleted successfully.' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product.' });
  }
};

// ── Add Product Attribute ──────────────────────────────
exports.addAttribute = async (req, res) => {
  try {
    const { id } = req.params; // product_id
    const { attribute_name } = req.body;

    if (!attribute_name) {
      return res.status(400).json({ error: 'Attribute name is required.' });
    }

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      select: { id: true }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const created = await prisma.productAttribute.create({
      data: {
        product_id: parseInt(id),
        attribute_name
      }
    });

    res.status(201).json(created);
  } catch (error) {
    console.error('Add attribute error:', error);
    res.status(500).json({ error: 'Failed to add attribute.' });
  }
};

// ── Add Product Variant ────────────────────────────────
exports.addVariant = async (req, res) => {
  try {
    const { id } = req.params; // product_id
    const { attribute_id, value, unit, extra_price } = req.body;

    if (!attribute_id || !value) {
      return res.status(400).json({ error: 'Attribute ID and value are required.' });
    }

    const created = await prisma.productVariant.create({
      data: {
        product_id: parseInt(id),
        attribute_id: parseInt(attribute_id),
        value,
        unit: unit || null,
        extra_price: extra_price ? parseFloat(extra_price) : 0
      }
    });

    res.status(201).json(created);
  } catch (error) {
    console.error('Add variant error:', error);
    res.status(500).json({ error: 'Failed to add variant.' });
  }
};

// ── Delete Variant ─────────────────────────────────────
exports.removeVariant = async (req, res) => {
  try {
    const { id } = req.params;
    
    const existing = await prisma.productVariant.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Variant not found.' });
    }
    
    await prisma.productVariant.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ message: 'Variant deleted successfully.' });
  } catch (error) {
    console.error('Delete variant error:', error);
    res.status(500).json({ error: 'Failed to delete variant.' });
  }
};

// ── Add Product Extra ──────────────────────────────────
exports.addExtra = async (req, res) => {
  try {
    const { id } = req.params; // product_id
    const { name, extra_price } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Extra name is required.' });
    }

    const created = await prisma.productExtra.create({
      data: {
        product_id: parseInt(id),
        name,
        extra_price: extra_price ? parseFloat(extra_price) : 0,
        is_active: true
      }
    });

    res.status(201).json(created);
  } catch (error) {
    console.error('Add extra error:', error);
    res.status(500).json({ error: 'Failed to add extra.' });
  }
};

// ── Delete Extra ───────────────────────────────────────
exports.removeExtra = async (req, res) => {
  try {
    const { id } = req.params;
    
    const existing = await prisma.productExtra.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Extra not found.' });
    }
    
    await prisma.productExtra.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ message: 'Extra deleted successfully.' });
  } catch (error) {
    console.error('Delete extra error:', error);
    res.status(500).json({ error: 'Failed to delete extra.' });
  }
};
