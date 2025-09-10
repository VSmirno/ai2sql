/*
  # Миграция админа и тестовых данных

  1. Новые данные
    - Пользователь admin@example.com с ролью superuser
    - 3 тестовых проекта с полными данными
    - Чаты, сообщения, заметки, SQL-примеры
    - Подключения к БД и метаданные
    - Настройки приложения

  2. Безопасность
    - Все таблицы используют существующие RLS политики
    - Данные связаны через внешние ключи
*/

-- Вставляем админа (используем фиксированный UUID)
INSERT INTO users (id, email, name, role, created_at, updated_at) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'admin@example.com', 'Администратор', 'superuser', now(), now())
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = now();

-- Создаем тестовые проекты
INSERT INTO projects (id, name, description, created_by, created_at, updated_at) VALUES 
('proj-1', 'E-commerce Analytics', 'Аналитика интернет-магазина с данными о продажах, клиентах и товарах', '550e8400-e29b-41d4-a716-446655440000', now(), now()),
('proj-2', 'CRM System', 'Система управления взаимоотношениями с клиентами', '550e8400-e29b-41d4-a716-446655440000', now(), now()),
('proj-3', 'Financial Dashboard', 'Финансовая отчетность и бюджетирование', '550e8400-e29b-41d4-a716-446655440000', now(), now())
ON CONFLICT (name) DO NOTHING;

-- Добавляем админа как администратора всех проектов
INSERT INTO project_members (project_id, user_id, role, added_by, added_at) VALUES 
('proj-1', '550e8400-e29b-41d4-a716-446655440000', 'admin', '550e8400-e29b-41d4-a716-446655440000', now()),
('proj-2', '550e8400-e29b-41d4-a716-446655440000', 'admin', '550e8400-e29b-41d4-a716-446655440000', now()),
('proj-3', '550e8400-e29b-41d4-a716-446655440000', 'admin', '550e8400-e29b-41d4-a716-446655440000', now())
ON CONFLICT (project_id, user_id) DO NOTHING;

-- Создаем тестовые чаты
INSERT INTO chats (id, name, user_id, project_id, created_at, updated_at) VALUES 
('chat-1', 'Анализ продаж по регионам', '550e8400-e29b-41d4-a716-446655440000', 'proj-1', now() - interval '2 days', now() - interval '2 days'),
('chat-2', 'Отчет по клиентам', '550e8400-e29b-41d4-a716-446655440000', 'proj-2', now() - interval '1 day', now() - interval '1 day'),
('chat-3', 'Финансовые показатели', '550e8400-e29b-41d4-a716-446655440000', 'proj-3', now() - interval '3 hours', now() - interval '3 hours')
ON CONFLICT (id) DO NOTHING;

-- Добавляем сообщения в чаты
INSERT INTO messages (chat_id, role, content, sql_query, created_at) VALUES 
-- Чат 1: Анализ продаж
('chat-1', 'user', 'Покажи продажи по регионам за последний месяц', null, now() - interval '2 days'),
('chat-1', 'assistant', 'Вот SQL-запрос для анализа продаж по регионам:', 
'SELECT 
  r.region_name,
  COUNT(o.id) as total_orders,
  SUM(o.total_amount) as total_revenue,
  AVG(o.total_amount) as avg_order_value
FROM orders o
JOIN customers c ON o.customer_id = c.id
JOIN regions r ON c.region_id = r.id
WHERE o.created_at >= CURRENT_DATE - INTERVAL ''1 month''
GROUP BY r.region_name
ORDER BY total_revenue DESC;', now() - interval '2 days' + interval '30 seconds'),

('chat-1', 'user', 'А теперь покажи топ-10 товаров по продажам', null, now() - interval '2 days' + interval '5 minutes'),
('chat-1', 'assistant', 'Запрос для топ-10 товаров по продажам:', 
'SELECT 
  p.product_name,
  SUM(oi.quantity) as total_sold,
  SUM(oi.quantity * oi.price) as total_revenue
FROM order_items oi
JOIN products p ON oi.product_id = p.id
JOIN orders o ON oi.order_id = o.id
WHERE o.created_at >= CURRENT_DATE - INTERVAL ''1 month''
GROUP BY p.id, p.product_name
ORDER BY total_revenue DESC
LIMIT 10;', now() - interval '2 days' + interval '5 minutes 30 seconds'),

-- Чат 2: Отчет по клиентам
('chat-2', 'user', 'Найди всех активных клиентов с заказами за последние 3 месяца', null, now() - interval '1 day'),
('chat-2', 'assistant', 'SQL-запрос для поиска активных клиентов:', 
'SELECT 
  c.id,
  c.first_name,
  c.last_name,
  c.email,
  COUNT(o.id) as order_count,
  SUM(o.total_amount) as total_spent,
  MAX(o.created_at) as last_order_date
FROM customers c
JOIN orders o ON c.id = o.customer_id
WHERE o.created_at >= CURRENT_DATE - INTERVAL ''3 months''
  AND c.status = ''active''
GROUP BY c.id, c.first_name, c.last_name, c.email
HAVING COUNT(o.id) > 0
ORDER BY total_spent DESC;', now() - interval '1 day' + interval '45 seconds'),

-- Чат 3: Финансовые показатели
('chat-3', 'user', 'Покажи месячную выручку и расходы', null, now() - interval '3 hours'),
('chat-3', 'assistant', 'Запрос для анализа месячной выручки и расходов:', 
'SELECT 
  DATE_TRUNC(''month'', date) as month,
  SUM(CASE WHEN type = ''revenue'' THEN amount ELSE 0 END) as total_revenue,
  SUM(CASE WHEN type = ''expense'' THEN amount ELSE 0 END) as total_expenses,
  SUM(CASE WHEN type = ''revenue'' THEN amount ELSE -amount END) as net_profit
FROM financial_transactions
WHERE date >= CURRENT_DATE - INTERVAL ''12 months''
GROUP BY DATE_TRUNC(''month'', date)
ORDER BY month DESC;', now() - interval '3 hours' + interval '1 minute');

-- Создаем заметки пользователя
INSERT INTO user_notes (title, content, user_id, project_id, created_at, updated_at) VALUES 
('Структура базы E-commerce', 
'Основные таблицы:
- customers: клиенты (id, first_name, last_name, email, region_id, status)
- orders: заказы (id, customer_id, total_amount, status, created_at)
- order_items: позиции заказов (id, order_id, product_id, quantity, price)
- products: товары (id, product_name, category_id, price, stock_quantity)
- regions: регионы (id, region_name)

Важные индексы:
- orders.customer_id
- orders.created_at
- order_items.order_id, order_items.product_id', 
'550e8400-e29b-41d4-a716-446655440000', 'proj-1', now() - interval '1 week', now() - interval '1 week'),

('CRM Бизнес-правила', 
'Статусы клиентов:
- active: активный клиент
- inactive: неактивный клиент  
- blocked: заблокированный клиент

Типы взаимодействий:
- call: телефонный звонок
- email: электронная почта
- meeting: встреча
- demo: демонстрация продукта

Воронка продаж:
1. Lead (лид)
2. Qualified (квалифицированный)
3. Proposal (предложение)
4. Negotiation (переговоры)
5. Closed Won (успешно закрыт)
6. Closed Lost (потерян)', 
'550e8400-e29b-41d4-a716-446655440000', 'proj-2', now() - interval '5 days', now() - interval '5 days'),

('Финансовая отчетность', 
'Основные показатели:
- Revenue: выручка от продаж
- COGS: себестоимость проданных товаров
- Gross Profit: валовая прибыль
- Operating Expenses: операционные расходы
- EBITDA: прибыль до вычета процентов, налогов и амортизации

Периоды отчетности:
- Ежедневно: кассовые операции
- Еженедельно: продажи и закупки
- Ежемесячно: P&L, баланс
- Ежеквартально: налоговая отчетность
- Ежегодно: годовой отчет

Валюты: RUB, USD, EUR', 
'550e8400-e29b-41d4-a716-446655440000', 'proj-3', now() - interval '2 days', now() - interval '2 days');

-- Создаем SQL-примеры
INSERT INTO sql_examples (natural_language_query, sql_query, user_id, project_id, created_at) VALUES 
('Найти всех клиентов из Москвы с заказами больше 10000 рублей', 
'SELECT DISTINCT c.id, c.first_name, c.last_name, c.email
FROM customers c
JOIN orders o ON c.id = o.customer_id
JOIN regions r ON c.region_id = r.id
WHERE r.region_name = ''Москва''
  AND o.total_amount > 10000;', 
'550e8400-e29b-41d4-a716-446655440000', 'proj-1', now() - interval '3 days'),

('Показать товары, которые не продавались последние 30 дней', 
'SELECT p.id, p.product_name, p.price, p.stock_quantity
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id AND o.created_at >= CURRENT_DATE - INTERVAL ''30 days''
WHERE o.id IS NULL;', 
'550e8400-e29b-41d4-a716-446655440000', 'proj-1', now() - interval '2 days'),

('Найти клиентов без активности в CRM за последние 60 дней', 
'SELECT c.id, c.first_name, c.last_name, c.email, c.last_contact_date
FROM customers c
LEFT JOIN interactions i ON c.id = i.customer_id AND i.created_at >= CURRENT_DATE - INTERVAL ''60 days''
WHERE i.id IS NULL
  AND c.status = ''active'';', 
'550e8400-e29b-41d4-a716-446655440000', 'proj-2', now() - interval '4 days'),

('Рассчитать конверсию по воронке продаж за месяц', 
'SELECT 
  stage,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM deals
WHERE created_at >= CURRENT_DATE - INTERVAL ''1 month''
GROUP BY stage
ORDER BY 
  CASE stage
    WHEN ''Lead'' THEN 1
    WHEN ''Qualified'' THEN 2
    WHEN ''Proposal'' THEN 3
    WHEN ''Negotiation'' THEN 4
    WHEN ''Closed Won'' THEN 5
    WHEN ''Closed Lost'' THEN 6
  END;', 
'550e8400-e29b-41d4-a716-446655440000', 'proj-2', now() - interval '1 day'),

('Показать месячную динамику прибыли по кварталам', 
'SELECT 
  EXTRACT(YEAR FROM date) as year,
  EXTRACT(QUARTER FROM date) as quarter,
  SUM(CASE WHEN type = ''revenue'' THEN amount ELSE -amount END) as net_profit
FROM financial_transactions
WHERE date >= CURRENT_DATE - INTERVAL ''2 years''
GROUP BY EXTRACT(YEAR FROM date), EXTRACT(QUARTER FROM date)
ORDER BY year DESC, quarter DESC;', 
'550e8400-e29b-41d4-a716-446655440000', 'proj-3', now() - interval '6 hours');

-- Создаем подключения к базам данных
INSERT INTO database_connections (project_id, name, host, port, username, password, database, created_at, updated_at) VALUES 
('proj-1', 'E-commerce Production', 'ecommerce-db.company.com', 5432, 'ecommerce_user', 'encrypted_password_1', 'ecommerce_prod', now(), now()),
('proj-1', 'E-commerce Staging', 'ecommerce-staging.company.com', 5432, 'ecommerce_user', 'encrypted_password_2', 'ecommerce_staging', now(), now()),
('proj-2', 'CRM Database', 'crm-db.company.com', 5432, 'crm_user', 'encrypted_password_3', 'crm_production', now(), now()),
('proj-3', 'Financial DB', 'finance-db.company.com', 5432, 'finance_user', 'encrypted_password_4', 'financial_data', now(), now())
ON CONFLICT DO NOTHING;

-- Создаем метаданные таблиц
INSERT INTO table_metadata (project_id, schema_name, table_name, description, created_at, updated_at) VALUES 
('proj-1', 'public', 'customers', 'Таблица клиентов интернет-магазина', now(), now()),
('proj-1', 'public', 'orders', 'Заказы клиентов', now(), now()),
('proj-1', 'public', 'order_items', 'Позиции в заказах', now(), now()),
('proj-1', 'public', 'products', 'Каталог товаров', now(), now()),
('proj-1', 'public', 'regions', 'Справочник регионов', now(), now()),
('proj-2', 'public', 'customers', 'Клиенты CRM системы', now(), now()),
('proj-2', 'public', 'deals', 'Сделки и возможности', now(), now()),
('proj-2', 'public', 'interactions', 'История взаимодействий с клиентами', now(), now()),
('proj-3', 'public', 'financial_transactions', 'Финансовые операции', now(), now()),
('proj-3', 'public', 'budgets', 'Бюджеты по статьям', now(), now())
ON CONFLICT (project_id, schema_name, table_name) DO NOTHING;

-- Создаем метаданные колонок для таблицы customers (E-commerce)
DO $$
DECLARE
    table_id uuid;
BEGIN
    SELECT id INTO table_id FROM table_metadata WHERE project_id = 'proj-1' AND table_name = 'customers';
    
    INSERT INTO column_metadata (table_metadata_id, column_name, data_type, is_nullable, is_primary_key, is_foreign_key, description) VALUES 
    (table_id, 'id', 'uuid', false, true, false, 'Уникальный идентификатор клиента'),
    (table_id, 'first_name', 'varchar(100)', false, false, false, 'Имя клиента'),
    (table_id, 'last_name', 'varchar(100)', false, false, false, 'Фамилия клиента'),
    (table_id, 'email', 'varchar(255)', false, false, false, 'Email адрес'),
    (table_id, 'region_id', 'uuid', true, false, true, 'Ссылка на регион'),
    (table_id, 'status', 'varchar(20)', false, false, false, 'Статус клиента (active, inactive, blocked)'),
    (table_id, 'created_at', 'timestamp', false, false, false, 'Дата регистрации'),
    (table_id, 'updated_at', 'timestamp', false, false, false, 'Дата последнего обновления')
    ON CONFLICT (table_metadata_id, column_name) DO NOTHING;
END $$;

-- Создаем метаданные колонок для таблицы orders (E-commerce)
DO $$
DECLARE
    table_id uuid;
BEGIN
    SELECT id INTO table_id FROM table_metadata WHERE project_id = 'proj-1' AND table_name = 'orders';
    
    INSERT INTO column_metadata (table_metadata_id, column_name, data_type, is_nullable, is_primary_key, is_foreign_key, description) VALUES 
    (table_id, 'id', 'uuid', false, true, false, 'Уникальный идентификатор заказа'),
    (table_id, 'customer_id', 'uuid', false, false, true, 'Ссылка на клиента'),
    (table_id, 'total_amount', 'decimal(10,2)', false, false, false, 'Общая сумма заказа'),
    (table_id, 'status', 'varchar(20)', false, false, false, 'Статус заказа'),
    (table_id, 'created_at', 'timestamp', false, false, false, 'Дата создания заказа'),
    (table_id, 'updated_at', 'timestamp', false, false, false, 'Дата последнего обновления')
    ON CONFLICT (table_metadata_id, column_name) DO NOTHING;
END $$;

-- Создаем настройки приложения для админа
INSERT INTO app_settings (user_id, rag_examples_count, debug_mode, rag_similarity_threshold, created_at, updated_at) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 5, true, 0.35, now(), now())
ON CONFLICT (user_id) DO UPDATE SET
  rag_examples_count = EXCLUDED.rag_examples_count,
  debug_mode = EXCLUDED.debug_mode,
  rag_similarity_threshold = EXCLUDED.rag_similarity_threshold,
  updated_at = now();

-- Обновляем последний выбранный проект для админа
UPDATE users SET last_project_id = 'proj-1' WHERE id = '550e8400-e29b-41d4-a716-446655440000';