const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

// Sample products data
const sampleProducts = [
    // Electronics
    {
        name: "iPhone 15 Pro",
        description: "Новейший смартфон Apple с титановым корпусом и камерой 48 МП",
        price: 89990,
        originalPrice: 99990,
        category: "electronics",
        subcategory: "smartphones",
        brand: "Apple",
        images: ["https://via.placeholder.com/400x400/007AFF/FFFFFF?text=iPhone+15+Pro"],
        mainImage: "https://via.placeholder.com/400x400/007AFF/FFFFFF?text=iPhone+15+Pro",
        stock: 25,
        sku: "IPH15PRO001",
        weight: 0.187,
        dimensions: { length: 15.9, width: 7.6, height: 0.8 },
        tags: ["смартфон", "apple", "титан", "камера"],
        specifications: {
            "Экран": "6.1 дюйма",
            "Процессор": "A17 Pro",
            "Память": "128 ГБ",
            "Камера": "48 МП"
        },
        rating: { average: 4.8, count: 156 },
        isActive: true,
        isFeatured: true,
        isOnSale: true,
        salePercentage: 10,
        warranty: "1 год"
    },
    {
        name: "MacBook Air M2",
        description: "Ультратонкий ноутбук с чипом M2 и дисплеем Liquid Retina",
        price: 129990,
        category: "electronics",
        subcategory: "laptops",
        brand: "Apple",
        images: ["https://via.placeholder.com/400x400/000000/FFFFFF?text=MacBook+Air+M2"],
        mainImage: "https://via.placeholder.com/400x400/000000/FFFFFF?text=MacBook+Air+M2",
        stock: 15,
        sku: "MBAIRM2001",
        weight: 1.24,
        dimensions: { length: 30.4, width: 21.5, height: 1.1 },
        tags: ["ноутбук", "apple", "m2", "ультратонкий"],
        specifications: {
            "Экран": "13.6 дюйма",
            "Процессор": "M2",
            "Память": "8 ГБ",
            "SSD": "256 ГБ"
        },
        rating: { average: 4.9, count: 89 },
        isActive: true,
        isFeatured: true,
        isOnSale: false
    },
    {
        name: "Samsung Galaxy S24",
        description: "Флагманский смартфон с ИИ-функциями и камерой 200 МП",
        price: 79990,
        originalPrice: 89990,
        category: "electronics",
        subcategory: "smartphones",
        brand: "Samsung",
        images: ["https://via.placeholder.com/400x400/1428A0/FFFFFF?text=Galaxy+S24"],
        mainImage: "https://via.placeholder.com/400x400/1428A0/FFFFFF?text=Galaxy+S24",
        stock: 30,
        sku: "SAMS24ULT001",
        weight: 0.232,
        dimensions: { length: 16.3, width: 7.9, height: 0.9 },
        tags: ["смартфон", "samsung", "искусственный интеллект", "камера"],
        specifications: {
            "Экран": "6.8 дюйма",
            "Процессор": "Snapdragon 8 Gen 3",
            "Память": "256 ГБ",
            "Камера": "200 МП"
        },
        rating: { average: 4.7, count: 203 },
        isActive: true,
        isFeatured: false,
        isOnSale: true,
        salePercentage: 11
    },

    // Clothing
    {
        name: "Джинсы Levi's 501",
        description: "Классические джинсы прямого кроя из денима премиум качества",
        price: 8990,
        category: "clothing",
        subcategory: "jeans",
        brand: "Levi's",
        images: ["https://via.placeholder.com/400x400/1E3A8A/FFFFFF?text=Levi's+501"],
        mainImage: "https://via.placeholder.com/400x400/1E3A8A/FFFFFF?text=Levi's+501",
        stock: 50,
        sku: "LEVI501001",
        weight: 0.4,
        dimensions: { length: 30, width: 20, height: 2 },
        tags: ["джинсы", "levi's", "классика", "деним"],
        specifications: {
            "Материал": "100% хлопок",
            "Размеры": "28-36",
            "Цвет": "Синий",
            "Стиль": "Прямой крой"
        },
        rating: { average: 4.6, count: 342 },
        isActive: true,
        isFeatured: false,
        isOnSale: false
    },
    {
        name: "Футболка Nike Dri-FIT",
        description: "Спортивная футболка с технологией отвода влаги",
        price: 3990,
        originalPrice: 4990,
        category: "clothing",
        subcategory: "t-shirts",
        brand: "Nike",
        images: ["https://via.placeholder.com/400x400/000000/FFFFFF?text=Nike+Dri-FIT"],
        mainImage: "https://via.placeholder.com/400x400/000000/FFFFFF?text=Nike+Dri-FIT",
        stock: 100,
        sku: "NIKE001",
        weight: 0.15,
        dimensions: { length: 25, width: 20, height: 1 },
        tags: ["футболка", "nike", "спорт", "дри-фит"],
        specifications: {
            "Материал": "Полиэстер",
            "Размеры": "S-XXL",
            "Цвет": "Черный",
            "Технология": "Dri-FIT"
        },
        rating: { average: 4.5, count: 178 },
        isActive: true,
        isFeatured: false,
        isOnSale: true,
        salePercentage: 20
    },

    // Furniture
    {
        name: "Диван IKEA KIVIK",
        description: "Удобный трехместный диван с подлокотниками",
        price: 45990,
        category: "furniture",
        subcategory: "sofas",
        brand: "IKEA",
        images: ["https://via.placeholder.com/400x400/8B4513/FFFFFF?text=IKEA+KIVIK"],
        mainImage: "https://via.placeholder.com/400x400/8B4513/FFFFFF?text=IKEA+KIVIK",
        stock: 8,
        sku: "IKEAKIV001",
        weight: 45,
        dimensions: { length: 220, width: 88, height: 85 },
        tags: ["диван", "ikea", "мягкая мебель", "гостиная"],
        specifications: {
            "Материал": "Ткань",
            "Размер": "220x88x85 см",
            "Цвет": "Серый",
            "Место для сидения": "3 человека"
        },
        rating: { average: 4.4, count: 67 },
        isActive: true,
        isFeatured: true,
        isOnSale: false
    },

    // Sports
    {
        name: "Футбольный мяч Adidas Champions League",
        description: "Официальный мяч Лиги Чемпионов UEFA",
        price: 5990,
        category: "sports",
        subcategory: "football",
        brand: "Adidas",
        images: ["https://via.placeholder.com/400x400/FFFFFF/000000?text=Adidas+Champions+League"],
        mainImage: "https://via.placeholder.com/400x400/FFFFFF/000000?text=Adidas+Champions+League",
        stock: 25,
        sku: "ADIDASCL001",
        weight: 0.43,
        dimensions: { length: 22, width: 22, height: 22 },
        tags: ["футбол", "adidas", "лига чемпионов", "мяч"],
        specifications: {
            "Размер": "5",
            "Материал": "Синтетическая кожа",
            "Вес": "430 г",
            "Окружность": "68-70 см"
        },
        rating: { average: 4.8, count: 234 },
        isActive: true,
        isFeatured: false,
        isOnSale: false
    },

    // Books
    {
        name: "Война и мир",
        description: "Роман-эпопея Льва Толстого в подарочном издании",
        price: 2990,
        category: "books",
        subcategory: "classic",
        brand: "АСТ",
        images: ["https://via.placeholder.com/400x400/8B0000/FFFFFF?text=Война+и+Мир"],
        mainImage: "https://via.placeholder.com/400x400/8B0000/FFFFFF?text=Война+и+Мир",
        stock: 15,
        sku: "BOOK001",
        weight: 1.2,
        dimensions: { length: 20, width: 15, height: 4 },
        tags: ["книга", "классика", "толстой", "роман"],
        specifications: {
            "Автор": "Лев Толстой",
            "Страниц": "1225",
            "Переплет": "Твердый",
            "Язык": "Русский"
        },
        rating: { average: 4.9, count: 456 },
        isActive: true,
        isFeatured: true,
        isOnSale: false
    },

    // Toys
    {
        name: "LEGO Star Wars Millennium Falcon",
        description: "Коллекционный набор из серии Star Wars",
        price: 15990,
        originalPrice: 19990,
        category: "toys",
        subcategory: "construction",
        brand: "LEGO",
        images: ["https://via.placeholder.com/400x400/FFD700/000000?text=LEGO+Millennium+Falcon"],
        mainImage: "https://via.placeholder.com/400x400/FFD700/000000?text=LEGO+Millennium+Falcon",
        stock: 5,
        sku: "LEGO001",
        weight: 2.5,
        dimensions: { length: 50, width: 40, height: 15 },
        tags: ["lego", "star wars", "конструктор", "коллекция"],
        specifications: {
            "Деталей": "754",
            "Возраст": "9+",
            "Размер модели": "50x40x15 см",
            "Серия": "Star Wars"
        },
        rating: { average: 4.9, count: 89 },
        isActive: true,
        isFeatured: true,
        isOnSale: true,
        salePercentage: 20
    },

    // Automotive
    {
        name: "Автомобильное кресло Britax Romer",
        description: "Детское автокресло группы 0+/1 с системой безопасности",
        price: 25990,
        category: "automotive",
        subcategory: "child-seats",
        brand: "Britax",
        images: ["https://via.placeholder.com/400x400/4169E1/FFFFFF?text=Britax+Romer"],
        mainImage: "https://via.placeholder.com/400x400/4169E1/FFFFFF?text=Britax+Romer",
        stock: 12,
        sku: "BRITAX001",
        weight: 4.2,
        dimensions: { length: 45, width: 44, height: 65 },
        tags: ["автокресло", "детское", "безопасность", "britax"],
        specifications: {
            "Группа": "0+/1",
            "Вес ребенка": "0-18 кг",
            "Возраст": "0-4 года",
            "Стандарт": "ECE R44/04"
        },
        rating: { average: 4.7, count: 156 },
        isActive: true,
        isFeatured: false,
        isOnSale: false
    },

    // Beauty
    {
        name: "Помада MAC Ruby Woo",
        description: "Культовая матовая помада красного цвета",
        price: 2990,
        category: "beauty",
        subcategory: "lipstick",
        brand: "MAC",
        images: ["https://via.placeholder.com/400x400/DC143C/FFFFFF?text=MAC+Ruby+Woo"],
        mainImage: "https://via.placeholder.com/400x400/DC143C/FFFFFF?text=MAC+Ruby+Woo",
        stock: 45,
        sku: "MAC001",
        weight: 0.03,
        dimensions: { length: 8, width: 1.5, height: 1.5 },
        tags: ["помада", "mac", "красная", "матовая"],
        specifications: {
            "Цвет": "Ruby Woo",
            "Текстура": "Матовая",
            "Вес": "3 г",
            "Стойкость": "До 8 часов"
        },
        rating: { average: 4.8, count: 567 },
        isActive: true,
        isFeatured: true,
        isOnSale: false
    },

    // Health
    {
        name: "Витамины Centrum",
        description: "Комплекс витаминов и минералов для взрослых",
        price: 1990,
        originalPrice: 2490,
        category: "health",
        subcategory: "vitamins",
        brand: "Centrum",
        images: ["https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=Centrum+Vitamins"],
        mainImage: "https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=Centrum+Vitamins",
        stock: 80,
        sku: "CENTRUM001",
        weight: 0.15,
        dimensions: { length: 8, width: 4, height: 4 },
        tags: ["витамины", "здоровье", "centrum", "комплекс"],
        specifications: {
            "Количество": "30 таблеток",
            "Прием": "1 раз в день",
            "Возраст": "18+",
            "Состав": "13 витаминов + 11 минералов"
        },
        rating: { average: 4.6, count: 234 },
        isActive: true,
        isFeatured: false,
        isOnSale: true,
        salePercentage: 20
    },

    // Military
    {
        name: "Тактический рюкзак 5.11 Rush 24",
        description: "Профессиональный тактический рюкзак для военных и туристов",
        price: 15990,
        category: "military",
        subcategory: "backpacks",
        brand: "5.11",
        images: ["https://via.placeholder.com/400x400/2F4F4F/FFFFFF?text=5.11+Rush+24"],
        mainImage: "https://via.placeholder.com/400x400/2F4F4F/FFFFFF?text=5.11+Rush+24",
        stock: 8,
        sku: "511001",
        weight: 1.2,
        dimensions: { length: 50, width: 30, height: 20 },
        tags: ["рюкзак", "тактический", "5.11", "военный"],
        specifications: {
            "Объем": "37 л",
            "Материал": "1050D Nylon",
            "Цвет": "Черный",
            "Вес": "1.2 кг"
        },
        rating: { average: 4.9, count: 78 },
        isActive: true,
        isFeatured: true,
        isOnSale: false
    },

    // Adult (discrete category)
    {
        name: "Массажер для тела",
        description: "Электрический массажер для расслабления мышц",
        price: 3990,
        category: "adult",
        subcategory: "massagers",
        brand: "Beurer",
        images: ["https://via.placeholder.com/400x400/FF69B4/FFFFFF?text=Body+Massager"],
        mainImage: "https://via.placeholder.com/400x400/FF69B4/FFFFFF?text=Body+Massager",
        stock: 20,
        sku: "BEURER001",
        weight: 0.8,
        dimensions: { length: 25, width: 8, height: 8 },
        tags: ["массажер", "расслабление", "здоровье"],
        specifications: {
            "Мощность": "15 Вт",
            "Режимы": "3 скорости",
            "Время работы": "15 мин",
            "Питание": "Аккумулятор"
        },
        rating: { average: 4.5, count: 45 },
        isActive: true,
        isFeatured: false,
        isOnSale: false
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