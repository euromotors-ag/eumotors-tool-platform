# EuroMotors Internal Platform

En omfattande intern plattform för EuroMotors som centraliserar och automatiserar viktiga affärsprocesser genom integrerade verktyg och tjänster.

## 🚀 Översikt

EuroMotors Internal Platform är en modern webbapplikation byggd med React och TypeScript som fungerar som den digitala ryggraden för EuroMotors interna operationer. Plattformen erbjuder säker åtkomst till olika tredjepartstjänster och interna verktyg för att effektivisera arbetsflöden och förbättra produktiviteten.

## 🏗️ Arkitektur

### Frontend Stack

- **React 19** med TypeScript för typ-säker utveckling
- **Vite 6** för snabb utveckling och optimerad byggprocess
- **Tailwind CSS 4** för modern, responsiv UI-design
- **React Router 7** för navigation och routing
- **Clerk** för autentisering och användarhantering

### Backend Stack

- **Node.js** med Express.js för RESTful API
- **TypeScript** för typ-säkerhet och bättre utvecklarupplevelse
- **AWS S3** för molnlagring av bilder och filer
- **Playwright** för web scraping och automatisering
- **Multer** för filuppladdning och hantering

### Tredjepartstjänster

- **CarCutter API** - AI-driven bildbehandling för fordonsbilder
- **AWS S3** - Molnlagring för processade bilder
- **Scrape.do** - Web scraping med proxy-stöd
- **Blocket.se** - Automatiserad dataextraktion från bilannonser

## 📁 Projektstruktur

```
Internal Platform/
├── backend/                    # Express.js API server
│   ├── controllers/           # API controllers
│   ├── services/              # Business logic services
│   ├── routes/                # API routes
│   ├── middlewares/           # Express middlewares
│   ├── config/                # Konfigurationsfiler
│   ├── types/                 # TypeScript type definitions
│   └── utils/                 # Hjälpfunktioner
├── frontend/                  # React frontend applikation
│   ├── src/
│   │   ├── components/        # Återanvändbara UI-komponenter
│   │   │   ├── image-editor/  # Bildbehandlingsgränssnitt
│   │   │   ├── data-editor/   # Datahanteringsverktyg
│   │   │   ├── scrape-editor/ # Web scraping verktyg
│   │   │   └── ui/           # Grundläggande UI-komponenter
│   │   ├── pages/            # Huvudsidor
│   │   ├── hooks/            # Anpassade React hooks
│   │   ├── contexts/         # React contexts
│   │   ├── libs/             # Externa bibliotek
│   │   └── utils/            # Hjälpfunktioner
│   └── public/               # Statiska filer
└── docker-compose.yml        # Docker konfiguration
```

## 🛠️ Huvudfunktioner

### 1. **Bildbehandling (Image Editor)**

- **AI-driven bakgrundsborttagning** via CarCutter API
- **Batch-bearbetning** av flera bilder samtidigt
- **Stöd för flera bildformat** (JPG, PNG, WebP)
- **Molnlagring** med AWS S3 integration
- **Automatisk licensplatta-överlagring** för EuroMotors och CarTrade24
- **Anpassningsbara scener** och overlay-bilder

### 2. **Datahantering (Data Editor)**

- **Excel-filbehandling** med XLSX-biblioteket
- **Datavalidering** och transformation med Zod
- **Exportfunktioner** för processade data
- **Mallbaserad datainmatning**
- **Strukturerad datahantering** för fordonskataloger

### 3. **Web Scraping (Scrape Editor)**

- **Blocket.se integration** för automatisk bilannons-extraktion
- **Playwright-baserad scraping** med headless browser
- **Proxy-stöd** för att undvika detektering
- **Bildnedladdning** och automatisk bearbetning
- **Konfigurerbara scraping-parametrar**

### 4. **Säkerhetsfunktioner**

- **Clerk-autentisering** med Google OAuth
- **Skyddad API-åtkomst** med middleware
- **Miljövariabel-hantering** för känsliga data
- **Input-validering** och sanitering
- **CORS-konfiguration** för säker kommunikation

## 🔐 Säkerhet och Autentisering

### Autentiseringssystem

- **Clerk** med Google OAuth integration
- **Skyddade routes** med `ProtectedRoute` komponent
- **Automatisk omdirigering** för oautentiserade användare
- **SSO-callback** hantering

### API-säkerhet

- **Helmet** för säkerhetsheaders
- **CORS-konfiguration** med specifika ursprung
- **Input-validering** med express-validator
- **Rate limiting** och timeout-hantering

## 🚀 Komma igång

### Förutsättningar

- Node.js 18+
- npm eller yarn
- Docker (valfritt för containerisering)
- Åtkomst till EuroMotors interna nätverk

### Installation

1. **Klona repository**

   ```bash
   git clone [repository-url]
   cd internal-platform
   ```

2. **Installera dependencies**

   ```bash
   # Frontend
   cd frontend
   npm install

   # Backend
   cd ../backend
   npm install
   ```

3. **Miljövariabler**

   ```bash
   # Skapa .env filer i både frontend/ och backend/
   # Se .env.example för exempel på nödvändiga variabler
   ```

4. **Starta utvecklingsmiljö**

   **Med Docker (rekommenderat):**

   ```bash
   docker-compose up --build
   ```

   **Manuellt:**

   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

### Åtkomst

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Health Check:** http://localhost:3000/api/health

## 📊 API Endpoints

### Bildbehandling

- `POST /api/v1/images/process` - Bearbeta bilder med CarCutter
- `GET /api/v1/images/status` - Kontrollera bearbetningsstatus
- `POST /api/v1/images/upload` - Ladda upp bilder till S3

### Web Scraping

- `POST /api/v1/scrape/blocket` - Scrapa Blocket-annonser
- `POST /api/v1/scrape/images` - Ladda ner bilder från URL:er

## 🎨 UI/UX Funktioner

### Design System

- **Mörkt tema** för professionell arbetsmiljö
- **Responsiv design** som fungerar på desktop och mobil
- **Modern komponentarkitektur** med återanvändbara element
- **Tillgänglighet** enligt WCAG-riktlinjer

### Användarupplevelse

- **Laddningsindikatorer** för smidig användarupplevelse
- **Felhantering** med tydliga meddelanden
- **Debug-terminal** för utvecklare
- **Toast-notifikationer** för feedback

## 🔧 Utveckling

### Kodstandarder

- **TypeScript** för typ-säkerhet
- **ESLint** för kodkvalitet
- **Prettier** för kodformatering
- **Functional programming** patterns
- **DRY och SOLID** principer

### Byggprocess

```bash
# Frontend
npm run build    # Produktionsbyggnad
npm run preview  # Förhandsvisning av byggnad
npm run lint     # Kodanalys

# Backend
npm run build    # TypeScript kompilering
npm run dev      # Utvecklingsläge med hot reload
```

### Docker Support

- **Multi-stage builds** för optimerade images
- **Development containers** med hot reload
- **Production-ready** konfiguration

## 📈 Prestanda och Optimering

### Frontend Optimering

- **Code splitting** med dynamiska imports
- **Tree shaking** för mindre bundle-storlek
- **Vite** för snabb utveckling och byggnad
- **React.memo** för komponentoptimering

### Backend Optimering

- **Asynkron bearbetning** för tunga operationer
- **Connection pooling** för databasanslutningar
- **Caching** av API-svar
- **Streaming** för stora filer

## 🧪 Testning och Kvalitetssäkring

### Kodkvalitet

- **TypeScript** för kompileringstidskontroll
- **ESLint** för kodstandarder
- **Prettier** för konsistent formatering
- **Manual testing** med debug-terminal

### Säkerhetstestning

- **Input validation** på alla endpoints
- **CORS-konfiguration** för säker kommunikation
- **Environment variable validation**
- **Error handling** för robusta applikationer

## 📚 Dokumentation och Support

### API Dokumentation

- **Swagger/OpenAPI** integration (planerad)
- **Inline kommentarer** för komplex logik
- **Type definitions** för alla interfaces

### Felsökning

- **Debug terminal** i frontend
- **Console logging** med strukturerad output
- **Error boundaries** för React-komponenter

## 🔄 Deployment och CI/CD

### Miljöer

- **Development** - Lokal utveckling
- **Staging** - Testmiljö (planerad)
- **Production** - Live-miljö

### Deployment

- **Docker containers** för konsistent miljö
- **Environment variables** för konfiguration
- **Health checks** för övervakning

## 📋 Roadmap och Framtida Funktioner

### Planerade Förbättringar

- [ ] **Apify integration** för avancerad web scraping
- [ ] **Bulk operations** för stora datamängder
- [ ] **API rate limiting** och caching
- [ ] **Real-time notifications** med WebSockets
- [ ] **Advanced image processing** med fler AI-tjänster
- [ ] **Data export** i flera format (CSV, JSON, XML)
- [ ] **User management** och rollbaserad åtkomst
- [ ] **Audit logging** för säkerhetsspårning

### Tekniska Förbättringar

- [ ] **Unit testing** med Jest/Vitest
- [ ] **E2E testing** med Playwright
- [ ] **Performance monitoring** med APM
- [ ] **Database integration** för persistent lagring
- [ ] **Microservices architecture** för skalbarhet

## 🤝 Bidrag och Utveckling

### Utvecklingsprocess

1. **Fork** repository
2. **Skapa feature branch** från main
3. **Implementera ändringar** med tydliga commits
4. **Testa lokalt** innan push
5. **Skapa Pull Request** med beskrivning

### Kodstandarder

- Följ befintliga TypeScript/React patterns
- Använd semantiska commit-meddelanden
- Inkludera dokumentation för nya funktioner
- Testa ändringar lokalt innan submission

## 📞 Support och Kontakt

För tekniska frågor eller support, kontakta utvecklingsteamet via:

- **Internal Slack** - #internal-platform
- **Email** - dev-team@eumotors.com
- **GitHub Issues** - För buggrapporter och feature requests

---

**Version:** 1.0.0  
**Senast uppdaterad:** 2024  
**Licens:** Proprietary - EuroMotors AG
