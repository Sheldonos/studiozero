# StudioZero - MVP TODO List

## 📋 Project Overview
Build an agentic AI film studio platform that transforms books/scripts into cinematic films with strict visual and narrative continuity.

**MVP Scope**: 10-20 minute film OR 5-8 episode vertical series (60-90s per episode)

---

## 🗄️ Database Schema

- [x] Projects table (id, user_id, title, source_file_url, format, style_preset, status, etc.)
- [x] Scenes table (id, project_id, scene_id, summary, location, emotion, status)
- [x] Shots table (id, scene_id, shot_id, shot_type, image_url, video_url, status, retry_count)
- [x] Story graphs table (id, project_id, characters, locations, narrative_data)
- [x] Generation jobs table (id, project_id, job_type, status, cost, metadata)
- [x] Audio stems table (for future audio implementation)

---

## 🔐 Authentication & User Management

- [x] User authentication (provided by template)
- [x] User dashboard to view projects
- [x] Project ownership and permissions

---

## 📤 File Upload & Storage

- [x] Text-based input interface (paste book/script text)
- [ ] File upload interface (PDF, EPUB, DOCX) - Future enhancement
- [x] S3 storage integration for generated assets (images, videos)

---

## 🎬 Core Pipeline - Backend

### Narrative Parsing Agent
- [x] LLM-based text extraction (characters, locations, scenes, dialogue)
- [x] Story graph generation
- [x] Scene boundary detection
- [x] Character and location extraction
- [x] Hard limits: max 30 scenes, max 3 main characters

### Director Agent (Scene Planning)
- [x] Scene-to-shot decomposition (3-5 shots per scene)
- [x] Shot type selection (wide, medium, close)
- [x] Prompt generation for image models
- [x] ShotSpec JSON generation
- [x] Creative direction application (style presets)

### Image Generation Pipeline
- [x] Replicate API integration (SDXL)
- [x] Character identity locking (seed management)
- [x] Synchronous image generation
- [x] Image storage to S3
- [ ] Webhook handling for async completion - Future optimization

### Visual Continuity Agent
- [ ] CLIP similarity scoring - Future enhancement
- [ ] Face embedding comparison - Future enhancement
- [ ] Character consistency validation - Future enhancement
- [ ] Auto-regeneration trigger on failure - Future enhancement

### Video Generation Pipeline
- [x] Replicate API integration (Stable Video Diffusion)
- [x] Image-to-video conversion (3-5s clips)
- [x] Motion prompt generation
- [x] Video storage to S3
- [ ] Webhook handling for async completion - Future optimization

### Audio Generation Pipeline
- [ ] ElevenLabs integration for voice - Future enhancement
- [ ] Narration generation - Future enhancement
- [ ] Character dialogue synthesis - Future enhancement
- [ ] Background music (stock loops initially) - Future enhancement
- [ ] Foley/ambient sound effects - Future enhancement

### Assembly Pipeline
- [ ] FFmpeg-based video concatenation - Future enhancement
- [ ] Audio track mixing (dialogue, music, foley) - Future enhancement
- [ ] Transition effects (fade in/out) - Future enhancement
- [ ] Audio-video synchronization - Future enhancement
- [ ] Final render to MP4 (1080p) - Future enhancement

### QA Agent
- [ ] Scene completeness validation - Future enhancement
- [ ] Visual consistency checks - Future enhancement
- [ ] Narrative coherence validation - Future enhancement
- [ ] Audio sync validation - Future enhancement
- [ ] Auto-fix and regeneration logic - Future enhancement

---

## 🔄 Workflow Orchestration

- [x] Basic pipeline orchestration (narrative → planning → image → video)
- [x] State management between pipeline stages
- [x] Error handling and status tracking
- [x] Cost tracking per project
- [ ] LangGraph/Temporal setup for agent coordination - Future enhancement
- [ ] Job queue system (Redis/SQS) - Future enhancement
- [ ] Retry logic with max 3 attempts - Future enhancement
- [ ] Webhook endpoints for external services - Future enhancement

---

## 🎨 Frontend UI

### Landing Page
- [x] Hero section with product description
- [x] Feature highlights
- [x] Style presets showcase
- [x] Call-to-action buttons
- [ ] Pricing tiers display - Future enhancement
- [ ] Example outputs showcase - Future enhancement

### Dashboard
- [x] Project list view (all user projects)
- [x] Project status indicators
- [x] Create new project button
- [x] Project cards with metadata

### Project Creation Flow
- [x] Text input interface
- [x] Format selection (film 16:9, series 16:9, vertical 9:16)
- [x] Style preset selection (rocky_70s_grit, a24_drama, etc.)
- [x] Casting override input (optional)
- [x] Target runtime input
- [x] Submit button with loading state

### Project Detail Page
- [x] Real-time status updates (auto-refresh every 5s)
- [x] Progress indicator with percentage
- [x] Scene breakdown view
- [x] Shot preview grid with images
- [x] Cost breakdown
- [x] Story overview (characters, locations)
- [ ] Final video player - Pending assembly implementation
- [ ] Download button - Pending assembly implementation
- [ ] Regeneration options - Future enhancement

### Admin Panel
- [ ] All projects overview - Future enhancement
- [ ] Failed jobs management - Future enhancement
- [ ] Cost analytics - Future enhancement
- [ ] User management - Future enhancement

---

## 🧪 Testing

### Unit Tests
- [ ] Narrative parsing agent tests - Next priority
- [ ] Director agent tests - Next priority
- [ ] Database operations tests - Next priority

### Integration Tests
- [ ] Replicate API integration tests - Next priority
- [ ] S3 storage tests - Next priority

### End-to-End Tests
- [ ] Full pipeline test with sample book - Next priority
- [ ] Failure scenario tests - Next priority
- [ ] Cost tracking validation - Next priority

---

## 🔧 Infrastructure & DevOps

- [x] Environment variables setup
- [x] Database migrations
- [ ] API keys management (Replicate) - Requires user input
- [ ] Error tracking (Sentry) - Future enhancement
- [ ] Logging infrastructure - Basic console logging implemented
- [ ] Monitoring and metrics - Future enhancement

---

## 🚀 MVP V1 Status

**Completed Core Features:**
- ✅ Full database schema with all tables
- ✅ Narrative parsing agent (LLM-based)
- ✅ Director agent for shot planning
- ✅ Image generation pipeline (Replicate SDXL)
- ✅ Video generation pipeline (Stable Video Diffusion)
- ✅ S3 storage integration
- ✅ Complete frontend UI (landing, dashboard, create, detail)
- ✅ Real-time status tracking
- ✅ Cost tracking

**Next Steps for Full MVP:**
1. Add Replicate API key via secrets management
2. Test end-to-end pipeline with sample book
3. Implement audio generation (ElevenLabs)
4. Implement assembly pipeline (FFmpeg)
5. Add retry logic and error recovery
6. Implement visual continuity validation

**Known Limitations:**
- No audio generation yet (silent films)
- No final assembly (individual shots only)
- No visual continuity validation
- No retry logic for failed generations
- Synchronous processing (can be slow)

---

## 📌 Notes

- MVP V1 focuses on proving the core pipeline: text → scenes → shots → images → videos
- Audio and assembly will be added in V1.1
- Visual continuity validation will be added in V1.2
- Current implementation is functional but not optimized for scale
- Requires REPLICATE_API_TOKEN environment variable to be set


---

## 🐛 Bug Fixes & Updates (Current)

- [x] Fix login authentication issue
- [x] Redesign landing page with clean gradient aesthetic
- [x] Add centered content layout with suggestion cards
- [x] Update color scheme to match new design (light blue to peach gradient)
- [x] Test authentication flow end-to-end


## 🎯 New Features (In Progress)

### Audio Generation
- [x] ElevenLabs API integration
- [x] Voice synthesis for character dialogue
- [x] Narration generation
- [ ] Background music integration
- [x] Audio stem management in database

### Assembly Pipeline
- [x] FFmpeg installation and setup
- [x] Video concatenation system
- [x] Audio track mixing (dialogue + music + foley)
- [x] Transition effects between shots
- [x] Final MP4 rendering at 1080p
- [x] Progress tracking for assembly jobs

### Custom Asset Upload
- [x] Asset upload UI component
- [x] S3 storage for user assets
- [x] Asset management in database
- [ ] Integration with image generation (use as reference)
- [x] Asset preview and deletion

### Homepage Enhancements
- [x] Interactive suggestion cards with navigation
- [ ] Example film gallery section
- [x] Homepage textarea auto-populate create form
- [x] Quick start template functionality
- [x] Responsive design improvements
