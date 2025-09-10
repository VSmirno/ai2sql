/*
  # Migration: Admin User and Mock Data Setup

  This migration creates the admin user and associated mock data in Supabase.

  ## Steps:
  1. Create admin user in users table
  2. Create sample projects
  3. Set up project memberships
  4. Create sample chats and messages
  5. Add user notes and SQL examples
  6. Set up database connections
  7. Configure app settings

  ## Security:
  - All tables have RLS enabled
  - Proper policies are in place
  - Admin user has superuser role
*/

-- Step 1: Create admin user
INSERT INTO users (
  id,
  email,
  name,
  role,
  created_at,
  updated_at
) VALUES (
  'admin-user-id',
  'admin@example.com',
  'Администратор',
  'superuser',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = now();

-- Step 2: Create sample projects
INSERT INTO projects (
  id,
  name,
  description,
  created_by,
  created_at,
  updated_at
) VALUES 
(
  'project-1-id',
  'E-commerce Analytics',
  'Проект для анализа данных интернет-магазина',
  'admin-user-id',
  now(),
  now()
),
(
  'project-2-id',
  'CRM System',
  'Система управления взаимоотношениями с клиентами',
  'admin-user-id',
  now(),
  now()
),
(
  'project-3-id',
  'Financial Dashboard',
  'Дашборд для финансовой отчетности',
  'admin-user-id',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = now();

-- Step 3: Set up project memberships (admin as admin of all projects)
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
  'project-1-id',
  'admin-user-id',
  'admin',
  'admin-user-id',
  now()
),
(
  gen_random_uuid(),
  'project-2-id',
  'admin-user-id',
  'admin',
  'admin-user-id',
  now()
),
(
  gen_random_uuid(),
  'project-3-id',
  'admin-user-id',
  'admin',
  'admin-user-id',
  now()
) ON CONFLICT (project_id, user_id) DO UPDATE SET
  role = EXCLUDED.role,
  added_by = EXCLUDED.added_by;

-- Step 4: Create sample chats
INSERT INTO chats (
  id,
  name,
  user_id,
  project_id,
  created_at,
  updated_at
) VALUES 
(
  'chat-1-id',
  'Анализ продаж по регионам',
  'admin-user-id',
  'project-1-id',
  now(),
  now()
),
(
  'chat-2-id',
  'Отчет по клиентам',
  'admin-user-id',
  'project-2-id',
  now(),
  now()
),
(
  'chat-3-id',
  'Финансовые показатели',
  'admin-user-id',
  'project-3-id',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = now();

-- Step 5: Create sample messages
INSERT INTO messages (
  id,
  chat_id,
  role,
  content,
  sql_query,
  created_at
) VALUES 
(
  gen_random_uuid(),
  'chat-1-id',
  'user',
  'Покажи продажи по регионам за последний месяц',
  NULL,
  now()
),
(
  gen_random_uuid(),
  'chat-1-id',
  'assistant',
  'Вот SQL-запрос для анализа продаж по регионам:',
  'SELECT r.region_name, SUM(s.amount) as total_sales, COUNT(s.id) as order_count
FROM sales s
JOIN regions r ON s.region_id = r.id
WHERE s.created_at >= DATE_TRUNC(''month'', CURRENT_DATE - INTERVAL ''1 month'')
  AND s.created_at < DATE_TRUNC(''month'', CURRENT_DATE)
GROUP BY r.region_name
ORDER BY total_sales DESC;',
  now()
),
(
  gen_random_uuid(),
  'chat-2-id',
  'user',
  'Найди всех активных клиентов с количеством заказов',
  NULL,
  now()
),
(
  gen_random_uuid(),
  'chat-2-id',
  'assistant',
  'Запрос для поиска активных клиентов:',
  'SELECT c.id, c.name, c.email, COUNT(o.id) as order_count, MAX(o.created_at) as last_order
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
WHERE c.status = ''active''
GROUP BY c.id, c.name, c.email
HAVING COUNT(o.id) > 0
ORDER BY order_count DESC;',
  now()
);

-- Step 6: Create user notes
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
- users: пользователи системы
- products: товары
- orders: заказы
- order_items: позиции заказов
- categories: категории товаров
- regions: регионы доставки

Важные связи:
- orders.user_id -> users.id
- order_items.order_id -> orders.id
- order_items.product_id -> products.id',
  'admin-user-id',
  'project-1-id',
  now(),
  now()
),
(
  gen_random_uuid(),
  'CRM Бизнес-правила',
  'Правила работы с клиентами:
1. Статус клиента может быть: active, inactive, blocked
2. Клиент считается VIP если сумма заказов > 100000
3. Неактивные клиенты - без заказов более 6 месяцев
4. Обязательные поля: name, email, phone
5. Email должен быть уникальным',
  'admin-user-id',
  'project-2-id',
  now(),
  now()
),
(
  gen_random_uuid(),
  'Финансовые KPI',
  'Ключевые показатели:
- Выручка (Revenue): сумма всех оплаченных заказов
- ARPU: средняя выручка на пользователя
- Конверсия: отношение заказов к визитам
- LTV: пожизненная ценность клиента
- CAC: стоимость привлечения клиента

Формулы:
- ARPU = Revenue / Active Users
- LTV = ARPU / Churn Rate',
  'admin-user-id',
  'project-3-id',
  now(),
  now()
);

-- Step 7: Create SQL examples
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
  'SELECT p.name, SUM(oi.quantity) as total_sold, SUM(oi.price * oi.quantity) as revenue
FROM products p
JOIN order_items oi ON p.id = oi.product_id
JOIN orders o ON oi.order_id = o.id
WHERE o.status = ''completed''
GROUP BY p.id, p.name
ORDER BY total_sold DESC
LIMIT 10;',
  'admin-user-id',
  'project-1-id',
  now()
),
(
  gen_random_uuid(),
  'Показать клиентов с наибольшим количеством заказов',
  'SELECT c.name, c.email, COUNT(o.id) as order_count, SUM(o.total_amount) as total_spent
FROM customers c
JOIN orders o ON c.id = o.customer_id
WHERE o.status IN (''completed'', ''shipped'')
GROUP BY c.id, c.name, c.email
ORDER BY order_count DESC
LIMIT 20;',
  'admin-user-id',
  'project-2-id',
  now()
),
(
  gen_random_uuid(),
  'Рассчитать месячную выручку по категориям',
  'SELECT cat.name as category, 
       DATE_TRUNC(''month'', o.created_at) as month,
       SUM(oi.price * oi.quantity) as revenue
FROM categories cat
JOIN products p ON cat.id = p.category_id
JOIN order_items oi ON p.id = oi.product_id
JOIN orders o ON oi.order_id = o.id
WHERE o.status = ''completed''
  AND o.created_at >= CURRENT_DATE - INTERVAL ''12 months''
GROUP BY cat.name, DATE_TRUNC(''month'', o.created_at)
ORDER BY month DESC, revenue DESC;',
  'admin-user-id',
  'project-3-id',
  now()
),
(
  gen_random_uuid(),
  'Найти пользователей без заказов за последние 3 месяца',
  'SELECT u.id, u.name, u.email, u.created_at, MAX(o.created_at) as last_order
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id, u.name, u.email, u.created_at
HAVING MAX(o.created_at) < CURRENT_DATE - INTERVAL ''3 months'' 
   OR MAX(o.created_at) IS NULL
ORDER BY last_order DESC NULLS LAST;',
  'admin-user-id',
  'project-1-id',
  now()
),
(
  gen_random_uuid(),
  'Показать динамику регистраций пользователей по месяцам',
  'SELECT DATE_TRUNC(''month'', created_at) as month,
       COUNT(*) as new_users,
       SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC(''month'', created_at)) as cumulative_users
FROM users
WHERE created_at >= CURRENT_DATE - INTERVAL ''24 months''
GROUP BY DATE_TRUNC(''month'', created_at)
ORDER BY month;',
  'admin-user-id',
  'project-2-id',
  now()
);

-- Step 8: Create database connections
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
  'project-1-id',
  'E-commerce Production DB',
  'ecommerce-prod.example.com',
  5432,
  'ecommerce_user',
  'encrypted_password_123',
  'ecommerce_db',
  now(),
  now()
),
(
  gen_random_uuid(),
  'project-2-id',
  'CRM Database',
  'crm-db.example.com',
  5432,
  'crm_admin',
  'secure_password_456',
  'crm_system',
  now(),
  now()
),
(
  gen_random_uuid(),
  'project-3-id',
  'Financial Data Warehouse',
  'finance-dw.example.com',
  5432,
  'finance_analyst',
  'analytics_pass_789',
  'financial_dw',
  now(),
  now()
);

-- Step 9: Create app settings for admin user
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
  'admin-user-id',
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

-- Step 10: Update admin user's last project
UPDATE users 
SET last_project_id = 'project-1-id', updated_at = now()
WHERE id = 'admin-user-id';

-- Step 11: Create sample table metadata for project 1
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
  gen_random_uuid(),
  'project-1-id',
  'public',
  'users',
  'Таблица пользователей системы',
  now(),
  now()
),
(
  gen_random_uuid(),
  'project-1-id',
  'public',
  'products',
  'Каталог товаров',
  now(),
  now()
),
(
  gen_random_uuid(),
  'project-1-id',
  'public',
  'orders',
  'Заказы клиентов',
  now(),
  now()
),
(
  gen_random_uuid(),
  'project-1-id',
  'public',
  'order_items',
  'Позиции в заказах',
  now(),
  now()
);

-- Verification queries (commented out, use for testing)
/*
-- Verify admin user exists
SELECT * FROM users WHERE email = 'admin@example.com';

-- Verify projects and memberships
SELECT p.name, pm.role 
FROM projects p 
JOIN project_members pm ON p.id = pm.project_id 
WHERE pm.user_id = 'admin-user-id';

-- Verify chats and messages
SELECT c.name, COUNT(m.id) as message_count
FROM chats c
LEFT JOIN messages m ON c.id = m.chat_id
WHERE c.user_id = 'admin-user-id'
GROUP BY c.id, c.name;

-- Verify notes and examples
SELECT 
  (SELECT COUNT(*) FROM user_notes WHERE user_id = 'admin-user-id') as notes_count,
  (SELECT COUNT(*) FROM sql_examples WHERE user_id = 'admin-user-id') as examples_count;
*/