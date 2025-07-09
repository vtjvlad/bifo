# Исправление ошибки SSL сертификатов

## Проблема
При запуске парсера может возникнуть ошибка:
```
unable to verify the first certificate; if the root CA is installed locally, try running Node.js with --use-system-ca
```

## Решения

### 1. Автоматическое исправление (рекомендуется)
Файлы уже исправлены и содержат настройки для игнорирования SSL ошибок.

### 2. Запуск с переменной окружения
```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 node cli-parser-simple.js
```

### 3. Запуск с флагом Node.js
```bash
node --use-system-ca cli-parser-simple.js
```

### 4. Использование альтернативного файла запуска
```bash
node run-with-ssl-fix.js
```

### 5. Использование bash скрипта
```bash
./run-parser.sh
```

## Что было исправлено

1. **В hotline-parser.js:**
   - Добавлена глобальная настройка axios для игнорирования SSL ошибок
   - Добавлены параметры для puppeteer для игнорирования сертификатов
   - Добавлена обработка SSL ошибок в методе получения токенов

2. **В cli-parser-simple.js:**
   - Добавлена переменная окружения `NODE_TLS_REJECT_UNAUTHORIZED = '0'`

3. **Созданы дополнительные файлы:**
   - `run-with-ssl-fix.js` - альтернативный способ запуска
   - `run-parser.sh` - bash скрипт для запуска

## Безопасность
⚠️ **Внимание:** Отключение проверки SSL сертификатов снижает безопасность соединения. Используйте только для разработки и тестирования.

## Альтернативные решения

### Установка корневых сертификатов
```bash
# Ubuntu/Debian
sudo apt-get install ca-certificates

# CentOS/RHEL
sudo yum install ca-certificates

# Обновление сертификатов
sudo update-ca-certificates
```

### Использование прокси
Если проблема связана с корпоративным прокси, настройте переменные окружения:
```bash
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080
``` 