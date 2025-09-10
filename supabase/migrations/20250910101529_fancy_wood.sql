/*
  # Создание тестовых данных в Supabase

  1. Тестовые данные
    - Создание тестового проекта
    - Создание участника проекта
    - Создание тестового чата
    - Создание заметок пользователя
    - Создание SQL примеров
    - Создание подключения к БД
    - Создание настроек приложения

  2. Безопасность
    - Все данные создаются для суперпользователя admin@ai.ru
*/

-- Создаем тестовый проект
INSERT INTO projects (id, name, description, created_by) 
VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Основной проект',
  'Проект для работы с основной базой данных',
  (SELECT id FROM auth.users WHERE email = 'admin@ai.ru')
) ON CONFLICT (id) DO NOTHING;

-- Добавляем суперпользователя как администратора проекта
INSERT INTO project_members (project_id, user_id, role, added_by)
VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  (SELECT id FROM auth.users WHERE email = 'admin@ai.ru'),
  'admin',
  (SELECT id FROM auth.users WHERE email = 'admin@ai.ru')
) ON CONFLICT (project_id, user_id) DO NOTHING;

-- Создаем тестовый чат
INSERT INTO chats (id, name, user_id, project_id)
VALUES (
  'c47ac10b-58cc-4372-a567-0e02b2c3d480',
  'Новый чат',
  (SELECT id FROM auth.users WHERE email = 'admin@ai.ru'),
  'f47ac10b-58cc-4372-a567-0e02b2c3d479'
) ON CONFLICT (id) DO NOTHING;

-- Создаем тестовые заметки
INSERT INTO user_notes (title, content, user_id, project_id)
VALUES 
(
  'Структура пользователей',
  'Таблица users содержит информацию о пользователях системы. Поле status может быть: active, inactive, pending.',
  (SELECT id FROM auth.users WHERE email = 'admin@ai.ru'),
  'f47ac10b-58cc-4372-a567-0e02b2c3d479'
),
(
  'Продажи и заказы',
  'Orders связаны с users через user_id. Статусы заказов: draft, pending, completed, cancelled.',
  (SELECT id FROM auth.users WHERE email = 'admin@ai.ru'),
  'f47ac10b-58cc-4372-a567-0e02b2c3d479'
) ON CONFLICT DO NOTHING;

-- Создаем тестовые SQL примеры
INSERT INTO sql_examples (natural_language_query, sql_query, user_id, project_id)
VALUES 
(
  'Найти всех активных пользователей',
  'SELECT * FROM users WHERE status = ''active'';',
  (SELECT id FROM auth.users WHERE email = 'admin@ai.ru'),
  'f47ac10b-58cc-4372-a567-0e02b2c3d479'
),
(
  'Получить общую сумму заказов за текущий месяц',
  'SELECT SUM(total_amount) FROM orders WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE);',
  (SELECT id FROM auth.users WHERE email = 'admin@ai.ru'),
  'f47ac10b-58cc-4372-a567-0e02b2c3d479'
) ON CONFLICT DO NOTHING;

-- Создаем тестовое подключение к БД
INSERT INTO database_connections (id, project_id, name, host, port, username, password, database)
VALUES (
  'd47ac10b-58cc-4372-a567-0e02b2c3d481',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Production DB',
  'localhost',
  5432,
  'admin',
  'password',
  'ai2sql_db'
) ON CONFLICT (id) DO NOTHING;

-- Создаем настройки приложения для пользователя
INSERT INTO app_settings (user_id, rag_examples_count, debug_mode, rag_similarity_threshold)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@ai.ru'),
  3,
  true,
  0.40
) ON CONFLICT (user_id) DO NOTHING;