# Fashion Post Generation Feature

## Обзор

Система генерации постов для fashion-блогеров с использованием SDXL 4.0 для создания изображений в full-height формате.

## Архитектура

### Database Schema

Добавлены новые поля в таблицу `content_tasks`:

```sql
location_id INTEGER             -- Индекс локации из blogger.locations (0-4)
location_description TEXT       -- Кастомное описание локации
outfit JSON                     -- Образ: {top: {type, value}, bottom: {}, ...}
main_image_url VARCHAR(1024)    -- URL подтвержденного основного кадра
prompts JSON                    -- Промпты для каждого кадра
generated_images JSON           -- История генераций
```

### API Endpoints

**PATCH /api/tasks/{task_id}/fashion/setup**
- Сохраняет location_id, location_description, outfit
- Body: `{location_id?: number, location_description?: string, outfit?: object}`
- Returns: Task

**POST /api/tasks/{task_id}/fashion/generate-main-frame**
- Генерирует основной кадр в полный рост (9:16)
- Body: `{prompt?: string, custom_instructions?: string}`
- Returns: `{image_url: string, prompt: string, task_id: number}`

**POST /api/tasks/{task_id}/fashion/approve-frame**
- Подтверждает сгенерированный кадр
- Body: `{frame_type: "main" | "angle1" | "angle2" | "angle3"}`
- При подтверждении main → сохраняет в main_image_url

**POST /api/tasks/{task_id}/fashion/generate-additional-frames**
- Генерирует 3 дополнительных ракурса (4:5) на основе подтвержденного main
- Body: `{base_prompt?: string}`
- Returns: `{frames: [{angle, image_url, prompt}, ...], task_id: number}`

### Image Generation

`backend/utils/image_generation.py`:

- `generate_fashion_frame(prompt, aspect_ratio)` - вызывает FAL.ai FLUX Pro
- `upload_fal_image_to_s3(fal_url, filename)` - сохраняет в S3 (опционально)

**FAL.ai Configuration:**
- Endpoint: `https://fal.run/fal-ai/flux-pro/v1.1-ultra`
- Sizes: 1080x1920 (9:16), 1080x1350 (4:5)
- Steps: 28, Guidance: 3.5

### Frontend Workflow

**1. Setup Tab (`/tasks/[id]` с `FashionPostTask.tsx`)**
- LocationSelector: 3 режима (preset/custom/upload)
- OutfitBuilder: 5 компонентов образа (топ/низ/обувь/носки/аксессуары)
- Кнопка "Продолжить к генерации" → сохраняет setup

**2. Generation Tab (`FashionFrameGenerator.tsx`)**

**Step 1: Main Frame**
- Кнопка "Сгенерировать основной кадр"
- Показывает изображение + prompt
- Редактирование prompt inline
- Custom instructions для regenerate
- Кнопка "Подтвердить" → переход к Step 2

**Step 2: Additional Frames** (доступен только после подтверждения main)
- Кнопка "Сгенерировать 3 ракурса"
- Grid 3 изображений
- Для каждого: индивидуальные Regenerate/Approve

## Environment Variables

Добавить в `.env`:

```bash
FAL_API_KEY=your_fal_api_key_here
```

## Deployment

### SQL Migration

Перед деплоем выполнить на Render PostgreSQL:

```bash
# Connect to Render DB
psql $DATABASE_URL

# Run migration
\i backend/migrations/add_fashion_generation_fields.sql
```

### Render Services

Добавить `FAL_API_KEY` в Environment Variables всех сервисов.

## Usage

1. Создать blogger с `type="fashion"` и массивом `locations`
2. Создать task с `content_type="post"`
3. Открыть `/tasks/{id}` → автоматически загрузится FashionPostTask
4. Выбрать локацию, построить образ
5. Сгенерировать основной кадр, отредактировать prompt
6. Подтвердить → сгенерировать 3 ракурса
7. Индивидуально подтвердить каждый ракурс

## Next Steps

- [ ] Implement S3 persistence for FAL images (currently uses temporary 24h URLs)
- [ ] Add regeneration for individual angles (not all 3 at once)
- [ ] Enhance ChatGPT script generation with outfit/location context
- [ ] Add loading states and progress indicators
- [ ] Implement error handling and retry logic
- [ ] Add image editing capabilities (crop, filters)
