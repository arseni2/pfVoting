# pfVoting

Telegram-бот для проведения голосований в рабочих чатах.

## О проекте

Проект предназначен для автоматизации процесса сбора идей и проведения голосований в командах.

**Основной сценарий использования:** дни пиццы — бот рассылает запросы по отделам, собирает варианты от сотрудников, проводит голосование и предоставляет итоговый результат.

## Возможности

### Админ-панель

- Просмотр списка активных голосований
- Управление вариантами ответов
- Просмотр результатов в реальном времени

### Telegram-бот

- Сбор вариантов для голосования
- Проведение голосования с интерактивными кнопками
- Подсчёт и публикация итоговых результатов

## Особенности

- Простое создание голосований через админ-панель
- Автоматический сбор вариантов от участников в Telegram
- Интерактивные кнопки для быстрого голосования
- Поддержка множественного выбора
- Реальное время обновления результатов
- Гибкая настройка параметров голосования

## Установка

```bash

git clone <repository-url>


cd client

npm ci

cd server

npm ci
```

## Использование

```bash
cd server

npm run start:dev

cd client

npm run dev
```

## Технологии

- **Frontend:** React
- **Backend:** NestJS
- **Telegram Bot API:** node-telegram-bot-api / telegraf
- **База данных:** 
- **ORM:**

## Лицензия

MIT

# Идея 1

## 📋 Справочник команд


| Команда               | Описание                     | Доступ          | Параметры                     |
| --------------------- | ---------------------------- | --------------- | ----------------------------- |
| `/start`              | Регистрация и главное меню   | Все             | —                             |
| `/departments`        | Показать список отделов      | Все             | —                             |
| `/departments_create` | Создать новый отдел          | Все             | -                             |
| `/departments_set`    | Привязать себя к отделу      | Все             | `<name>` или reply-to-message |
| `/event_start`        | Начать событие               | -               | -                             |
| `/event_cacnel`       | Oтменить событие             | -               | -                             |
| `/pizza_order`        | Предложить вариант пиццы     | Все (с отделом) | `<name> + <addons>`           |
| `/pizza_vote`         | Запустить голосование        | все             | -                             |
| `/pizza_result`       | Сформировать итоговый список | -               | —                             |
| `/help`               | Показать справку             | Все             | —                             |


---

Пример работы: [https://www.figma.com/design/bENlqR21jY8CGuuHuqxw84/Untitled?node-id=5-87&t=EWOUcg4FdI34QtYT-1](https://www.figma.com/design/bENlqR21jY8CGuuHuqxw84/Untitled?node-id=5-87&t=EWOUcg4FdI34QtYT-1)

---

## 🗄️ Структура БД (DBML)

```dbml
// Docs: https://dbml.dbdiagram.io/docs

Table departments {
  id integer [primary key]
  name varchar [unique, not null]
  pizza_limit integer [default: 2]
  created_at timestamp [default: `CURRENT_TIMESTAMP`]
  is_active boolean [default: true]
}

Table users {
  id integer [primary key]
  tg_id bigint [unique, not null]
  username varchar
  full_name varchar
  department_id integer
  created_at timestamp [default: `CURRENT_TIMESTAMP`]
  is_active boolean [default: true]
}

Table pizza_event {
  id integer [primary key]
  started_at timestamp [default: `CURRENT_TIMESTAMP`]
  status varchar [default: 'active', note: 'active | completed | cancelled']
  result_message_id bigint
  created_at timestamp [default: `CURRENT_TIMESTAMP`]
} 

Table pizza_orders {
  id integer [primary key]
  event_id integer [not null]
  user_id integer [not null]
  department_id integer [not null]
  pizza_name varchar [not null]
  addons text
  comment text
  created_at timestamp [default: `CURRENT_TIMESTAMP`]
  is_voted boolean [default: false]
  vote_count integer [default: 0]
}

Table pizza_votes {
  id integer [primary key]
  event_id integer [not null]
  order_id integer [not null]
  voter_id integer [not null] 
  created_at timestamp [default: `CURRENT_TIMESTAMP`]
}
 

// Foreign Key Relationships (binary only)
Ref: users.department_id > departments.id 
Ref: pizza_orders.event_id  > pizza_event.id
Ref: pizza_orders.user_id > users.id
Ref: pizza_orders.department_id > departments.id
Ref: pizza_votes.event_id > pizza_event.id
Ref: pizza_votes.order_id > pizza_orders.id
Ref: pizza_votes.voter_id > users.id
```

# Идея 2

## 📋 Справочник команд

---


| Команда             | Описание                                         | Доступ | Параметры                         |
| ------------------- | ------------------------------------------------ | ------ | --------------------------------- |
| `/start`            | Регистрация и главное меню                       | Все    | —                                 |
| `/help`             | Показать справку                                 | Все    | —                                 |
| `/rooms`            | Показать список всех комнат                      | Все    | —                                 |
| `/rooms_create`     | Создать новую комнату                            | Все    | —                                 |
| `/rooms_join`       | Присоединиться к комнате                         | Все    | `<ссылка>` или выбо из списка     |
| `/rooms_leave`      | Покинуть текущую комнату                         | Все    | —                                 |
| `/rooms_info`       | Информация о комнате (участники, заказы, статус) | Все    | —                                 |
| `/rooms_results`    | Итоговый список заказов в комнате                | Все    | —                                 |
| `/pizza_order`      | Предложить вариант пиццы                         | Все    | `<name> + <addons> (комментарий)` |
| `/pizza_orders`     | Мои заказы в текущей комнате                     | Все    | —                                 |
| `/pizza_orders_all` | Все заказы в текущей комнате                     | Все    | —                                 |
| `/pizza_orders_put` | Изменить свой заказ                              | Все    | `<order_id>`                      |
| `/vote_create`      | Запустить голосование по заказам                 | Все    | —                                 |
| `/vote_get`         | Получение данных о голосовании по запросу        | Все    | `<pizza_id> <for/against>`        |
| `/vote_result`      | Результаты текущего голосования                  | Все    | —                                 |
| `/vote_results`     | История всех голосований в комнате               | Все    | —                                 |


---

Пример работы: [https://www.figma.com/design/bENlqR21jY8CGuuHuqxw84/Untitled?node-id=13-2&t=cd3dVxm6S4ImX2Yy-4](https://www.figma.com/design/bENlqR21jY8CGuuHuqxw84/Untitled?node-id=13-2&t=cd3dVxm6S4ImX2Yy-4)