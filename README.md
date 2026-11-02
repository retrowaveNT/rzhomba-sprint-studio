# Compass Sprint Studio («Ржомба»)

Трекер задач с доской, бэклогом, спринтами, аналитикой и ИИ-ассистентом.

Материалы:

1. [Документ](https://docs.google.com/document/d/1MsZjMB1OtcSi1lPc4npeT6gUWCFqj6Qtzi8zSW5PaSI/edit?pli=1&tab=t.0)
2. [Макет в Figma](https://www.figma.com/design/jMu4IpJ5R6G2bd60lYJSO0/Untitled--Copy-?node-id=0-1&p=f&t=PTuHNLFl1Ml3BO4x-0)

## Стек

TanStack Start (SSR) · React 19 · Tailwind CSS 4 · Vite · Nitro · Vitest

## Запуск

Нужен Node.js 22+.

```sh
npm install
npm run dev      # http://localhost:3000
```

## Сборка и проверки

```sh
npm run build    # серверная сборка в .output/
npm start        # запуск собранного сервера
npm test
npm run lint
```

## Деплой (Render, Web Service)

- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Environment: `NODE_VERSION=22`

По умолчанию собирается Node-сервер. Другой таргет Nitro выбирается переменной `NITRO_PRESET`.
