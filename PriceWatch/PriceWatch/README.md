# PriceWatch 📈

Aplicativo mobile de monitoramento de ativos financeiros com alertas em tempo real.

## Estrutura do Projeto

```
PriceWatch/
├── mobile/          # React Native (iOS + Android)
│   └── src/
│       ├── screens/        # Telas do app
│       ├── components/     # Componentes reutilizáveis
│       ├── navigation/     # React Navigation
│       ├── services/       # Chamadas à API
│       ├── store/          # Zustand (estado global)
│       ├── i18n/           # Internacionalização PT/EN/ES
│       ├── hooks/          # Custom hooks
│       └── utils/          # Helpers e formatadores
└── backend/         # Node.js + Express
    └── src/
        ├── routes/         # Endpoints REST
        ├── controllers/    # Lógica de negócio
        ├── middleware/      # Auth JWT, validação
        ├── models/         # Prisma ORM (PostgreSQL)
        ├── services/       # Price fetcher, notificações
        └── workers/        # Background jobs (alertas)
```

## Stack Tecnológica

| Camada         | Tecnologia                          |
|----------------|-------------------------------------|
| Mobile         | React Native + Expo                 |
| Estado         | Zustand                             |
| Navegação      | React Navigation 6                  |
| Backend        | Node.js + Express                   |
| Banco de dados | PostgreSQL via Prisma ORM           |
| Cache          | Redis                               |
| Autenticação   | JWT + bcrypt                        |
| Push           | Firebase Cloud Messaging (FCM)      |
| Dados mercado  | Yahoo Finance API + Polygon.io      |
| i18n           | i18next                             |

## Como Rodar

### Backend
```bash
cd backend
npm install
cp .env.example .env   # preencha as variáveis
npx prisma migrate dev
npm run dev
```

### Mobile
```bash
cd mobile
npm install
npx expo start
```

## Funcionalidades

- ✅ Cadastro com 7 campos obrigatórios + criptografia bcrypt
- ✅ Login com JWT persistido (AsyncStorage)
- ✅ Dashboard com ativos monitorados
- ✅ Busca em 10 bolsas das Américas + Forex
- ✅ Alertas de preço acima/abaixo com push notification
- ✅ Gráfico de histórico de preços
- ✅ Favoritar ativos
- ✅ Dark mode
- ✅ i18n: Português 🇧🇷 · Inglês 🇺🇸 · Espanhol 🇪🇸
- ✅ Logout seguro

## Bolsas Suportadas

NYSE · NASDAQ · B3 · TSX · BMV · BVL · BCS · BVRD · BYMA · Forex
