const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Define the Product schema
const ProductSchema = new mongoose.Schema({
    productName: { type: String, required: true },
    categoryType: { type: String, required: true },
    businessName: { type: String, required: true },
    amount: { type: Number, required: true }
});

// Add a partial unique index for productName, categoryType, and businessName
ProductSchema.index({ productName: 1, categoryType: 1, businessName: 1 }, { unique: true });

const Product = mongoose.model('Product', ProductSchema);

// Export the Product model


const router = express.Router();

// Middleware for authenticating the token
const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(403).json({ error: 'Invalid token.' });
    }
};

// Route to create a new product
router.post('/', authenticateToken, async (req, res) => {
    const { productName, categoryType, amount } = req.body;
    const businessName = req.user.business; // Assuming the user object has the business name

    if (!productName || !categoryType || !businessName) {
        return res.status(400).json({ error: 'Product Name, Category Type, and Business Name are required.' });
    }

    try {
        const existProduct = await Product.findOne ({productName, categoryType, businessName, amount});
        if(existProduct){
            return res.status(400).json({ error: 'Prosuct name already exists for this business.' });
        }
        const product = new Product({ productName, categoryType, businessName, amount });
        await product.save();
        res.status(201).json({ message: 'Product added successfully.', product });
    } catch (error) {
        if (error.code === 11000) { // Handle duplicate key error
            return res.status(400).json({ error: 'Product with this name and category type already exists for this business.' });
        }
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Route to get all products or filter by categoryType
router.get('/', authenticateToken, async (req, res) => {
    const { categoryType } = req.query;
    const businessName = req.user.business;

    try {
        const query = { businessName };
        if (categoryType) {
            query.categoryType = categoryType;
        }

        const products = await Product.find(query);
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to get a specific product by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found.' });
        }
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to update a product by ID (PUT - full update)
router.put('/:id', authenticateToken, async (req, res) => {
    const { productName, categoryType } = req.body;
    const businessName = req.user.business;

    // Validate required fields
    if (!productName || !categoryType) {
        return res.status(400).json({ error: 'Product Name and Category Type are required.' });
    }

    try {
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { productName, categoryType, businessName },
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        res.status(200).json({ message: 'Product updated successfully.', updatedProduct });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to partially update a product by ID (PATCH)
router.patch('/:id', authenticateToken, async (req, res) => {
    const updates = req.body;

    try {
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ error: 'Product not found.' });
        }

        res.status(200).json({ message: 'Product updated successfully.', updatedProduct });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to delete a product by ID
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct) {
            return res.status(404).json({ error: 'Product not found.' });
        }
        res.status(200).json({ message: 'Product deleted successfully.', deletedProduct });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
