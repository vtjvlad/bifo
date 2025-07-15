const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const Category = require('../models/Category');

// Функция для создания slug из названия
function createSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Убираем специальные символы
    .replace(/[\s_-]+/g, '-') // Заменяем пробелы и подчеркивания на дефисы
    .replace(/^-+|-+$/g, ''); // Убираем дефисы в начале и конце
}

// Функция для красивого отображения названий групп
function formatGroupName(fileName) {
  const groupNames = {
    'adult': 'Товары для взрослых',
    'auto': 'Автотовары',
    'av': 'Аудио и видео',
    'bt': 'Бытовая техника',
    'computer': 'Компьютеры и ноутбуки',
    'dacha_sad': 'Дача и сад',
    'deti': 'Детские товары',
    'dom': 'Дом и быт',
    'fashion': 'Мода и стиль',
    'krasota': 'Красота и здоровье',
    'military': 'Военные товары',
    'mobile': 'Мобильные телефоны',
    'musical_instruments': 'Музыкальные инструменты',
    'pobutova_himiia': 'Бытовая химия',
    'remont': 'Ремонт и строительство',
    'sport': 'Спорт и отдых',
    'tools': 'Инструменты',
    'zootovary': 'Зоотовары'
  };

  return groupNames[fileName] || fileName;
}

async function loadCategories() {
  try {
    // Подключаемся к MongoDB
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bifo';
    await mongoose.connect(MONGO_URI);
    console.log('✅ Подключение к MongoDB успешно');

    // Очищаем коллекцию категорий
    await Category.deleteMany({});
    console.log('🗑️  Очистка коллекции категорий');

    const categoriesDir = path.join(__dirname, '../categories');
    const files = await fs.readdir(categoriesDir);
    
    let totalCategories = 0;
    let order = 0;

    for (const file of files) {
      if (!file.endsWith('.txt')) continue;

      const groupKey = file.replace('.txt', '');
      const groupName = formatGroupName(groupKey);
      const filePath = path.join(categoriesDir, file);
      
      console.log(`📂 Обработка группы: ${groupName} (${file})`);

      try {
        const content = await fs.readFile(filePath, 'utf8');
        const categories = content
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);

        for (const categoryName of categories) {
          const slug = createSlug(categoryName);
          
          // Проверяем, что slug не пустой
          if (!slug) {
            console.log(`⚠️  Пропускаем категорию с пустым slug: "${categoryName}"`);
            continue;
          }

          try {
            const category = new Category({
              name: categoryName,
              slug: slug,
              group: groupName,
              order: order++
            });

            await category.save();
            totalCategories++;
          } catch (saveError) {
            if (saveError.code === 11000) {
              console.log(`⚠️  Дубликат категории пропущен: ${categoryName}`);
            } else {
              console.error(`❌ Ошибка сохранения категории "${categoryName}":`, saveError.message);
            }
          }
        }

        console.log(`✅ Загружено ${categories.length} категорий из группы "${groupName}"`);
      } catch (fileError) {
        console.error(`❌ Ошибка чтения файла ${file}:`, fileError.message);
      }
    }

    console.log(`\n🎉 Загрузка завершена!`);
    console.log(`📊 Всего загружено категорий: ${totalCategories}`);
    
    // Показываем статистику по группам
    const groupStats = await Category.aggregate([
      {
        $group: {
          _id: '$group',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    console.log('\n📈 Статистика по группам:');
    groupStats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} категорий`);
    });

  } catch (error) {
    console.error('❌ Ошибка загрузки категорий:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📤 Соединение с MongoDB закрыто');
  }
}

// Запускаем загрузку, если скрипт вызван напрямую
if (require.main === module) {
  loadCategories().catch(console.error);
}

module.exports = { loadCategories }; 