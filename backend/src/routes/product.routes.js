const express = require('express');
const router = express.Router();
const { Op } = require('../config/database');
const { Product, Category, User, Notification } = require('../models');
const { optionalAuth, verifyToken, requireRole } = require('../middleware/auth.middleware');
const { sendSuccess, sendPaginated, sendError, getPagination } = require('../utils/response');

// GET /api/v1/products/categories — Configurable product categories with live active product counts
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      where: { isActive: true },
      order: [['sortOrder', 'ASC'], ['name', 'ASC']],
    });

    const activeProducts = await Product.findAll({
      where: { isActive: true },
      attributes: ['id', 'category', 'inStock'],
    });

    const enriched = categories.map((cat) => {
      const matching = activeProducts.filter(
        (p) => p.category && p.category.toLowerCase() === cat.name.toLowerCase()
      );
      return {
        ...cat.toJSON(),
        productCount: matching.length,
        inStockCount: matching.filter((p) => p.inStock).length,
      };
    });

    return sendSuccess(res, enriched, 'Categories fetched');
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/products/categories — Allow vendors to add a custom local category if needed
router.post('/categories', verifyToken, requireRole('vendor'), async (req, res, next) => {
  try {
    const { name, kannadaName, description, icon, color } = req.body;
    if (!name || String(name).trim().length < 2) {
      return sendError(res, 'Category name is required', 400);
    }
    const cleanName = String(name).trim();
    const slug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const existing = await Category.findOne({
      where: { [Op.or]: [{ slug }, { name: cleanName }] },
    });
    if (existing) {
      return sendError(res, 'Category already exists', 409);
    }

    const cat = await Category.create({
      slug,
      name: cleanName,
      kannadaName: kannadaName ? String(kannadaName).trim() : null,
      description: description ? String(description).trim() : null,
      icon: icon || 'basket',
      color: color || '#15803D',
      sortOrder: 99,
      isActive: true,
    });
    return sendSuccess(res, cat, 'Category created', 201);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/products — Public & filtered product discovery + search
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const where = { isActive: true };

    if (req.query.vendorId) {
      where.vendorId = req.query.vendorId;
    } else if (req.query.mine === 'true' && req.user?.role === 'vendor') {
      where.vendorId = req.user.id;
    }

    if (req.query.category && req.query.category !== 'All') {
      where.category = req.query.category;
    }

    if (req.query.inStock === 'true') {
      where.inStock = true;
    }

    if (req.query.unit && req.query.unit !== 'All') {
      where.unit = req.query.unit;
    }

    if (req.query.minPrice !== undefined && req.query.minPrice !== '') {
      where.price = { ...(where.price || {}), [Op.gte]: Number(req.query.minPrice) };
    }
    if (req.query.maxPrice !== undefined && req.query.maxPrice !== '') {
      where.price = { ...(where.price || {}), [Op.lte]: Number(req.query.maxPrice) };
    }

    const q = (req.query.q || req.query.search || '').trim();
    if (q) {
      where[Op.or] = [
        { name: { [Op.like]: `%${q}%` } },
        { kannadaName: { [Op.like]: `%${q}%` } },
        { category: { [Op.like]: `%${q}%` } },
        { description: { [Op.like]: `%${q}%` } },
      ];
    }

    const vendorWhere = { role: 'vendor', isActive: true };
    if (req.query.vendorType && req.query.vendorType !== 'All') {
      vendorWhere.vendorType = req.query.vendorType;
    }
    if (req.query.onlineVendorsOnly === 'true') {
      vendorWhere.isOnline = true;
    }
    if (req.query.city) {
      vendorWhere.city = { [Op.like]: `%${String(req.query.city).trim()}%` };
    }
    if (req.query.pincode) {
      vendorWhere.pincode = String(req.query.pincode).trim();
    }

    let order = [
      ['inStock', 'DESC'],
      ['updatedAt', 'DESC'],
    ];
    if (req.query.sort === 'price_asc') {
      order = [
        ['inStock', 'DESC'],
        ['price', 'ASC'],
      ];
    } else if (req.query.sort === 'price_desc') {
      order = [
        ['inStock', 'DESC'],
        ['price', 'DESC'],
      ];
    } else if (req.query.sort === 'name_asc') {
      order = [
        ['inStock', 'DESC'],
        ['name', 'ASC'],
      ];
    }

    const { rows, count } = await Product.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'vendor',
          where: vendorWhere,
          attributes: [
            'id',
            'name',
            'shopName',
            'shopNameKannada',
            'vendorType',
            'serviceArea',
            'city',
            'pincode',
            'isOnline',
            'rating',
            'reviewCount',
            'settings',
          ],
        },
      ],
      order,
      limit,
      offset,
    });

    return sendPaginated(res, rows, count, page, limit, 'Products fetched');
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/products/me — Vendor's own inventory
router.get('/me', verifyToken, requireRole('vendor'), async (req, res, next) => {
  try {
    const products = await Product.findAll({
      where: { vendorId: req.userId, isActive: true },
      order: [
        ['category', 'ASC'],
        ['name', 'ASC'],
      ],
    });
    return sendSuccess(res, products, 'Vendor products fetched');
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/products/low-stock — Vendor's low stock alerts
router.get('/low-stock', verifyToken, requireRole('vendor'), async (req, res, next) => {
  try {
    const products = await Product.findAll({
      where: { vendorId: req.userId, isActive: true },
    });
    const lowStock = products.filter(
      (p) => Number(p.stock) <= Number(p.minStockAlert || 5)
    );
    return sendSuccess(res, lowStock, 'Low stock products fetched');
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/products/:id — Single product details with vendor profile
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.id, isActive: true },
      include: [
        {
          model: User,
          as: 'vendor',
          attributes: [
            'id',
            'name',
            'shopName',
            'shopNameKannada',
            'vendorType',
            'serviceArea',
            'shopAddress',
            'city',
            'pincode',
            'isOnline',
            'rating',
            'reviewCount',
            'settings',
          ],
        },
      ],
    });
    if (!product) return sendError(res, 'Product not found', 404);
    return sendSuccess(res, product, 'Product details');
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/products — Vendor creates product
router.post('/', verifyToken, requireRole('vendor'), async (req, res, next) => {
  try {
    const {
      name,
      kannadaName,
      description,
      category = 'Vegetables',
      unit = 'kg',
      price,
      mrp,
      costPrice = 0,
      stock = 0,
      minOrderQty = 1,
      maxOrderQty = null,
      minStockAlert = 5,
      perishable = true,
      imageUrl = null,
      tags = [],
    } = req.body;

    if (!name || String(name).trim().length < 2) {
      return sendError(res, 'Product name is required', 400);
    }
    const numericPrice = Number(price);
    if (Number.isNaN(numericPrice) || numericPrice <= 0) {
      return sendError(res, 'Selling price must be greater than zero', 400);
    }
    const numericStock = Number(stock);
    if (Number.isNaN(numericStock) || numericStock < 0) {
      return sendError(res, 'Stock quantity cannot be negative', 400);
    }
    const numericMinQty = Number(minOrderQty);
    if (Number.isNaN(numericMinQty) || numericMinQty <= 0) {
      return sendError(res, 'Minimum order quantity must be greater than zero', 400);
    }

    const catRow = await Category.findOne({ where: { name: category } });

    const product = await Product.create({
      vendorId: req.userId,
      categoryId: catRow ? catRow.id : null,
      name: String(name).trim(),
      kannadaName: kannadaName ? String(kannadaName).trim() : null,
      description: description ? String(description).trim() : null,
      category: String(category).trim(),
      unit: String(unit).trim(),
      price: Number(numericPrice.toFixed(2)),
      mrp: mrp ? Number(Number(mrp).toFixed(2)) : null,
      costPrice: Number(Number(costPrice || 0).toFixed(2)),
      stock: Number(numericStock.toFixed(2)),
      minOrderQty: Number(numericMinQty.toFixed(2)),
      maxOrderQty: maxOrderQty ? Number(Number(maxOrderQty).toFixed(2)) : null,
      minStockAlert: Number(minStockAlert || 5),
      perishable: Boolean(perishable),
      imageUrl: imageUrl ? String(imageUrl).trim() : null,
      tags: Array.isArray(tags) ? tags : [],
    });

    return sendSuccess(res, product, 'Product added to catalog', 201);
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/products/:id — Vendor updates own product
router.put('/:id', verifyToken, requireRole('vendor'), async (req, res, next) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.id, vendorId: req.userId },
    });
    if (!product) return sendError(res, 'Product not found in your catalog', 404);

    if (req.body.price !== undefined && Number(req.body.price) <= 0) {
      return sendError(res, 'Price must be greater than zero', 400);
    }
    if (req.body.stock !== undefined && Number(req.body.stock) < 0) {
      return sendError(res, 'Stock cannot be negative', 400);
    }

    const editable = [
      'name',
      'kannadaName',
      'description',
      'category',
      'unit',
      'price',
      'mrp',
      'costPrice',
      'stock',
      'minOrderQty',
      'maxOrderQty',
      'minStockAlert',
      'perishable',
      'imageUrl',
      'tags',
      'isActive',
    ];
    for (const field of editable) {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    }
    await product.save();
    return sendSuccess(res, product, 'Product updated');
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/products/:id/stock — Vendor updates stock
router.patch('/:id/stock', verifyToken, requireRole('vendor'), async (req, res, next) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.id, vendorId: req.userId },
    });
    if (!product) return sendError(res, 'Product not found in your catalog', 404);

    const { adjustment, stock } = req.body;
    const prevStock = Number(product.stock || 0);
    let nextStock = prevStock;

    if (adjustment !== undefined) {
      nextStock = Math.max(0, prevStock + Number(adjustment));
    } else if (stock !== undefined) {
      if (Number(stock) < 0) return sendError(res, 'Stock cannot be negative', 400);
      nextStock = Number(stock);
    } else {
      return sendError(res, 'Provide stock or adjustment value', 400);
    }

    product.stock = Number(nextStock.toFixed(2));
    await product.save();

    if (product.stock <= Number(product.minStockAlert || 5)) {
      await Notification.create({
        userId: req.userId,
        vendorId: req.userId,
        type: 'stock',
        title: `Low Stock: ${product.name}`,
        kannadaTitle: `ಕಡಿಮೆ ಸ್ಟಾಕ್: ${product.kannadaName || product.name}`,
        body: `${product.stock} ${product.unit} remaining.`,
      });
    }

    return sendSuccess(res, product, 'Stock updated');
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/products/:id — Vendor archives own product
router.delete('/:id', verifyToken, requireRole('vendor'), async (req, res, next) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.id, vendorId: req.userId },
    });
    if (!product) return sendError(res, 'Product not found in your catalog', 404);
    product.isActive = false;
    await product.save();
    return sendSuccess(res, { id: product.id }, 'Product removed from catalog');
  } catch (error) {
    next(error);
  }
});

module.exports = router;
