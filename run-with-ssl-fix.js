#!/usr/bin/env node

// Альтернативный способ запуска парсера с исправлениями SSL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Импортируем и запускаем CLI
const HotlineCLISimple = require('./cli-parser-simple');

console.log('🔧 Запуск с исправлениями SSL...');

const cli = new HotlineCLISimple();
cli.run().catch(error => {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
}); 