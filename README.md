# StudioZero

**StudioZero** is an open-source, AI-powered film studio that transforms written stories — novels, screenplays, short stories — into fully produced cinematic films. It orchestrates a multi-agent pipeline that parses narrative structure, plans scenes, generates images and video shots, synthesizes character voices, and assembles everything into a final MP4.

---

## How It Works

StudioZero runs a sequential agent pipeline triggered when a user submits a story:

1. **Narrative Parser** — An LLM agent reads the raw text and extracts characters, locations, plot beats, and emotional arcs into a structured story graph.
2. **Director Agent** — Translates the story graph into a shot list: each scene is broken into individual shots with camera angles, lighting, and visual style prompts.
3. **Image Generator** — Sends each shot prompt to [Replicate](https://replicate.com) (SDXL / Flux) to produce a reference frame.
4. **Video Generator** — Animates each reference frame into a short video clip using Kling or Wan via Replicate.
5. **Audio Generator** — Uses [ElevenLabs](https://elevenlabs.io) to synthesize character dialogue and narration, then generates background music.
6. **Assembly** — FFmpeg concatenates all video clips, mixes the audio stems, and renders the final MP4 at 1080p.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Tailwind CSS 4, shadcn/ui |
| Backend | Node.js, Express 4, tRPC 11 |
| Database | MySQL / PlanetScale / TiDB (Drizzle ORM) |
| Auth | Email + password (bcrypt + JWT session cookies) |
| LLM | OpenAI GPT-4o (configurable) |
| Image Gen | Replicate — SDXL / Flux |
| Video Gen | Replicate — Kling / Wan |
| Voice | ElevenLabs API |
| Storage | AWS S3 |
| Assembly | FFmpeg (server-side) |

---

## Prerequisites

Before running locally you will need:

- **Node.js** 22+ and **pnpm** 10+
- **MySQL** 8+ (or a cloud database — PlanetScale, TiDB, Railway MySQL all work)
- **FFmpeg** installed on the server (`brew install ffmpeg` / `apt install ffmpeg`)
- API keys for the services listed in the [Environment Variables](#environment-variables) section

---

## Local Development

### 1. Clone the repository

```bash
git clone https://github.com/Sheldonos/SheldonOS.git
cd studiozero
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Copy the template and fill in your values:

```bash
cp env.template .env
```

Edit `.env` with your credentials (see [Environment Variables](#environment-variables) below).

### 4. Set up the database

Create a MySQL database named `studiozero`, then run migrations:

```bash
pnpm db:push
```

### 5. Start the development server

```bash
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

Create a `.env` file in the project root (use `env.template` as a starting point):

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | ✅ | Long random string for signing session cookies. Generate with `openssl rand -hex 32`. |
| `DATABASE_URL` | ✅ | MySQL connection string, e.g. `mysql://user:pass@localhost:3306/studiozero` |
| `OPENAI_API_KEY` | ✅ | OpenAI API key for GPT-4o (narrative parsing, scene planning) |
| `OPENAI_BASE_URL` | — | Override to use Azure OpenAI or a compatible proxy. Defaults to `https://api.openai.com/v1` |
| `OPENAI_MODEL` | — | Override the default model. Defaults to `gpt-4o` |
| `REPLICATE_API_TOKEN` | ✅ | Replicate token for image and video generation |
| `ELEVENLABS_API_KEY` | ✅ | ElevenLabs key for voice synthesis |
| `AWS_ACCESS_KEY_ID` | ✅ | AWS credentials for S3 file storage |
| `AWS_SECRET_ACCESS_KEY` | ✅ | AWS credentials for S3 file storage |
| `AWS_REGION` | ✅ | AWS region, e.g. `us-east-1` |
| `AWS_S3_BUCKET` | ✅ | S3 bucket name for storing assets |
| `VITE_GOOGLE_MAPS_API_KEY` | — | Google Maps key (only needed if using the Map component) |

---

## Project Structure

```
studiozero/
├── client/                   # React frontend
│   └── src/
│       ├── pages/            # Route-level components
│       ├── components/       # Reusable UI components
│       └── _core/            # Auth hooks, tRPC client
├── server/                   # Express + tRPC backend
│   ├── agents/               # AI agent implementations
│   │   ├── narrativeParser.ts
│   │   ├── director.ts
│   │   └── audioGenerator.ts
│   ├── assembly/             # FFmpeg assembly pipeline
│   │   └── ffmpeg.ts
│   ├── integrations/         # Third-party API clients
│   │   ├── replicate.ts
│   │   └── elevenlabs.ts
│   ├── _core/                # Auth, session, LLM helpers
│   ├── db.ts                 # Database query helpers
│   ├── routers.ts            # tRPC procedure definitions
│   └── storage.ts            # S3 file storage helpers
├── drizzle/                  # Database schema and migrations
│   └── schema.ts
├── shared/                   # Shared types and constants
├── env.template              # Environment variable template
└── README.md
```

---

## Authentication

StudioZero uses self-contained email/password authentication with bcrypt hashing and JWT session cookies. There is no external OAuth dependency.

To create the first admin account, register normally via the UI, then promote the user to admin directly in the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

---

## Running Tests

```bash
pnpm test
```

Tests cover database helpers, tRPC procedures, and agent logic. LLM-dependent tests require a valid `OPENAI_API_KEY` in the environment.

---

## Building for Production

```bash
pnpm build
pnpm start
```

The build compiles the React frontend into `dist/public` and bundles the server into `dist/index.js`. Set `NODE_ENV=production` and ensure all environment variables are configured before starting.

---

## Deployment

StudioZero is a standard Node.js + MySQL application and can be deployed to any platform that supports both:

- [Railway](https://railway.app) — provision MySQL + Node.js service in one project
- [Render](https://render.com) — Web Service + managed PostgreSQL (use MySQL add-on)
- [Fly.io](https://fly.io) — containerized deployment with persistent volumes
- Self-hosted VPS with Nginx reverse proxy

Ensure FFmpeg is available in the production environment for the assembly pipeline.

---

## Roadmap

The following capabilities are planned for future releases:

- Visual continuity validation using CLIP embeddings to ensure consistent character appearance across shots
- Background music generation via Suno or Udio API integration
- Custom voice cloning support through ElevenLabs voice library
- Storyboard preview mode before committing to full generation
- Collaborative projects with multi-user access controls
- Export to additional formats (ProRes, WebM, GIF)

---

## License

MIT License. See [LICENSE](LICENSE) for details.
