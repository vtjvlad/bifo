const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

// Sample products data
const sampleProducts = [
    // Electronics
    {
        id: 1001,
        title: "iPhone 15 Pro",
        date: "2024-01-15",
        vendor: {
            title: "Apple",
            __typename: "Vendor"
        },
        section: {
            _id: 1,
            productCategoryName: "Смартфоны",
            category: "bt-smartphones",
            subCategory: "iphone",
            __typename: "Section"
        },
        isPromo: true,
        toOfficial: false,
        promoBid: null,
        lineName: "iPhone 15",
        linePathNew: "/smartphones/iphone-15/",
        imagesCount: 5,
        videosCount: 2,
        techShortSpecifications: [
            "Смартфон",
            "Экран: 6.1 дюйма",
            "Процессор: A17 Pro",
            "Память: 128 ГБ",
            "Камера: 48 МП"
        ],
        techShortSpecificationsList: [
            { key: "Тип", value: "Смартфон" },
            { key: "Экран", value: "6.1 дюйма" },
            { key: "Процессор", value: "A17 Pro" },
            { key: "Память", value: "128 ГБ" },
            { key: "Камера", value: "48 МП" }
        ],
        reviewsCount: 156,
        questionsCount: 23,
        url: "/smartphones/apple-iphone-15-pro/",
        imageLinks: [
            {
                thumb: "https://via.placeholder.com/150x150/007AFF/FFFFFF?text=iPhone+15+Pro",
                basic: "https://via.placeholder.com/300x300/007AFF/FFFFFF?text=iPhone+15+Pro",
                small: "https://via.placeholder.com/200x200/007AFF/FFFFFF?text=iPhone+15+Pro",
                big: "https://via.placeholder.com/600x600/007AFF/FFFFFF?text=iPhone+15+Pro"
            }
        ],
        minPrice: 89990,
        maxPrice: 99990,
        currentPrice: 89990,
        initPrice: 99990,
        salesCount: 45,
        isNew: 1,
        colorsProduct: [
            {
                id: 1,
                title: "Титановый",
                colorName: "Титановый",
                alias: "titanium",
                pathImg: "https://via.placeholder.com/100x100/8A8A8A/FFFFFF?text=Titanium"
            }
        ],
        offerCount: 12,
        offers: [],
        madeInUkraine: false,
        userSubscribed: false,
        __typename: "Product"
    },
    {
        id: 1002,
        title: "MacBook Air M2",
        date: "2024-01-10",
        vendor: {
            title: "Apple",
            __typename: "Vendor"
        },
        section: {
            _id: 2,
            productCategoryName: "Ноутбуки",
            category: "bt-laptops",
            subCategory: "macbook",
            __typename: "Section"
        },
        isPromo: false,
        toOfficial: false,
        promoBid: null,
        lineName: "MacBook Air",
        linePathNew: "/laptops/macbook-air/",
        imagesCount: 4,
        videosCount: 1,
        techShortSpecifications: [
            "Ноутбук",
            "Экран: 13.6 дюйма",
            "Процессор: M2",
            "Память: 8 ГБ",
            "SSD: 256 ГБ"
        ],
        techShortSpecificationsList: [
            { key: "Тип", value: "Ноутбук" },
            { key: "Экран", value: "13.6 дюйма" },
            { key: "Процессор", value: "M2" },
            { key: "Память", value: "8 ГБ" },
            { key: "SSD", value: "256 ГБ" }
        ],
        reviewsCount: 89,
        questionsCount: 15,
        url: "/laptops/apple-macbook-air-m2/",
        imageLinks: [
            {
                thumb: "https://via.placeholder.com/150x150/000000/FFFFFF?text=MacBook+Air+M2",
                basic: "https://via.placeholder.com/300x300/000000/FFFFFF?text=MacBook+Air+M2",
                small: "https://via.placeholder.com/200x200/000000/FFFFFF?text=MacBook+Air+M2",
                big: "https://via.placeholder.com/600x600/000000/FFFFFF?text=MacBook+Air+M2"
            }
        ],
        minPrice: 129990,
        maxPrice: 129990,
        currentPrice: 129990,
        initPrice: 129990,
        salesCount: 23,
        isNew: 0,
        colorsProduct: [],
        offerCount: 8,
        offers: [],
        madeInUkraine: false,
        userSubscribed: false,
        __typename: "Product"
    },
    {
        id: 1003,
        title: "Samsung Galaxy S24",
        date: "2024-01-20",
        vendor: {
            title: "Samsung",
            __typename: "Vendor"
        },
        section: {
            _id: 1,
            productCategoryName: "Смартфоны",
            category: "bt-smartphones",
            subCategory: "galaxy",
            __typename: "Section"
        },
        isPromo: true,
        toOfficial: false,
        promoBid: null,
        lineName: "Galaxy S",
        linePathNew: "/smartphones/galaxy-s/",
        imagesCount: 6,
        videosCount: 3,
        techShortSpecifications: [
            "Смартфон",
            "Экран: 6.8 дюйма",
            "Процессор: Snapdragon 8 Gen 3",
            "Память: 256 ГБ",
            "Камера: 200 МП"
        ],
        techShortSpecificationsList: [
            { key: "Тип", value: "Смартфон" },
            { key: "Экран", value: "6.8 дюйма" },
            { key: "Процессор", value: "Snapdragon 8 Gen 3" },
            { key: "Память", value: "256 ГБ" },
            { key: "Камера", value: "200 МП" }
        ],
        reviewsCount: 203,
        questionsCount: 34,
        url: "/smartphones/samsung-galaxy-s24/",
        imageLinks: [
            {
                thumb: "https://via.placeholder.com/150x150/1428A0/FFFFFF?text=Galaxy+S24",
                basic: "https://via.placeholder.com/300x300/1428A0/FFFFFF?text=Galaxy+S24",
                small: "https://via.placeholder.com/200x200/1428A0/FFFFFF?text=Galaxy+S24",
                big: "https://via.placeholder.com/600x600/1428A0/FFFFFF?text=Galaxy+S24"
            }
        ],
        minPrice: 79990,
        maxPrice: 89990,
        currentPrice: 79990,
        initPrice: 89990,
        salesCount: 67,
        isNew: 1,
        colorsProduct: [
            {
                id: 1,
                title: "Черный",
                colorName: "Черный",
                alias: "black",
                pathImg: "https://via.placeholder.com/100x100/000000/FFFFFF?text=Black"
            },
            {
                id: 2,
                title: "Белый",
                colorName: "Белый",
                alias: "white",
                pathImg: "https://via.placeholder.com/100x100/FFFFFF/000000?text=White"
            }
        ],
        offerCount: 18,
        offers: [],
        madeInUkraine: false,
        userSubscribed: false,
        __typename: "Product"
    },
    {
        id: 1004,
        title: "Электрический чайник Bosch",
        date: "2024-01-25",
        vendor: {
            title: "Bosch",
            __typename: "Vendor"
        },
        section: {
            _id: 3,
            productCategoryName: "Электрические чайники",
            category: "bt-elektrochajniki",
            subCategory: "electric-kettles",
            __typename: "Section"
        },
        isPromo: false,
        toOfficial: false,
        promoBid: null,
        lineName: "Bosch Kettle",
        linePathNew: "/kitchen/kettles/",
        imagesCount: 3,
        videosCount: 1,
        techShortSpecifications: [
            "Электрический чайник",
            "Объем: 1.7 л",
            "Мощность: 2400 Вт",
            "Материал: Нержавеющая сталь"
        ],
        techShortSpecificationsList: [
            { key: "Тип", value: "Электрический чайник" },
            { key: "Объем", value: "1.7 л" },
            { key: "Мощность", value: "2400 Вт" },
            { key: "Материал", value: "Нержавеющая сталь" }
        ],
        reviewsCount: 45,
        questionsCount: 8,
        url: "/kitchen/bosch-electric-kettle/",
        imageLinks: [
            {
                thumb: "https://via.placeholder.com/150x150/FF6B6B/FFFFFF?text=Bosch+Kettle",
                basic: "https://via.placeholder.com/300x300/FF6B6B/FFFFFF?text=Bosch+Kettle",
                small: "https://via.placeholder.com/200x200/FF6B6B/FFFFFF?text=Bosch+Kettle",
                big: "https://via.placeholder.com/600x600/FF6B6B/FFFFFF?text=Bosch+Kettle"
            }
        ],
        minPrice: 1290,
        maxPrice: 1590,
        currentPrice: 1290,
        initPrice: 1590,
        salesCount: 12,
        isNew: 0,
        colorsProduct: [],
        offerCount: 6,
        offers: [],
        madeInUkraine: false,
        userSubscribed: false,
        __typename: "Product"
    },
    {
        id: 1005,
        title: "Аксессуар для вытяжки",
        date: "2024-01-30",
        vendor: {
            title: "Electrolux",
            __typename: "Vendor"
        },
        section: {
            _id: 4,
            productCategoryName: "Аксессуары для вытяжек",
            category: "bt-aksessuary-dlya-vytyazhek",
            subCategory: "hood-accessories",
            __typename: "Section"
        },
        isPromo: true,
        toOfficial: false,
        promoBid: null,
        lineName: "Hood Accessories",
        linePathNew: "/kitchen/hood-accessories/",
        imagesCount: 2,
        videosCount: 0,
        techShortSpecifications: [
            "Аксессуар для вытяжки",
            "Совместимость: Electrolux",
            "Материал: Пластик"
        ],
        techShortSpecificationsList: [
            { key: "Тип", value: "Аксессуар для вытяжки" },
            { key: "Совместимость", value: "Electrolux" },
            { key: "Материал", value: "Пластик" }
        ],
        reviewsCount: 23,
        questionsCount: 5,
        url: "/kitchen/electrolux-hood-accessory/",
        imageLinks: [
            {
                thumb: "https://via.placeholder.com/150x150/4ECDC4/FFFFFF?text=Hood+Accessory",
                basic: "https://via.placeholder.com/300x300/4ECDC4/FFFFFF?text=Hood+Accessory",
                small: "https://via.placeholder.com/200x200/4ECDC4/FFFFFF?text=Hood+Accessory",
                big: "https://via.placeholder.com/600x600/4ECDC4/FFFFFF?text=Hood+Accessory"
            }
        ],
        minPrice: 450,
        maxPrice: 550,
        currentPrice: 450,
        initPrice: 550,
        salesCount: 8,
        isNew: 0,
        colorsProduct: [],
        offerCount: 4,
        offers: [],
        madeInUkraine: false,
        userSubscribed: false,
        __typename: "Product"
    }
];

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bifo', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Seed products
async function seedProducts() {
    try {
        // Clear existing products
        await Product.deleteMany({});
        console.log('🗑️ Cleared existing products');

        // Insert sample products
        const products = await Product.insertMany(sampleProducts);
        console.log(`✅ Successfully seeded ${products.length} products`);

        // Display some statistics
        const categories = await Product.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);

        console.log('\n📊 Products by category:');
        categories.forEach(cat => {
            console.log(`  ${cat._id}: ${cat.count} products`);
        });

        const featuredCount = await Product.countDocuments({ isFeatured: true });
        const saleCount = await Product.countDocuments({ isOnSale: true });
        
        console.log(`\n🎯 Featured products: ${featuredCount}`);
        console.log(`🏷️ Products on sale: ${saleCount}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding products:', error);
        process.exit(1);
    }
}

// Run the seeder
seedProducts(); 