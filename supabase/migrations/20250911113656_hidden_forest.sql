```sql
-- Удалить существующие политики для таблицы "messages"
DROP POLICY IF EXISTS "Users can create messages in own chats" ON public.messages;
DROP POLICY IF EXISTS "Users can read messages from own chats" ON public.messages;

-- Разрешить всем аутентифицированным пользователям читать сообщения
CREATE POLICY "Allow all authenticated users to read messages"
ON public.messages
FOR SELECT
TO authenticated
USING (true);

-- Разрешить всем аутентифицированным пользователям создавать сообщения
CREATE POLICY "Allow all authenticated users to create messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (true);
```