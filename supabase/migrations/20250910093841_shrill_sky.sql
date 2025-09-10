/*
  # Создание админа и тестовых данных

  1. Пользователи
    - Создание admin@example.com с ролью superuser
    
  2. Проекты
    - 3 тестовых проекта с полными данными
    
  3. Данные
    - Чаты, сообщения, заметки, SQL-примеры
    - Подключения к БД и метаданные
    - Настройки приложения
*/

-- Создаем пользователя в auth.users (это системная таблица Supabase)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  '00000000-0000-0000-0000-000000000000',
  'admin@example.com',
  crypt('asdfasdf', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Admin User"}',
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Создаем пользователя в нашей таблице users
INSERT INTO users (
  id,
  email,
  name,
  role,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'admin@example.com',
  'Admin User',
  'superuser',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = now();

-- Создаем проекты
INSERT INTO projects (
  id,
  name,
  description,
  created_by,
  created_at,
  updated_at
) VALUES 
(
  '11111111-1111-1111-1111-111111111111',
  'E-commerce Analytics',
  'Аналитическая система для интернет-магазина с отслеживанием продаж, клиентов и товаров',
  '550e8400-e29b-41d4-a716-446655440000',
  now(),
  now()
),
(
  '22222222-2222-2222-2222-222222222222',
  'CRM System',
  'Система управления взаимоотношениями с клиентами для отдела продаж',
  '550e8400-e29b-41d4-a716-446655440000',
  now(),
  now()
),
(
  '33333333-3333-3333-3333-333333333333',
  'Financial Dashboard',
  'Финансовая отчетность и аналитика для бухгалтерии и руководства',
  '550e8400-e29b-41d4-a716-446655440000',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = now();

-- Добавляем админа как участника всех проектов
INSERT INTO project_members (
  id,
  project_id,
  user_id,
  role,
  added_by,
  added_at
) VALUES 
(
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  '550e8400-e29b-41d4-a716-446655440000',
  'admin',
  '550e8400-e29b-41d4-a716-446655440000',
  now()
),
(
  gen_random_uuid(),
  '22222222-2222-2222-2222-222222222222',
  '550e8400-e29b-41d4-a716-446655440000',
  'admin',
  '550e8400-e29b-41d4-a716-446655440000',
  now()
),
(
  gen_random_uuid(),
  '33333333-3333-3333-3333-333333333333',
  '550e8400-e29b-41d4-a716-446655440000',
  'admin',
  '550e8400-e29b-41d4-a716-446655440000',
  now()
) ON CONFLICT DO NOTHING;

-- Создаем чаты
INSERT INTO chats (
  id,
  name,
  user_id,
  project_id,
  created_at,
  updated_at
) VALUES 
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Анализ продаж по категориям',
  '550e8400-e29b-41d4-a716-446655440000',
  '11111111-1111-1111-1111-111111111111',
  now(),
  now()
),
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Отчет по клиентам',
  '550e8400-e29b-41d4-a716-446655440000',
  '22222222-2222-2222-2222-222222222222',
  now(),
  now()
),
(
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'Финансовые показатели',
  '550e8400-e29b-41d4-a716-446655440000',
  '33333333-3333-3333-3333-333333333333',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = now();

-- Создаем сообщения в чатах
INSERT INTO messages (
  id,
  chat_id,
  role,
  content,
  sql_query,
  created_at
) VALUES 
-- Чат 1: Анализ продаж
(
  gen_random_uuid(),
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'user',
  'Покажи топ-5 категорий товаров по продажам за последний месяц',
  null,
  now() - interval '10 minutes'
),
(
  gen_random_uuid(),
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'assistant',
  'Вот SQL-запрос для получения топ-5 категорий по продажам:',
  'SELECT c.name as category_name, SUM(oi.quantity * oi.price) as total_sales
FROM categories c
JOIN products p ON c.id = p.category_id
JOIN order_items oi ON p.id = oi.product_id
JOIN orders o ON oi.order_id = o.id
WHERE o.created_at >= CURRENT_DATE - INTERVAL ''1 month''
GROUP BY c.id, c.name
ORDER BY total_sales DESC
LIMIT 5;',
  now() - interval '9 minutes'
),
-- Чат 2: Отчет по клиентам
(
  gen_random_uuid(),
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'user',
  'Найди всех клиентов, которые не делали заказы более 3 месяцев',
  null,
  now() - interval '5 minutes'
),
(
  gen_random_uuid(),
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'assistant',
  'Запрос для поиска неактивных клиентов:',
  'SELECT c.id, c.name, c.email, MAX(o.created_at) as last_order_date
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
GROUP BY c.id, c.name, c.email
HAVING MAX(o.created_at) < CURRENT_DATE - INTERVAL ''3 months''
   OR MAX(o.created_at) IS NULL
ORDER BY last_order_date DESC NULLS LAST;',
  now() - interval '4 minutes'
),
-- Чат 3: Финансовые показатели
(
  gen_random_uuid(),
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'user',
  'Рассчитай общую выручку и прибыль по месяцам за текущий год',
  null,
  now() - interval '2 minutes'
),
(
  gen_random_uuid(),
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'assistant',
  'SQL для расчета выручки и прибыли по месяцам:',
  'SELECT 
  DATE_TRUNC(''month'', o.created_at) as month,
  SUM(oi.quantity * oi.price) as revenue,
  SUM(oi.quantity * (oi.price - p.cost)) as profit
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
WHERE EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
GROUP BY DATE_TRUNC(''month'', o.created_at)
ORDER BY month;',
  now() - interval '1 minute'
) ON CONFLICT DO NOTHING;

-- Создаем заметки пользователя
INSERT INTO user_notes (
  id,
  title,
  content,
  user_id,
  project_id,
  created_at,
  updated_at
) VALUES 
(
  gen_random_uuid(),
  'Структура базы данных E-commerce',
  'Основные таблицы:
- customers: клиенты (id, name, email, phone, created_at)
- products: товары (id, name, price, cost, category_id, stock)
- categories: категории (id, name, description)
- orders: заказы (id, customer_id, total, status, created_at)
- order_items: позиции заказа (id, order_id, product_id, quantity, price)

Важные индексы:
- orders.customer_id
- order_items.order_id, order_items.product_id
- products.category_id',
  '550e8400-e29b-41d4-a716-446655440000',
  '11111111-1111-1111-1111-111111111111',
  now(),
  now()
),
(
  gen_random_uuid(),
  'CRM бизнес-процессы',
  'Этапы работы с клиентами:
1. Лид (lead) - первичный контакт
2. Квалификация - оценка потенциала
3. Предложение - подготовка коммерческого предложения
4. Переговоры - обсуждение условий
5. Закрытие - заключение сделки
6. Сопровождение - послепродажное обслуживание

Ключевые метрики:
- Конверсия по этапам
- Средний чек
- Время закрытия сделки
- LTV (lifetime value)',
  '550e8400-e29b-41d4-a716-446655440000',
  '22222222-2222-2222-2222-222222222222',
  now(),
  now()
),
(
  gen_random_uuid(),
  'Финансовые KPI',
  'Основные показатели для отслеживания:

Выручка:
- Общая выручка
- Выручка по продуктам/услугам
- Выручка по каналам продаж

Прибыльность:
- Валовая прибыль
- Операционная прибыль
- Чистая прибыль
- Рентабельность продаж

Денежные потоки:
- Поступления от клиентов
- Платежи поставщикам
- Операционные расходы
- Инвестиции',
  '550e8400-e29b-41d4-a716-446655440000',
  '33333333-3333-3333-3333-333333333333',
  now(),
  now()
) ON CONFLICT DO NOTHING;

-- Создаем SQL примеры
INSERT INTO sql_examples (
  id,
  natural_language_query,
  sql_query,
  user_id,
  project_id,
  created_at
) VALUES 
(
  gen_random_uuid(),
  'Найти топ-10 самых продаваемых товаров',
  'SELECT p.name, SUM(oi.quantity) as total_sold
FROM products p
JOIN order_items oi ON p.id = oi.product_id
GROUP BY p.id, p.name
ORDER BY total_sold DESC
LIMIT 10;',
  '550e8400-e29b-41d4-a716-446655440000',
  '11111111-1111-1111-1111-111111111111',
  now()
),
(
  gen_random_uuid(),
  'Показать клиентов с наибольшим количеством заказов',
  'SELECT c.name, c.email, COUNT(o.id) as order_count
FROM customers c
JOIN orders o ON c.id = o.customer_id
GROUP BY c.id, c.name, c.email
ORDER BY order_count DESC;',
  '550e8400-e29b-41d4-a716-446655440000',
  '22222222-2222-2222-2222-222222222222',
  now()
),
(
  gen_random_uuid(),
  'Рассчитать среднюю сумму заказа по месяцам',
  'SELECT 
  DATE_TRUNC(''month'', created_at) as month,
  AVG(total) as avg_order_value,
  COUNT(*) as order_count
FROM orders
GROUP BY DATE_TRUNC(''month'', created_at)
ORDER BY month;',
  '550e8400-e29b-41d4-a716-446655440000',
  '33333333-3333-3333-3333-333333333333',
  now()
),
(
  gen_random_uuid(),
  'Найти товары с низким остатком на складе',
  'SELECT name, stock, price
FROM products
WHERE stock < 10
ORDER BY stock ASC;',
  '550e8400-e29b-41d4-a716-446655440000',
  '11111111-1111-1111-1111-111111111111',
  now()
),
(
  gen_random_uuid(),
  'Показать выручку по дням за последнюю неделю',
  'SELECT 
  DATE(created_at) as order_date,
  SUM(total) as daily_revenue
FROM orders
WHERE created_at >= CURRENT_DATE - INTERVAL ''7 days''
GROUP BY DATE(created_at)
ORDER BY order_date;',
  '550e8400-e29b-41d4-a716-446655440000',
  '22222222-2222-2222-2222-222222222222',
  now()
) ON CONFLICT DO NOTHING;

-- Создаем подключения к базам данных
INSERT INTO database_connections (
  id,
  project_id,
  name,
  host,
  port,
  username,
  password,
  database,
  created_at,
  updated_at
) VALUES 
(
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  'E-commerce Production',
  'ecommerce-db.company.com',
  5432,
  'ecommerce_user',
  'encrypted_password_123',
  'ecommerce_prod',
  now(),
  now()
),
(
  gen_random_uuid(),
  '22222222-2222-2222-2222-222222222222',
  'CRM Database',
  'crm-postgres.internal',
  5432,
  'crm_analyst',
  'secure_pass_456',
  'crm_system',
  now(),
  now()
),
(
  gen_random_uuid(),
  '33333333-3333-3333-3333-333333333333',
  'Financial Data Warehouse',
  'finance-dw.company.local',
  5432,
  'finance_reader',
  'finance_key_789',
  'financial_dw',
  now(),
  now()
) ON CONFLICT DO NOTHING;

-- Создаем настройки приложения для админа
INSERT INTO app_settings (
  id,
  user_id,
  rag_examples_count,
  debug_mode,
  rag_similarity_threshold,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440000',
  5,
  true,
  0.35,
  now(),
  now()
) ON CONFLICT (user_id) DO UPDATE SET
  rag_examples_count = EXCLUDED.rag_examples_count,
  debug_mode = EXCLUDED.debug_mode,
  rag_similarity_threshold = EXCLUDED.rag_similarity_threshold,
  updated_at = now();

-- Создаем метаданные таблиц
INSERT INTO table_metadata (
  id,
  project_id,
  schema_name,
  table_name,
  description,
  created_at,
  updated_at
) VALUES 
(
  '11111111-aaaa-aaaa-aaaa-111111111111',
  '11111111-1111-1111-1111-111111111111',
  'public',
  'customers',
  'Таблица клиентов интернет-магазина',
  now(),
  now()
),
(
  '11111111-bbbb-bbbb-bbbb-111111111111',
  '11111111-1111-1111-1111-111111111111',
  'public',
  'products',
  'Каталог товаров с ценами и остатками',
  now(),
  now()
),
(
  '11111111-cccc-cccc-cccc-111111111111',
  '11111111-1111-1111-1111-111111111111',
  'public',
  'orders',
  'Заказы клиентов',
  now(),
  now()
) ON CONFLICT (project_id, schema_name, table_name) DO UPDATE SET
  description = EXCLUDED.description,
  updated_at = now();

-- Создаем метаданные колонок
INSERT INTO column_metadata (
  id,
  table_metadata_id,
  column_name,
  data_type,
  is_nullable,
  is_primary_key,
  is_foreign_key,
  description,
  created_at
) VALUES 
-- Колонки таблицы customers
(
  gen_random_uuid(),
  '11111111-aaaa-aaaa-aaaa-111111111111',
  'id',
  'uuid',
  false,
  true,
  false,
  'Уникальный идентификатор клиента',
  now()
),
(
  gen_random_uuid(),
  '11111111-aaaa-aaaa-aaaa-111111111111',
  'name',
  'varchar(255)',
  false,
  false,
  false,
  'Имя клиента',
  now()
),
(
  gen_random_uuid(),
  '11111111-aaaa-aaaa-aaaa-111111111111',
  'email',
  'varchar(255)',
  false,
  false,
  false,
  'Email адрес клиента',
  now()
),
-- Колонки таблицы products
(
  gen_random_uuid(),
  '11111111-bbbb-bbbb-bbbb-111111111111',
  'id',
  'uuid',
  false,
  true,
  false,
  'Уникальный идентификатор товара',
  now()
),
(
  gen_random_uuid(),
  '11111111-bbbb-bbbb-bbbb-111111111111',
  'name',
  'varchar(255)',
  false,
  false,
  false,
  'Название товара',
  now()
),
(
  gen_random_uuid(),
  '11111111-bbbb-bbbb-bbbb-111111111111',
  'price',
  'decimal(10,2)',
  false,
  false,
  false,
  'Цена товара',
  now()
),
-- Колонки таблицы orders
(
  gen_random_uuid(),
  '11111111-cccc-cccc-cccc-111111111111',
  'id',
  'uuid',
  false,
  true,
  false,
  'Уникальный идентификатор заказа',
  now()
),
(
  gen_random_uuid(),
  '11111111-cccc-cccc-cccc-111111111111',
  'customer_id',
  'uuid',
  false,
  false,
  true,
  'Ссылка на клиента',
  now()
),
(
  gen_random_uuid(),
  '11111111-cccc-cccc-cccc-111111111111',
  'total',
  'decimal(10,2)',
  false,
  false,
  false,
  'Общая сумма заказа',
  now()
) ON CONFLICT DO NOTHING;