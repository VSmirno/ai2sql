/*
  # Создание тестовых данных

  1. Тестовый проект
  2. Участник проекта
  3. Тестовые чаты и сообщения
  4. Заметки пользователя
  5. SQL примеры
  6. Подключение к БД
  7. Настройки приложения
*/

-- Получаем ID суперпользователя
DO $$
DECLARE
  admin_user_id uuid;
  test_project_id uuid;
  test_chat_id uuid;
  test_connection_id uuid;
BEGIN
  -- Получаем ID администратора
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@ai.ru';
  
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Суперпользователь admin@ai.ru не найден';
  END IF;

  -- Создаем тестовый проект
  INSERT INTO projects (id, name, description, created_by)
  VALUES (gen_random_uuid(), 'Основной проект', 'Тестовый проект для демонстрации функционала', admin_user_id)
  RETURNING id INTO test_project_id;

  -- Добавляем создателя как администратора проекта
  INSERT INTO project_members (project_id, user_id, role, added_by)
  VALUES (test_project_id, admin_user_id, 'admin', admin_user_id);

  -- Создаем подключение к БД
  INSERT INTO database_connections (id, project_id, name, host, port, username, password, database)
  VALUES (
    gen_random_uuid(),
    test_project_id,
    'Production DB',
    'localhost',
    5432,
    'postgres',
    'password',
    'ai2sql_db'
  ) RETURNING id INTO test_connection_id;

  -- Обновляем проект с подключением
  UPDATE projects SET connection_id = test_connection_id WHERE id = test_project_id;

  -- Создаем тестовый чат
  INSERT INTO chats (id, name, user_id, project_id)
  VALUES (gen_random_uuid(), 'Новый чат', admin_user_id, test_project_id)
  RETURNING id INTO test_chat_id;

  -- Добавляем тестовые сообщения
  INSERT INTO messages (chat_id, role, content, sql_query) VALUES
  (test_chat_id, 'user', 'Покажи всех активных пользователей', NULL),
  (test_chat_id, 'assistant', 'Вот SQL-запрос для получения всех активных пользователей:', 'SELECT * FROM users WHERE status = ''active'';');

  -- Создаем заметки пользователя
  INSERT INTO user_notes (title, content, user_id, project_id) VALUES
  ('Важные таблицы', 'Основные таблицы в проекте:
- users: информация о пользователях
- orders: заказы пользователей
- products: каталог товаров', admin_user_id, test_project_id),
  ('Частые запросы', 'Список часто используемых запросов:
1. Активные пользователи за месяц
2. Топ товары по продажам
3. Статистика заказов по регионам', admin_user_id, test_project_id);

  -- Создаем SQL примеры
  INSERT INTO sql_examples (natural_language_query, sql_query, user_id, project_id) VALUES
  ('Найти всех активных пользователей', 'SELECT * FROM users WHERE status = ''active'';', admin_user_id, test_project_id),
  ('Показать заказы за последний месяц', 'SELECT * FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL ''1 month'';', admin_user_id, test_project_id);

  -- Создаем настройки приложения
  INSERT INTO app_settings (user_id, rag_examples_count, debug_mode, rag_similarity_threshold)
  VALUES (admin_user_id, 3, true, 0.40)
  ON CONFLICT (user_id) DO UPDATE SET
    rag_examples_count = 3,
    debug_mode = true,
    rag_similarity_threshold = 0.40;

END $$;