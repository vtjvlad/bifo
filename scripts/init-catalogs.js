const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Import Catalog model
const Catalog = require('../models/Catalog');

// Catalog mapping
const catalogMapping = {
    'computer': { name: 'Компьютеры и электроника', icon: 'fas fa-laptop' },
    'auto': { name: 'Автотовары', icon: 'fas fa-car' },
    'fashion': { name: 'Одежда и мода', icon: 'fas fa-tshirt' },
    'dom': { name: 'Дом и сад', icon: 'fas fa-home' },
    'dacha_sad': { name: 'Дача и сад', icon: 'fas fa-seedling' },
    'deti': { name: 'Детские товары', icon: 'fas fa-baby' },
    'krasota': { name: 'Красота и здоровье', icon: 'fas fa-heartbeat' },
    'pobutova_himiia': { name: 'Бытовая химия', icon: 'fas fa-spray-can' },
    'musical_instruments': { name: 'Музыкальные инструменты', icon: 'fas fa-music' },
    'mobile': { name: 'Мобильные устройства', icon: 'fas fa-mobile-alt' },
    'remont': { name: 'Ремонт и строительство', icon: 'fas fa-tools' },
    'sport': { name: 'Спорт и отдых', icon: 'fas fa-dumbbell' },
    'zootovary': { name: 'Зоотовары', icon: 'fas fa-paw' },
    'tools': { name: 'Инструменты', icon: 'fas fa-wrench' },
    'bt': { name: 'Бытовая техника', icon: 'fas fa-tv' },
    'av': { name: 'Аудио и видео', icon: 'fas fa-headphones' },
    'adult': { name: 'Товары для взрослых', icon: 'fas fa-gift' },
    'military': { name: 'Военное снаряжение', icon: 'fas fa-shield-alt' },
    'power': { name: 'Электроинструменты', icon: 'fas fa-bolt' },
    'constructors-lego': { name: 'Конструкторы и LEGO', icon: 'fas fa-cubes' }
};

// Group name mapping - перевод названий групп в русские названия
const groupNameMapping = {
    // Компьютеры
    'noutbuki-pk': 'Ноутбуки и ПК',
    'setevoe-oborudovanie': 'Сетевое оборудование',
    'sredstva-multimedia': 'Средства мультимедиа',
    'nastolnye-pk-monitory': 'Настольные ПК и мониторы',
    'elektropitanie': 'Электропитание',
    'kompyuternaya-periferiya': 'Компьютерная периферия',
    'komplektuyuschie-dlya-pk': 'Комплектующие для ПК',
    'printery-mfu-plottery': 'Принтеры, МФУ, плоттеры',
    'programmnoeobespechenie': 'Программное обеспечение',
    
    // Спорт и отдых
    'sportivne': 'Спортивные товары',
    'fitnes': 'Фитнес',
    'transport': 'Транспорт',
    'turizm-kemping-plyazh': 'Туризм, кемпинг, пляж',
    'pnevmatika': 'Пневматика',
    'aktyvnyi-vidpochynok': 'Активный отдых',
    'rybalka': 'Рыбалка',
    'sportivnaya-odezhdapoint-obuv': 'Спортивная одежда и обувь',
    'bagazh': 'Багаж',
    
    // Зоотовары
    'dlya-koshek': 'Для кошек',
    'sobakam': 'Собакам',
    'dlya-ryb-i-reptilij': 'Для рыб и рептилий',
    'vyrobnyky-zoo': 'Производители зоотоваров',
    
    // Инструменты
    'sverlilnyj-elektroinstrument': 'Сверлильный электроинструмент',
    'svarochnoe-oborudovanie': 'Сварочное оборудование',
    'shlifovalnyjpoint-otreznoj-elektroinstrument': 'Шлифовальный и отрезной электроинструмент',
    'malyarnyj-instrument': 'Малярный инструмент',
    'stroitelnoe-oborudovanie': 'Строительное оборудование',
    'izmeritelnyj-instrument': 'Измерительный инструмент',
    'elektroinstrument': 'Электроинструмент',
    'ruchnoj-instrument': 'Ручной инструмент',
    'stanki': 'Станки',
    'stolyarnyj-instrument': 'Столярный инструмент',
    'populyarno-seychas-tools': 'Популярно сейчас - инструменты',
    
    // Бытовая техника
    'krupnaya-bytovaya-tehnika': 'Крупная бытовая техника',
    'vstraivaemaya-tehnika': 'Встраиваемая техника',
    'klimaticheskaya-tehnika': 'Климатическая техника',
    'tehnika-dlya-doma': 'Техника для дома',
    'personalnyi-dogliad': 'Персональный уход',
    'melkaya-tehnika-dlya-kuhni': 'Мелкая техника для кухни',
    'smart-technika': 'Умная техника',
    'populyarno-seychas-bt': 'Популярно сейчас - бытовая техника',
    
    // Аудио и видео
    'televisions': 'Телевизоры',
    'televizory-proektory': 'Телевизоры и проекторы',
    'projectors': 'Проекторы',
    'headphones': 'Наушники',
    'audio': 'Аудио',
    'videokamery-i-videooborudovanie': 'Видеокамеры и видеооборудование',
    'fotoapparaty-obektivy': 'Фотоаппараты и объективы',
    
    // Товары для взрослых
    'intim': 'Интимные товары',
    'eroticheskaya-odezhda': 'Эротическая одежда',
    'napitki-alkogol': 'Напитки и алкоголь',
    
    // Военное снаряжение
    'tekhnycheskoe-snariazhenye': 'Техническое снаряжение',
    'taktichniy-odyag': 'Тактическая одежда',
    'amunytsyia': 'Амуниция',
    'pokhodnoe-snariazhenye': 'Походное снаряжение',
    'zdorove-hyhyena': 'Здоровье и гигиена',
    
    // Электроинструменты
    'energy': 'Энергетика',
    'internet-bez-svitla': 'Интернет без света',
    'energosberezhennya': 'Энергосбережение',
    
    // Конструкторы
    'age-lego': 'Конструкторы по возрасту',
    'themes-lego': 'Конструкторы по темам',
    'categories-lego': 'Категории конструкторов',
    
    // Мода
    'naruchnye--chasy': 'Наручные часы',
    'smart--chasy': 'Умные часы',
    'sumki-i-aksessuary': 'Сумки и аксессуары',
    'dlya-sporta': 'Для спорта',
    
    // Музыкальные инструменты
    'gitary': 'Гитары',
    'klavishnye-instrumenty': 'Клавишные инструменты',
    'smychkovye-instrumenty': 'Смычковые инструменты',
    'etnicheskie-instrumenty': 'Этнические инструменты',
    'udarnye-instrumenty': 'Ударные инструменты',
    'duhovye-instrumenty': 'Духовые инструменты',
    'muzykalnoe-oborudovanie': 'Музыкальное оборудование',
    
    // Автотовары
    'shiny-i-diski': 'Шины и диски',
    'akkumulyatory': 'Аккумуляторы',
    'avtomobilnoe-audio-i-video': 'Автомобильное аудио и видео',
    'avto-svet': 'Автосвет',
    'avtooborudovanie': 'Автооборудование',
    'avtohimiya': 'Автохимия',
    'tehpomosch': 'Техпомощь',
    'avtoelektronika': 'Автоэлектроника',
    'moto': 'Мото',
    
    // Дом и сад
    'mebel': 'Мебель',
    'domashnij-tekstil': 'Домашний текстиль',
    'produkty-napitki-alkogol': 'Продукты, напитки, алкоголь',
    'posuda': 'Посуда',
    'bytovaya-himiyapoint-hoztovary': 'Бытовая химия и хозяйственные товары',
    'umnyj--dom': 'Умный дом',
    'osveschenie-electrica': 'Освещение и электрика',
    'novogodnie-tovary': 'Новогодние товары',
    'interer': 'Интерьер',
    
    // Дача и сад
    'sadovaya-tehnika': 'Садовая техника',
    'dachnoe-elektropitanie': 'Дачное электропитание',
    'otopleniepoint-vodonagrevateli': 'Отопление и водонагреватели',
    'vodosnabzheniepoint-polivpoint-kanalizaciya': 'Водоснабжение, полив, канализация',
    'sadovaya-mebelpoint-interer': 'Садовая мебель и интерьер',
    'sadovodstvo-fermerstvo': 'Садоводство и фермерство',
    'ruchnoj-sadovyj-instrument': 'Ручной садовый инструмент',
    'internet-i-televidenie': 'Интернет и телевидение',
    
    // Ремонт
    'vodonagrevateli-otoplenie': 'Водонагреватели и отопление',
    'polypoint-oknapoint-dveri': 'Пол, окна, двери',
    
    // Бытовая химия
    'zasoby-dlia-prannia': 'Средства для стирки',
    'zasoby-dlia-myttia-posudu': 'Средства для мытья посуды',
    'zasoby-dohliadu-za-pobutovoiu-tekhnikoiu': 'Средства ухода за бытовой техникой',
    'zasoby-dlia-prybyrannia': 'Средства для уборки',
    'zasoby-dohliadu-za-santekhnikoiu': 'Средства ухода за сантехникой',
    'hospodarski-tovary': 'Хозяйственные товары',
    'vulychna-zona': 'Уличная зона',
    'zasoby-dohliadu-za-vzuttiam': 'Средства ухода за обувью',
    
    // Популярные категории
    'populyarno-seychas-remont': 'Популярно сейчас - ремонт',
    'populyarno-seychas-sport': 'Популярно сейчас - спорт',
    'populyarno-seychas-dom': 'Популярно сейчас - дом',
    'populyarno-seychas-auto': 'Популярно сейчас - авто',
    'populyarno-seychas-fashion': 'Популярно сейчас - мода',
    'populyarno-seychas-dacha_sad': 'Популярно сейчас - дача и сад',
    'populyarno-seychas-deti': 'Популярно сейчас - детские товары',
    'populyarno-seychas-krasota': 'Популярно сейчас - красота',
    'populyarno-seychas-pobutova_himiia': 'Популярно сейчас - бытовая химия',
    'populyarno-seychas-musical_instruments': 'Популярно сейчас - музыкальные инструменты',
    'populyarno-seychas-mobile': 'Популярно сейчас - мобильные устройства',
    'populyarno-seychas-zootovary': 'Популярно сейчас - зоотовары',
    'populyarno-seychas-av': 'Популярно сейчас - аудио и видео',
    'populyarno-seychas-adult': 'Популярно сейчас - товары для взрослых',
    'populyarno-seychas-military': 'Популярно сейчас - военное снаряжение',
    'populyarno-seychas-power': 'Популярно сейчас - электроинструменты',
    'populyarno-seychas-constructors-lego': 'Популярно сейчас - конструкторы'
};

// Category name mapping - перевод slug'ов в русские названия
const categoryNameMapping = {
    // Компьютеры
    'noutbuki-netbuki': 'Ноутбуки и нетбуки',
    'planshety': 'Планшеты',
    'elektronnye-knigi': 'Электронные книги',
    'modemy-3g-gsm-cdma': 'Модемы 3G/GSM/CDMA',
    'podstavki-dlya-noutbukov': 'Подставки для ноутбуков',
    'chehly-dlya-planshetov': 'Чехлы для планшетов',
    'sumki-kejsy-ryukzaki-dlya-noutbukov': 'Сумки, кейсы, рюкзаки для ноутбуков',
    'bloki-pitaniya-dlya-noutbukov': 'Блоки питания для ноутбуков',
    'flash-karty': 'Флеш-карты',
    'zaschitnaya-plenka-dlya-planshetov': 'Защитная пленка для планшетов',
    'zhestkie-diski': 'Жесткие диски',
    'diski-ssd': 'Диски SSD',
    'chehly-oblozhki-dlya-elektronnyh-knig': 'Чехлы, обложки для электронных книг',
    'akkumulyatory-dlya-noutbukov': 'Аккумуляторы для ноутбуков',
    'setevye-adaptery': 'Сетевые адаптеры',
    'bluetooth-adaptery': 'Bluetooth адаптеры',
    'kompyuternye-aksessuary': 'Компьютерные аксессуары',
    
    // Сетевое оборудование
    'besprovodnoe-oborudovanie': 'Беспроводное оборудование',
    'kommutatory': 'Коммутаторы',
    'antenny-dlya-besprovodnyh-setej': 'Антенны для беспроводных сетей',
    'marshrutizatory': 'Маршрутизаторы',
    'setevye-nakopiteli-nas': 'Сетевые накопители NAS',
    'powerline-adaptery': 'Powerline адаптеры',
    'kommutatory-konsolej-kvm-switches': 'Коммутаторы консолей KVM',
    'konvertory': 'Конвертеры',
    'mezhsetevye-ekrany': 'Межсетевые экраны',
    'kabeli-quotvitaya-paraquot-patch-kordy': 'Кабели "витая пара", патч-корды',
    'montazhnye-shkafy-i-stojki': 'Монтажные шкафы и стойки',
    'instrument-dlya-prokladki-seti': 'Инструмент для прокладки сети',
    'ip--skype-telefony': 'IP/Skype телефоны',
    'voip-shlyuzy': 'VoIP шлюзы',
    'oborudovanie-dlya-konferenc-svyazi': 'Оборудование для конференц-связи',
    
    // Мультимедиа
    'igrovye-pristavki': 'Игровые приставки',
    'igry-dlya-pristavok': 'Игры для приставок',
    'gejmpady-dzhojstiki-ruli': 'Геймпады, джойстики, рули',
    'nastolnye-kompyutery': 'Настольные компьютеры',
    'videokarty': 'Видеокарты',
    'dopolnitelnoe-oborudovanie-dlya-igrovyh-pristavok': 'Дополнительное оборудование для игровых приставок',
    'monitory': 'Мониторы',
    'klaviatury': 'Клавиатуры',
    'kovriki-dlya-myshi': 'Коврики для мыши',
    'web-kamery': 'Веб-камеры',
    'opticheskie-nakopiteli': 'Оптические накопители',
    'diski-dvd-cd-blu-ray': 'Диски DVD/CD/Blu-ray',
    
    // Комплектующие
    'processory': 'Процессоры',
    'moduli-pamyati-dlya-pk-i-noutbukov': 'Модули памяти для ПК и ноутбуков',
    'materinskie-platy': 'Материнские платы',
    'korpusa': 'Корпуса',
    'kulery-i-radiatory': 'Кулеры и радиаторы',
    'bloki-pitaniya': 'Блоки питания',
    'karmany-dlya-hdd': 'Карманы для HDD',
    'termopasta': 'Термопаста',
    'zvukovye-karty': 'Звуковые карты',
    'tv-tyunery': 'TV тюнеры',
    'kontrollery-platy': 'Контроллеры платы',
    
    // Принтеры
    'printery-kopiry-mfu': 'Принтеры, копиры, МФУ',
    '3d-printery': '3D принтеры',
    '3d-ruchki': '3D ручки',
    'plottery': 'Плоттеры',
    'skanery': 'Сканеры',
    'laminatory': 'Ламинаторы',
    'matrichnye-printery': 'Матричные принтеры',
    'print-servery': 'Принт-серверы',
    'specializirovannye-printery': 'Специализированные принтеры',
    'unichtozhiteli-dokumentov': 'Уничтожители документов',
    'kartridzhi-dlya-printerov-i-mfu': 'Картриджи для принтеров и МФУ',
    'chernila-tonery': 'Чернила, тонеры',
    'sistemy-nepreryvnoj-podachi-chernil': 'Системы непрерывной подачи чернил',
    'bumaga-ofisnaya': 'Бумага офисная',
    'bumaga-i-plenka-dlya-plotterov': 'Бумага и пленка для плоттеров',
    'pechatayuschie-golovki': 'Печатающие головки',
    'rashodnye-materialy-dlya-3d-printerov': 'Расходные материалы для 3D принтеров',
    
    // Электропитание
    'stabilizatory-napryazheniya': 'Стабилизаторы напряжения',
    'istochniki-besperebojnogo-pitaniya': 'Источники бесперебойного питания',
    'akkumulyatory-dlya-ibp': 'Аккумуляторы для ИБП',
    'setevye-filtry': 'Сетевые фильтры',
    'akkumulyatory-batarejki': 'Аккумуляторы, батарейки',
    'zaryadnye-ustrojstva-dlya-akkumulyatorov-aa-aaa': 'Зарядные устройства для аккумуляторов AA/AAA',
    
    // Периферия
    'myshi-klaviatury': 'Мыши, клавиатуры',
    'usb-flash-drajvy': 'USB флеш-драйвы',
    'kardridery': 'Кардридеры',
    'graficheskie-planshety': 'Графические планшеты',
    'kabeli-usb': 'Кабели USB',
    'kabeli-hdmi-dvi-vga': 'Кабели HDMI/DVI/VGA',
    'aksessuary-dlya-graficheskih-planshetov': 'Аксессуары для графических планшетов',
    
    // Программное обеспечение
    'programmnoe-obespechenie': 'Программное обеспечение',
    
    // Автотовары
    'avtomobilnye-akkumulyatory': 'Автомобильные аккумуляторы',
    'preobrazovateli-napryazheniya': 'Преобразователи напряжения',
    
    // Мобильные устройства
    'zaryadnye-ustrojstva-dlya-mobilnyh-telefonov': 'Зарядные устройства для мобильных телефонов',
    'avtomobilnye-derzhateli-dlya-smartfonov-i-kpk': 'Автомобильные держатели для смартфонов и КПК',
    'stilusy-dlya-smartfonov-i-planshetov': 'Стилусы для смартфонов и планшетов',
    'umnye-chasy-smartwatch': 'Умные часы SmartWatch',
    'zaryadnye-stancii': 'Зарядные станции',
    'universalnye-batarei': 'Универсальные батареи',
    'naushniki-garnitury': 'Наушники, гарнитуры',
    'ochki-virtualnoj-realnosti': 'Очки виртуальной реальности',
    
    // Дом и сад
    'ofisnye-kresla': 'Офисные кресла',
    'ofisnye-i-kompyuternye-stoly': 'Офисные и компьютерные столы',
    'ip-kamery-videonablyudeniya': 'IP камеры видеонаблюдения',
    'aksessuary-dlya-svetodiodnyh-lamp-i-lent': 'Аксессуары для светодиодных ламп и лент',
    
    // Музыкальные инструменты
    'mikrofony': 'Микрофоны',
    
    // Аудио и видео
    'akusticheskie-kolonki': 'Акустические колонки',
    'fotobumaga': 'Фотобумага',
    
    // Мода
    'gorodskie-ryukzaki': 'Городские рюкзаки',
    
    // Спорт и активный отдых
    'velosipedy': 'Велосипеды',
    'elektrovelosipedy': 'Электровелосипеды',
    'samokaty': 'Самокаты',
    'velosipednye-shlemy': 'Велосипедные шлемы',
    'velokompyutery': 'Велокомпьютеры',
    'velosipednye-perchatki': 'Велосипедные перчатки',
    'velosipednye-pokryshki': 'Велосипедные покрышки',
    'velosipednye-kamery-i-pokryshki': 'Велосипедные камеры и покрышки',
    'velozapchasti': 'Велозапчасти',
    'velosipednye-nasosy': 'Велосипедные насосы',
    'odezhda-dlya-velosipedistov': 'Одежда для велосипедистов',
    'velosipednoe-navesnoe-oborudovanie': 'Велосипедное навесное оборудование',
    'detskie-velokresla': 'Детские велокресла',
    'krepleniya-dlya-velosipedov': 'Крепления для велосипедов',
    'velosumki-bagazhniki': 'Велосумки, багажники',
    'ryukzaki': 'Рюкзаки',
    'velofary': 'Велофары',
    'veloinstrument': 'Велоинструмент',
    'sportivnye-ochki': 'Спортивные очки',
    'velokosmetika': 'Велокосметика',
    'termobele': 'Термобелье',
    'sportivnye-kurtki-vetrovki': 'Спортивные куртки, ветровки',
    'ganteli-atleticheskie-giri': 'Гантели, атлетические гири',
    'shtangi-grify-diski': 'Штанги, гривы, диски',
    'perchatki-dlya-fitnesa-kulturizma': 'Перчатки для фитнеса, культуризма',
    'atleticheskie-poyasa': 'Атлетические пояса',
    'oborudovanie-dlya-boksa-i-edinoborstv': 'Оборудование для бокса и единоборств',
    'ochki-dlya-plavaniya': 'Очки для плавания',
    'shapochki-dlya-plavaniya': 'Шапочки для плавания',
    'berushi': 'Беруши',
    'akvafitnes': 'Аквафитнес',
    'gidrokostyumy': 'Гидрокостюмы',
    'maski-dlya-dajvinga': 'Маски для дайвинга',
    'lasty': 'Ласты',
    'tovary-dlya-dajvinga': 'Товары для дайвинга',
    'fonariki': 'Фонарики',
    'lyzhi': 'Лыжи',
    'konki': 'Коньки',
    'snoubordy': 'Сноуборды',
    'sanki': 'Санки',
    'gornolyzhnye-shlemy': 'Горнолыжные шлемы',
    'gornolyzhnye-maski': 'Горнолыжные маски',
    'gornolyzhnye-kurtki': 'Горнолыжные куртки',
    'botinki-dlya-lyzh-i-snoubordov': 'Ботинки для лыж и сноубордов',
    'sportivnoe-pitanie': 'Спортивное питание',
    'shejkery': 'Шейкеры',
    'biologicheski-aktivnye-dobavki-bad': 'Биологически активные добавки (БАД)',
    'turisticheskaya-posuda': 'Туристическая посуда',
    'begovye-dorozhki': 'Беговые дорожки',
    'ellipticheskie-trenazhery-orbitreki': 'Эллиптические тренажеры, орбитреки',
    'velotrenazhery-i-orbitreki': 'Велотренажеры и орбитреки',
    'grebnye-trenazhery-946': 'Гребные тренажеры',
    'steppery': 'Степперы',
    'silovye-trenazhery': 'Силовые тренажеры',
    'sportivnye-kompleksy': 'Спортивные комплексы',
    'trenazhery-opcii': 'Тренажеры опции',
    'sportivnye-chasy': 'Спортивные часы',
    
    // Фитнес
    'kovriki-maty': 'Коврики, маты',
    'myachi-dlya-fitnesa': 'Мячи для фитнеса',
    'jogapoint-pilates': 'Йога и пилатес',
    'gimnasticheskie-tovary': 'Гимнастические товары',
    'espandery': 'Эспандеры',
    'trekkingovye-palki': 'Треккинговые палки',
    
    // Транспорт
    'elektrosamokaty': 'Электросамокаты',
    'motocykly': 'Мотоциклы',
    'giroskuterypoint-girobordy': 'Гироскутеры и гироборды',
    'aksessuary-dlya-girobordov': 'Аксессуары для гиробордов',
    
    // Туризм и кемпинг
    'nozhi-multituly': 'Ножи, мультитулы',
    'radiostancii': 'Радиостанции',
    'gps-navigatory': 'GPS навигаторы',
    'binokli-teleskopy-mikroskopy': 'Бинокли, телескопы, микроскопы',
    'portativnyj-dush': 'Портативный душ',
    'kompressionnye-i-germomeshki': 'Компрессионные и гермомешки',
    'sumki-pervoj-pomoschi-aptechki': 'Сумки первой помощи, аптечки',
    'kompasy': 'Компасы',
    'snaryazhenie-dlya-alpinizma': 'Снаряжение для альпинизма',
    'turisticheskie-poyasnye-sumki': 'Туристические поясные сумки',
    'pitevye-sistemy': 'Питьевые системы',
    'turisticheskie-grelki': 'Туристические грелки',
    'zaryadnye-ustrojstva-na-solnechnyh-batareyah': 'Зарядные устройства на солнечных батареях',
    'aksessuary-dlya-nozhej': 'Аксессуары для ножей',
    'dopolnitelnoe-oborudovanie-dlya-radiostancij': 'Дополнительное оборудование для радиостанций',
    'sredstva-ochistki-vody': 'Средства очистки воды',
    'gazovye-gorelki': 'Газовые горелки',
    'nabory-dlya-piknika': 'Наборы для пикника',
    'sredstva-dlya-rozzhiga-ognya': 'Средства для розжига огня',
    'portativnye-holodilniki': 'Портативные холодильники',
    'sumki-holodilniki': 'Сумки-холодильники',
    'termosy': 'Термосы',
    'akkumulyatory-holoda': 'Аккумуляторы холода',
    'turisticheskie-filtry-dlya-vody': 'Туристические фильтры для воды',
    'naduvnye-lodki': 'Надувные лодки',
    'lodochnye-motory': 'Лодочные моторы',
    'eholoty': 'Эхолоты',
    'osnastka-lodok': 'Оснастка лодок',
    'chehlypoint-nakidki-dlya-ryukzakov': 'Чехлы и накидки для рюкзаков',
    'palatki': 'Палатки',
    'aksessuary-i-dopolnitelnoe-oborudovanie-dlya-fonarikov': 'Аксессуары и дополнительное оборудование для фонариков',
    'dopolnitelnoe-oborudovanie-dlya-binoklejpoint-teleskopovpoint-mikroskopov': 'Дополнительное оборудование для биноклей, телескопов, микроскопов',
    'spalnye-meshki': 'Спальные мешки',
    'naduvnye-matrasy-i-kresla': 'Надувные матрасы и кресла',
    'kempingovaya-mebel': 'Кемпинговая мебель',
    'gamaki': 'Гамаки',
    'turisticheskie-kovriki': 'Туристические коврики',
    'dopolnitelnoe-oborudovanie-dlya-palatok': 'Дополнительное оборудование для палаток',
    
    // Пневматика
    'pnevmaticheskie-vintovki': 'Пневматические винтовки',
    'pribory-nochnogo-videniyapoint-teplovizory': 'Приборы ночного видения и тепловизоры',
    'pnevmaticheskie-pistolety-i-revolvery': 'Пневматические пистолеты и револьверы',
    'aksessuary-dlya-strelkovogo-oruzhiya': 'Аксессуары для стрелкового оружия',
    'boepripasy-k-pnevmatike': 'Боеприпасы к пневматике',
    'opticheskie-i-kollimatornye-pritsely': 'Оптические и коллиматорные прицелы',
    'bronezhilety-i-razgruzochnye-takticheskie-zhilety': 'Бронежилеты и разгрузочные тактические жилеты',
    'sejfy': 'Сейфы',
    'takticheskaya-odezhda': 'Тактическая одежда',
    'takticheskoe-snaryazhenie-i-amuniciya': 'Тактическое снаряжение и амуниция',
    'arbalety-i-luki': 'Арбалеты и луки',
    'trekkingovaya-obuv': 'Треккинговая обувь',
    'odezhda-rybolova': 'Одежда рыболова',
    'sportivnye-noski-golfy': 'Спортивные носки, гольфы',
    'grabli-lopaty-vily': 'Грабли, лопаты, вилы',
    
    // Активный отдых
    'sumki': 'Сумки',
    'sadovaya-mebel': 'Садовая мебель',
    'plyazhnye-naduvnye-igrushki-i-bassejny': 'Пляжные надувные игрушки и бассейны',
    'sapserfing-sup': 'Сапсерфинг SUP',
    'polotenca': 'Полотенца',
    'solncezaschitnye-ochki': 'Солнцезащитные очки',
    'detskie-sportivnye-igry': 'Детские спортивные игры',
    'sredstva-dlya-zagara': 'Средства для загара',
    'tennisnye-stoly': 'Теннисные столы',
    'raketki-dlya-nastolnogo-tennisa': 'Ракетки для настольного тенниса',
    'badminton': 'Бадминтон',
    'nastolnyj-tennis-raznoe': 'Настольный теннис разное',
    'basketbol': 'Баскетбол',
    'igrovye-myachi': 'Игровые мячи',
    'rolikovye-konki': 'Роликовые коньки',
    'zaschita-dlya-rolikov': 'Защита для роликов',
    'darts': 'Дартс',
    
    // Рыбалка
    'udilischa': 'Удилища',
    'spinningovye-katushki': 'Спиннинговые катушки',
    'leska': 'Леска',
    'rybolovnye-sumki-yaschiki-korobki': 'Рыболовные сумки, ящики, коробки',
    'poplavki': 'Поплавки',
    'obuv-dlya-rybalki-i-ohoty': 'Обувь для рыбалки и охоты',
    'chehly-tubusy-sumki-dlya-udilisch': 'Чехлы, тубусы, сумки для удилищ',
    'podstavki-dlya-udilisch': 'Подставки для удилищ',
    'instrument-rybolova': 'Инструмент рыболова',
    'podsaki': 'Подсаки',
    'voblery': 'Воблеры',
    'blesny': 'Блесны',
    'balansiry': 'Балансиры',
    'silikonovye-primanki': 'Силиконовые приманки',
    'povodkipoint-povodkovyj-material': 'Поводки и поводковый материал',
    'signalizatory-poklevki': 'Сигнализаторы поклевки',
    'kryuchki': 'Крючки',
    'tovary-dlya-rybalki-raznoe': 'Товары для рыбалки разное',
    'korma-i-attraktanty': 'Корма и аттрактанты',
    'kormushki': 'Кормушки',
    
    // Спортивная одежда
    'sportivnye-kostyumy': 'Спортивные костюмы',
    'sportivnye-bryuki': 'Спортивные брюки',
    'sportivnye-reglany-tolstovki': 'Спортивные регланы, толстовки',
    'sportivnye-futbolki-tenniski': 'Спортивные футболки, тенниски',
    'sportivnye-golovnye-ubory': 'Спортивные головные уборы',
    'krossovki': 'Кроссовки',
    
    // Багаж
    'chemodany-dorozhnye-sumki': 'Чемоданы, дорожные сумки',
    'chehlypoint-nakidki-dlya-ryukzakov': 'Чехлы и накидки для рюкзаков',
    'organajzery-dlya-odezhdy': 'Органайзеры для одежды',
    'detskie-sumki-i-ryukzaki': 'Детские сумки и рюкзаки',
    'kosmetichki': 'Косметички',
    'sumki-dlya-foto-i-video': 'Сумки для фото и видео',
    
    // Зоотовары
    'korm-dlya-koshek': 'Корм для кошек',
    'napolniteli-tualetov-dlya-koshek': 'Наполнители туалетов для кошек',
    'gruming-dlya-sobak-i-koshek': 'Груминг для собак и кошек',
    'uhod-i-gigiena-dlya-zhivotnyh': 'Уход и гигиена для животных',
    'vitaminy-dlya-zhivotnyh': 'Витамины для животных',
    'povodki-shlei': 'Поводки, шлейки',
    'kogtetochki': 'Когтеточки',
    'posuda-dlya-zhivotnyh': 'Посуда для животных',
    'igrushki-dlya-zhivotnyh': 'Игрушки для животных',
    'korm-dlya-sobak': 'Корм для собак',
    'oshejniki': 'Ошейники',
    'odezhda-i-obuv-dlya-sobak': 'Одежда и обувь для собак',
    'gigiena-doma': 'Гигиена дома',
    'akvariumy': 'Аквариумы',
    'korm-dlya-ryb-i-reptilij': 'Корм для рыб и рептилий',
    'filtry-dlya-akvariumov': 'Фильтры для аквариумов',
    'aksessuary-dlya-akvariumov': 'Аксессуары для аквариумов',
    'pompy-i-kompressory-dlya-akvariumov': 'Помпы и компрессоры для аквариумов',
    'termoregulyaciya-dlya-akvariumov': 'Терморегуляция для аквариумов',
    'osveschenie-dlya-akvariumov': 'Освещение для аквариумов',
    'oborudovanie-dlya-akvariumov-raznoe': 'Оборудование для аквариумов разное',
    'royal-canin': 'Royal Canin',
    'purina': 'Purina',
    'brit': 'Brit',
    'klub-4-lapy': 'Клуб 4 Лапы',
    'gourmet': 'Gourmet',
    'acana': 'Acana',
    'hills-pet-nutrition': 'Hills Pet Nutrition',
    'petkit': 'Petkit',
    'trixie': 'Trixie',
    'animall': 'Animall',
    'waudog': 'Waudog',
    'provet': 'Provet',
    'priroda': 'Природа',
    
    // Инструменты
    'shurupoverty': 'Шуруповерты',
    'perforatory': 'Перфораторы',
    'mnogofunkcionalnyj-instrument': 'Многофункциональный инструмент',
    'sverla-bury': 'Сверла, буры',
    'patronypoint-nasadki-dlya-sverlilnogo-instrumenta': 'Патроны и насадки для сверлильного инструмента',
    'akkumulyatory-zaryadnye-ustrojstva-dlya-elektroinstrumentov': 'Аккумуляторы, зарядные устройства для электроинструментов',
    'svarochnye-invertory': 'Сварочные инверторы',
    'sredstva-individualnoj-zaschity-dlya-svarochnyh-rabot': 'Средства индивидуальной защиты для сварочных работ',
    'rashodnye-svarochnye-materialy': 'Расходные сварочные материалы',
    'komplektuyuschie-dlya-svarochnogo-oborudovaniya': 'Комплектующие для сварочного оборудования',
    'uglovye-shlifmashiny-bolgarki': 'Угловые шлифмашины (болгарки)',
    'elektrolobziki': 'Электролобзики',
    'elektronozhnicy': 'Электроножницы',
    'diskovye-pily': 'Дисковые пилы',
    'vibracionnye-shlifmashiny': 'Вибрационные шлифмашины',
    'lentochnye-shlifmashiny': 'Ленточные шлифмашины',
    'sabelnye-pily': 'Сабельные пилы',
    'polirovalnye-mashiny': 'Полировальные машины',
    'otreznye-shlifovalnye-diski': 'Отрезные шлифовальные диски',
    'pryamye-schetochnye-shlifmashiny': 'Прямые щеточные шлифмашины',
    'cepnye-pily': 'Цепные пилы',
    'kompressory-i-prinadlezhnosti': 'Компрессоры и принадлежности',
    'kraskopulty': 'Краскопульты',
    'prinadlezhnosti-dlya-kompressorov-i-pnevmoinstrumenta': 'Принадлежности для компрессоров и пневмоинструмента',
    'valiki-malyarnye-kisti': 'Валики, малярные кисти',
    'emkosti-stroitelnye': 'Емкости строительные',
    'nozhi-dlya-otdelochnyh-rabot': 'Ножи для отделочных работ',
    'pistolety-dlya-germetikovpoint-pen': 'Пистолеты для герметиков и пены',
    'urovni-stroitelnye': 'Уровни строительные',
    'shpateli': 'Шпатели',
    'yaschiki-dlya-instrumentov': 'Ящики для инструментов',
    'generatory': 'Генераторы',
    'lestnicy-stremyanki': 'Лестницы, стремянки',
    'stroitelnye-pylesosypoint-podmetalnye-mashiny': 'Строительные пылесосы и подметальные машины',
    'plitkorezy': 'Плиткорезы',
    'betonomeshalki': 'Бетономешалки',
    'shtroborezy': 'Штроборезы',
    'vibroplitypoint-glubinnye-vibratory': 'Виброплиты и глубинные вибраторы',
    'zatirochnye-mashiny': 'Затирочные машины',
    'lomypoint-gvozdodery': 'Ломы и гвоздодеры',
    'motobury': 'Мотобуры',
    'steklorezy': 'Стеклорезы',
    'pogruzchikipoint-shtabelerypoint-gidravlicheskie-telezhki': 'Погрузчики, штабелеры, гидравлические тележки',
    'stroitelnye-vyshki-pomosty-lesa': 'Строительные вышки, помосты, леса',
    'benzorezy': 'Бензорезы',
    'tali': 'Тали',
    'tachki-sadovye-stroitelnye': 'Тачки садовые, строительные',
    'prinadlezhnosti-dlya-vibroplitpoint-glubinnyh-vibratorov': 'Принадлежности для виброплит и глубинных вибраторов',
    'prinadlezhnosti-dlya-motoburov': 'Принадлежности для мотобуров',
    'lazernyj-izmeritelnyj-instrument': 'Лазерный измерительный инструмент',
    'multimetry': 'Мультиметры',
    'izmeritelnye-ruletki': 'Измерительные рулетки',
    'urovni-stroitelnye': 'Уровни строительные',
    'specializirovannyj-izmeritelnyj-instrument': 'Специализированный измерительный инструмент',
    'prinadlezhnosti-dlya-lazernogo-i-opticheskogo-izmeritelnogo-instrumenta': 'Принадлежности для лазерного и оптического измерительного инструмента',
    'payalniki-i-payalnye-stancii': 'Паяльники и паяльные станции',
    'elektrorubanki': 'Электрорубанки',
    'tehnicheskie-feny': 'Технические фены',
    'metalloiskateli': 'Металлоискатели',
    'kleevye-pistolety': 'Клеевые пистолеты',
    'elektrosteplery-gvozdezabivateli': 'Электростеплеры, гвоздезабиватели',
    'sterzhni-dlya-kleevyh-pistoletov': 'Стержни для клеевых пистолетов',
    'kraskopulty': 'Краскопульты',
    'prinadlezhnosti-dlya-metalloiskatelej': 'Принадлежности для металлоискателей',
    'payalnye-prinadlezhnosti': 'Паяльные принадлежности',
    'lupy': 'Лупы',
    'nabory-instrumentov': 'Наборы инструментов',
    'otvertki': 'Отвертки',
    'tiski-strubciny': 'Тиски, струбцины',
    'ploskogubcy-kruglogubcy-passatizhi': 'Плоскогубцы, круглогубцы, пассатижи',
    'torcevye-golovki': 'Торцевые головки',
    'semniki-universalnye': 'Семники универсальные',
    'treschetkipoint-dinamometricheskie-klyuchi': 'Трещетки и динамометрические ключи',
    'klyuchi-trubnye': 'Ключи трубные',
    'skobozabivateli-skoby': 'Скобозабиватели, скобы',
    'shestigrannye-klyuchi': 'Шестигранные ключи',
    'gaechnye-razvodnye-klyuchi': 'Гаечные разводные ключи',
    'vorotkipoint-udlinitelipoint-perehodniki': 'Воротки, удлинители, переходники',
    'zaklepochniki': 'Заклепочники',
    'zubila-stameski-doloto': 'Зубила, стамески, долото',
    'molotki': 'Молотки',
    'napilniki-rashpili': 'Напильники, рашпили',
    'nozhnicy-po-metallu': 'Ножницы по металлу',
    'nozhovki': 'Ножовки',
    'rezbonareznoj-instrument': 'Резьбонарезной инструмент',
    'truborezy': 'Труборезы',
    'frezery': 'Фрезеры',
    'zatochnye-stanki': 'Заточные станки',
    'rejsmusovye-stanki': 'Рейсмусовые станки',
    'sverlilnye-stanki': 'Сверлильные станки',
    'dopolnitelnoe-oborudovanie-dlya-stankov': 'Дополнительное оборудование для станков',
    'lentochnopilnye-stanki': 'Ленточнопильные станки',
    'tokarnye-stanki': 'Токарные станки',
    'frezernye-stanki': 'Фрезерные станки',
    'stanki-ostalnye': 'Станки остальные',
    'frezy-dlya-stankov': 'Фрезы для станков',
    'topory': 'Топоры',
    'rubanki': 'Рубанки',
    
    // Бытовая техника
    'stiralnye-i-sushilnye-mashiny': 'Стиральные и сушильные машины',
    'sushilnye-mashiny': 'Сушильные машины',
    'holodilniki': 'Холодильники',
    'posudomoechnye-mashiny': 'Посудомоечные машины',
    'kuhonnye-plity-i-poverhnosti': 'Кухонные плиты и поверхности',
    'varochnye-poverhnosti': 'Варочные поверхности',
    'vytyazhki': 'Вытяжки',
    'duhovki': 'Духовки',
    'vinnye-shkafy': 'Винные шкафы',
    'aksessuary-dlya-stiralnyh-mashin': 'Аксессуары для стиральных машин',
    'aksessuary-dlya-vytyazhek': 'Аксессуары для вытяжек',
    'mikrovolnovye-pechi': 'Микроволновые печи',
    'kofevarki': 'Кофеварки',
    'vstroennye-pylesosy': 'Встроенные пылесосы',
    'podogrevateli-posudy': 'Подогреватели посуды',
    'kondicionery': 'Кондиционеры',
    'ventilyatory': 'Вентиляторы',
    'uvlazhniteli-ochistiteli-vozduha': 'Увлажнители, очистители воздуха',
    'aksessuary-dlya-uvlazhnitelej-i-vozduhoochistitelej': 'Аксессуары для увлажнителей и воздухоочистителей',
    'aksessuary-dlya-kondicionerov': 'Аксессуары для кондиционеров',
    'teplovye-pushki': 'Тепловые пушки',
    'bojlery-kolonki-vodonagrevateli': 'Бойлеры, колонки, водонагреватели',
    'teplyj-pol-nagrevatelnye-plenki': 'Теплый пол, нагревательные пленки',
    'osushiteli-vozduha': 'Осушители воздуха',
    'teplovye-zavesy': 'Тепловые завесы',
    'pritochno-ventilyacionnye-ustanovki': 'Приточно-вентиляционные установки',
    'obogrevateli': 'Обогреватели',
    'dopolnitelnoe-oborudovanie-dlya-obogrevatelej': 'Дополнительное оборудование для обогревателей',
    'meteostancii-termometry-gigrometry': 'Метеостанции, термометры, гигрометры',
    'datchikipoint-izveschateli': 'Датчики и извещатели',
    'gazovye-ulichnye-obogrevateli': 'Газовые уличные обогреватели',
    'kaminy': 'Камины',
    'pylesosy': 'Пылесосы',
    'roby-pylesosy': 'Роботы-пылесосы',
    'paroochistitelipoint-parovye-shvabry': 'Пароочистители и паровые швабры',
    'aksessuary-dlya-pylesosov': 'Аксессуары для пылесосов',
    'minimojki': 'Минимойки',
    'aksessuary-dlya-minimoek': 'Аксессуары для минимоек',
    'utyugi': 'Утюги',
    'gladilnye-doski': 'Гладильные доски',
    'aksessuary-dlya-utyugov': 'Аксессуары для утюгов',
    'sushilki-dlya-belya': 'Сушилки для белья',
    'shvejnye-mashiny-i-overloki': 'Швейные машины и оверлоки',
    'aksessuary-dlya-shvejnyh-mashin': 'Аксессуары для швейных машин',
    'vyazalnye-mashiny': 'Вязальные машины',
    'melkaya-tehnika-dlya-doma': 'Мелкая техника для дома',
    'elektrogrelki': 'Электрогрелки',
    'mashinki-dlya-strizhki-trimmery': 'Машинки для стрижки, триммеры',
    'zubnye-elektroschetki': 'Зубные электрощетки',
    'feny-stajlery': 'Фены, стайлеры',
    'elektrobritvy': 'Электробритвы',
    'epilyatory': 'Эпиляторы',
    'elektromassazhery': 'Электромассажеры',
    'nasadki-dlya-elektricheskih-zubnyh-schetok': 'Накладки для электрических зубных щеток',
    'aksessuary-k-mashinkam-dlya-strizhki': 'Аксессуары к машинкам для стрижки',
    'aksessuary-dlya-elektrobritv': 'Аксессуары для электробритв',
    'vesy-napolnye': 'Весы напольные',
    'detskie-vesy': 'Детские весы',
    'pribory-dlya-manikyura-i-pedikyura': 'Приборы для маникюра и педикюра',
    'pribory-dlya-uhoda-za-kozhej': 'Приборы для ухода за кожей',
    'tonometry': 'Тонометры',
    'glyukometry': 'Глюкометры',
    'test-poloski-i-aksessuary-k-glyukometram': 'Тест-полоски и аксессуары к глюкометрам',
    'termometry-medicinskie': 'Термометры медицинские',
    'ingalyatory': 'Ингаляторы',
    'pulsoksimetry': 'Пульсоксиметры',
    'dozimetry': 'Дозиметры',
    'medicinskie-lampy': 'Медицинские лампы',
    'pribory-dlya-domashnej-terapii': 'Приборы для домашней терапии',
    'elektrochajniki': 'Электрочайники',
    'kofemolki': 'Кофемолки',
    'sokovyzhimalki': 'Соковыжималки',
    'filtry-kuvshiny-dlya-vody': 'Фильтры, кувшины для воды',
    'kartridzhi-k-filtram-kuvshinam': 'Картриджи к фильтрам, кувшинам',
    'kulery-dlya-vody': 'Кулеры для воды',
    'tehnika-dlya-kuhni': 'Техника для кухни',
    'sifony': 'Сифоны',
    'miksery-kombajny-blendery': 'Миксеры, комбайны, блендеры',
    'elektromyasorubki': 'Электромясорубки',
    'lomterezki': 'Ломтерезки',
    'nasadki-dlya-elektromyasorubok': 'Накладки для электромясорубок',
    'nasadki-dlya-kuhonnyh-kombajnov': 'Накладки для кухонных комбайнов',
    'multivarki': 'Мультиварки',
    'barbekyu-grili': 'Барбекю, грили',
    'frityurnicy': 'Фритюрницы',
    'nastolnye-plity-i-duhovki': 'Настольные плиты и духовки',
    'tostery-buterbrodnicy': 'Тостеры, бутербродницы',
    'hlebopechi': 'Хлебопечи',
    'sushilki-dlya-ovoschej-i-fruktov': 'Сушилки для овощей и фруктов',
    'jogurtnicy-morozhennicy': 'Йогуртницы, мороженицы',
    'parovarki': 'Пароварки',
    'kuhonnye-vesy': 'Кухонные весы',
    'aksessuary-dlya-kuhonnoj-tehniki': 'Аксессуары для кухонной техники',
    'portativnye-holodilniki': 'Портативные холодильники',
    'roby-pylesosy': 'Роботы-пылесосы',
    'frityurnicy': 'Фритюрницы',
    'elektrochajniki': 'Электрочайники',
    'kotly-otopleniya': 'Котлы отопления',
    'teplovye-nasosy': 'Тепловые насосы',
    'termostaticheskie-golovki-dlya-radiatorov-otopleniya': 'Термостатические головки для радиаторов отопления',
    'lyustry-lampy-bra-torshery': 'Люстры, лампы, бра, торшеры',
    'elektrolampy': 'Электролампы',
    'nastolnye-lampypoint-nochniki': 'Настольные лампы и ночники',
    'svetodiodnye-lenty': 'Светодиодные ленты',
    'elektrogirlyandy': 'Электрогирлянды',
    'umnyj-dom': 'Умный дом',
    'umnye-rozetki': 'Умные розетки',
    'datchiki-dvizheniya-dlya-osvescheniya': 'Датчики движения для освещения',
    'vyklyuchateli-rozetki': 'Выключатели, розетки',
    'rele-napryazheniyapoint-toka': 'Реле напряжения и тока',
    'rele-vremeni-tajmery': 'Реле времени, таймеры',
    'teplyj-pol-termoregulyatory': 'Теплый пол, терморегуляторы',
    'domofony': 'Домофоны',
    'komplekty-signalizacij': 'Комплекты сигнализаций',
    'dvernye-zvonki': 'Дверные звонки',
    'televizory': 'Телевизоры',
    'mediacentry': 'Медиацентры',
    'muzykalnye-centry': 'Музыкальные центры',
    'hlebopechi': 'Хлебопечи',
    'multivarki': 'Мультиварки',
    'nastolnye-plity-i-duhovki': 'Настольные плиты и духовки',
    'vino': 'Вино',
    'miksery-kombajny-blendery': 'Миксеры, комбайны, блендеры',
    'skaterti': 'Скатерти',
    
    // Дополнительные категории
    'noutbuki-pk': 'Ноутбуки и ПК',
    'setevoe-oborudovanie': 'Сетевое оборудование',
    'sredstva-multimedia': 'Средства мультимедиа',
    'nastolnye-pk-monitory': 'Настольные ПК и мониторы',
    'elektropitanie': 'Электропитание',
    'kompyuternaya-periferiya': 'Компьютерная периферия',
    'komplektuyuschie-dlya-pk': 'Комплектующие для ПК',
    'printery-mfu-plottery': 'Принтеры, МФУ, плоттеры',
    'programmnoeobespechenie': 'Программное обеспечение',
    
    // Спорт и отдых
    'sportivne': 'Спортивные товары',
    'fitnes': 'Фитнес',
    'transport': 'Транспорт',
    'turizm-kemping-plyazh': 'Туризм, кемпинг, пляж',
    'pnevmatika': 'Пневматика',
    'aktyvnyi-vidpochynok': 'Активный отдых',
    'rybalka': 'Рыбалка',
    'sportivnaya-odezhdapoint-obuv': 'Спортивная одежда и обувь',
    'bagazh': 'Багаж',
    
    // Зоотовары
    'dlya-koshek': 'Для кошек',
    'sobakam': 'Собакам',
    'dlya-ryb-i-reptilij': 'Для рыб и рептилий',
    'vyrobnyky-zoo': 'Производители зоотоваров',
    
    // Инструменты
    'sverlilnyj-elektroinstrument': 'Сверлильный электроинструмент',
    'svarochnoe-oborudovanie': 'Сварочное оборудование',
    'shlifovalnyjpoint-otreznoj-elektroinstrument': 'Шлифовальный и отрезной электроинструмент',
    'malyarnyj-instrument': 'Малярный инструмент',
    'stroitelnoe-oborudovanie': 'Строительное оборудование',
    'izmeritelnyj-instrument': 'Измерительный инструмент',
    'elektroinstrument': 'Электроинструмент',
    'ruchnoj-instrument': 'Ручной инструмент',
    'stanki': 'Станки',
    'stolyarnyj-instrument': 'Столярный инструмент',
    'populyarno-seychas-tools': 'Популярно сейчас - инструменты',
    
    // Бытовая техника
    'krupnaya-bytovaya-tehnika': 'Крупная бытовая техника',
    'vstraivaemaya-tehnika': 'Встраиваемая техника',
    'klimaticheskaya-tehnika': 'Климатическая техника',
    'tehnika-dlya-doma': 'Техника для дома',
    'personalnyi-dogliad': 'Персональный уход',
    'melkaya-tehnika-dlya-kuhni': 'Мелкая техника для кухни',
    'smart-technika': 'Умная техника',
    'populyarno-seychas-bt': 'Популярно сейчас - бытовая техника',
    
    // Аудио и видео
    'televisions/': 'Телевизоры',
    'televizory-proektory/': 'Телевизоры и проекторы',
    'projectors/': 'Проекторы',
    'headphones/': 'Наушники',
    'audio/': 'Аудио',
    'videokamery-i-videooborudovanie/': 'Видеокамеры и видеооборудование',
    'fotoapparaty-obektivy/': 'Фотоаппараты и объективы',
    
    // Товары для взрослых
    'intim': 'Интимные товары',
    'eroticheskaya-odezhda': 'Эротическая одежда',
    'napitki-alkogol': 'Напитки и алкоголь',
    
    // Военное снаряжение
    'tekhnycheskoe-snariazhenye': 'Техническое снаряжение',
    'taktichniy-odyag': 'Тактическая одежда',
    'amunytsyia': 'Амуниция',
    'pokhodnoe-snariazhenye': 'Походное снаряжение',
    'zdorove-hyhyena': 'Здоровье и гигиена',
    
    // Электроинструменты
    'energy': 'Энергетика',
    '/power/internet-bez-svitla': 'Интернет без света',
    '/power/energosberezhennya': 'Энергосбережение',
    
    // Конструкторы
    'age-lego': 'Конструкторы по возрасту',
    'themes-lego': 'Конструкторы по темам',
    'categories-lego': 'Категории конструкторов',
    
    // Популярные категории
    'populyarno-seychas-remont/': 'Популярно сейчас - ремонт',
    'populyarno-seychas-sport': 'Популярно сейчас - спорт',
    'populyarno-seychas-dom': 'Популярно сейчас - дом',
    'populyarno-seychas-auto': 'Популярно сейчас - авто',
    'populyarno-seychas-fashion': 'Популярно сейчас - мода',
    'populyarno-seychas-dacha_sad': 'Популярно сейчас - дача и сад',
    'populyarno-seychas-deti': 'Популярно сейчас - детские товары',
    'populyarno-seychas-krasota': 'Популярно сейчас - красота',
    'populyarno-seychas-pobutova_himiia': 'Популярно сейчас - бытовая химия',
    'populyarno-seychas-musical_instruments': 'Популярно сейчас - музыкальные инструменты',
    'populyarno-seychas-mobile': 'Популярно сейчас - мобильные устройства',
    'populyarno-seychas-remont': 'Популярно сейчас - ремонт',
    'populyarno-seychas-zootovary': 'Популярно сейчас - зоотовары',
    'populyarno-seychas-bt': 'Популярно сейчас - бытовая техника',
    'populyarno-seychas-av': 'Популярно сейчас - аудио и видео',
    'populyarno-seychas-adult': 'Популярно сейчас - товары для взрослых',
    'populyarno-seychas-military': 'Популярно сейчас - военное снаряжение',
    'populyarno-seychas-power': 'Популярно сейчас - электроинструменты',
    'populyarno-seychas-constructors-lego': 'Популярно сейчас - конструкторы'
};

// Функция для получения русского названия группы
function getGroupName(slug) {
    return groupNameMapping[slug] || slug.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

// Функция для получения русского названия категории
function getCategoryName(slug) {
    return categoryNameMapping[slug] || slug.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
}

async function loadCatalogFile(filename) {
    try {
        const filePath = path.join(__dirname, '..', 'catalogs', filename);
        const content = await fs.readFile(filePath, 'utf8');
        return content.split('\n').filter(line => line.trim());
    } catch (error) {
        console.error(`Error reading file ${filename}:`, error);
        return [];
    }
}

// Parse catalog file content
function parseCatalogContent(lines, catalogSlug) {
    const groups = [];
    let currentGroup = null;
    let groupIndex = 0;

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        // Check if it's a group (has multiple underscores)
        if (trimmedLine.includes('____') && trimmedLine.includes('_')) {
            // Extract group name from between underscores
            const groupMatch = trimmedLine.match(/_{3,}\s*([^_]+)\s*_{3,}/);
            if (groupMatch) {
                const groupName = groupMatch[1].trim();
                const groupSlug = groupName.toLowerCase()
                    .replace(/[^a-zа-я0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '');

                currentGroup = {
                    name: getGroupName(groupSlug), // Используем русское название
                    slug: groupSlug,
                    catalogSlug: catalogSlug,
                    level: 1,
                    isGroup: true,
                    sortOrder: groupIndex++,
                    categories: []
                };
                groups.push(currentGroup);
            }
        } else if (currentGroup && trimmedLine) {
            // This is a category
            const categorySlug = trimmedLine.trim();
            
            // Check if it's a reference to another catalog
            if (categorySlug.startsWith('/')) {
                const pathParts = categorySlug.slice(1).split('/');
                if (pathParts.length >= 2) {
                    const refCatalog = pathParts[0];
                    const refCategory = pathParts[1];
                    
                    currentGroup.categories.push({
                        slug: `${refCatalog}-${refCategory}`,
                        name: getCategoryName(refCategory),
                        level: 2,
                        groupSlug: currentGroup.slug,
                        catalogSlug: catalogSlug,
                        isReference: true,
                        referenceTo: {
                            catalogSlug: refCatalog,
                            categorySlug: refCategory
                        },
                        sortOrder: currentGroup.categories.length
                    });
                }
            } else {
                // Regular category
                const name = getCategoryName(categorySlug);
                
                // Create unique slug for duplicate categories
                let uniqueSlug = categorySlug;
                let counter = 1;
                while (currentGroup.categories.some(cat => cat.slug === uniqueSlug)) {
                    uniqueSlug = `${categorySlug}-${counter}`;
                    counter++;
                }
                
                currentGroup.categories.push({
                    slug: uniqueSlug,
                    name: name,
                    level: 2,
                    groupSlug: currentGroup.slug,
                    catalogSlug: catalogSlug,
                    sortOrder: currentGroup.categories.length
                });
            }
        }
    }

    return groups;
}

async function createMainCatalog(slug, data) {
    try {
        const existingCatalog = await Catalog.findOne({ slug });
        if (existingCatalog) {
            console.log(`Catalog ${slug} already exists, skipping...`);
            return existingCatalog;
        }

        const catalog = new Catalog({
            name: data.name,
            slug: slug,
            description: `Каталог товаров: ${data.name}`,
            level: 0,
            sortOrder: Object.keys(catalogMapping).indexOf(slug)
        });

        await catalog.save();
        console.log(`✅ Created main catalog: ${data.name}`);
        return catalog;
    } catch (error) {
        console.error(`Error creating main catalog ${slug}:`, error);
        return null;
    }
}

async function createGroup(groupData) {
    try {
        const existingGroup = await Catalog.findOne({ 
            slug: groupData.slug, 
            catalogSlug: groupData.catalogSlug,
            level: 1 
        });
        
        if (existingGroup) {
            console.log(`Group ${groupData.slug} already exists, skipping...`);
            return existingGroup;
        }

        const group = new Catalog({
            name: groupData.name,
            slug: groupData.slug,
            description: `Группа: ${groupData.name}`,
            level: 1,
            catalogSlug: groupData.catalogSlug,
            isGroup: true,
            sortOrder: groupData.sortOrder
        });

        await group.save();
        console.log(`✅ Created group: ${groupData.name}`);
        return group;
    } catch (error) {
        console.error(`Error creating group ${groupData.slug}:`, error);
        return null;
    }
}

async function createCategory(categoryData) {
    try {
        const existingCategory = await Catalog.findOne({ 
            slug: categoryData.slug, 
            groupSlug: categoryData.groupSlug,
            catalogSlug: categoryData.catalogSlug,
            level: 2 
        });
        
        if (existingCategory) {
            console.log(`Category ${categoryData.slug} already exists, skipping...`);
            return existingCategory;
        }

        const category = new Catalog({
            name: categoryData.name,
            slug: categoryData.slug,
            description: `Категория: ${categoryData.name}`,
            level: 2,
            groupSlug: categoryData.groupSlug,
            catalogSlug: categoryData.catalogSlug,
            isReference: categoryData.isReference || false,
            referenceTo: categoryData.referenceTo || null,
            sortOrder: categoryData.sortOrder
        });

        await category.save();
        console.log(`✅ Created category: ${categoryData.name}`);
        return category;
    } catch (error) {
        console.error(`Error creating category ${categoryData.slug}:`, error);
        return null;
    }
}

async function initCatalogs() {
    console.log('🚀 Starting catalog initialization...');

    // Create main catalogs first
    const mainCatalogs = [];
    for (const [slug, data] of Object.entries(catalogMapping)) {
        const catalog = await createMainCatalog(slug, data);
        if (catalog) {
            mainCatalogs.push(catalog);
        }
    }

    // Process each catalog file
    for (const [slug, data] of Object.entries(catalogMapping)) {
        const filename = `${slug}.txt`;
        const lines = await loadCatalogFile(filename);
        
        console.log(`📁 Processing ${filename}...`);
        
        if (lines.length > 0) {
            const groups = parseCatalogContent(lines, slug);
            console.log(`   Found ${groups.length} groups`);
            
            for (const group of groups) {
                // Create group
                await createGroup(group);
                
                // Create categories in group
                for (const category of group.categories) {
                    await createCategory(category);
                }
                
                console.log(`   Created ${group.categories.length} categories in group "${group.name}"`);
            }
        }
    }

    console.log('✅ Catalog initialization completed!');
}

async function main() {
    await connectDB();
    await initCatalogs();
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { initCatalogs, catalogMapping }; 