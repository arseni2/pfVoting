# Парсер на Node.js + TypeScript + Playwright

## Установка

```bash
npm install
```

## Запуск

```bash
# Сборка и запуск
npm run dev

# Только сборка
npm run build

# Запуск скомпилированного файла
npm start
```

## Структура проекта

```
parcer/
├── src/
│   ├── index.ts      # Точка входа
│   ├── parser.ts     # Класс Parser для работы с браузером
│   ├── types.ts      # TypeScript типы
│   └── utils.ts      # Утилиты для сохранения данных
├── package.json
└── tsconfig.json
```

## Пример использования

```typescript
import { Parser } from './parser.js';

const parser = new Parser({
  baseUrl: 'https://example.com',
  headless: true
});

await parser.launch();
await parser.navigate('https://example.com');

const data = await parser.parse(async (page) => {
  return await page.$$eval('.item', elements =>
    elements.map(el => ({
      title: el.querySelector('h2')?.textContent,
      price: el.querySelector('.price')?.textContent
    }))
  );
});

await parser.close();
```

## Настройка

В `src/index.ts` измените:
- URL для парсинга
- Селекторы элементов
- Формат сохраняемых данных
