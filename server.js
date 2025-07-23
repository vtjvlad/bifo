const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com", "https://use.fontawesome.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https://hotline.ua", "https://via.placeholder.com", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://use.fontawesome.com", "https://*.hotline.ua", "https://*.cdn.jsdelivr.net", "https://*.cdnjs.cloudflare.com", "https://*.googleusercontent.com", "https://*.amazonaws.com", "https://*.cloudinary.com", "https://*.imgur.com"],
            fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com", "https://use.fontawesome.com", "data:"],
            connectSrc: ["'self'", "https://hotline.ua", "https://*.hotline.ua"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    }
}));
app.use(compression());
app.use(morgan('combined'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/products', require('./routes/products'));
app.use('/api/catalogs', require('./routes/catalogs'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve category page
app.get('/category.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'category.html'));
});

// Serve static files (after specific routes)
app.use(express.static(path.join(__dirname, 'public')));

// Serve product page - handle dynamic product URLs (after static files)
app.get('/product/:productUrl(*)', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'product.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`🚀 BIFO server running on port ${PORT}`);
    console.log(`📱 Visit: http://localhost:${PORT}`);
}); 