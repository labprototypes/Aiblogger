# Locations & Outfits Management

## Overview

Расширенное управление локациями и образами для fashion-блогеров. Локации и образы настраиваются один раз в профиле блогера, затем используются как пресеты при создании задач.

## Features

### Locations Manager
- **Просмотр**: Grid с превью всех локаций (title + thumbnail)
- **Добавление**: 
  - Upload mode: загрузка фото + название
  - Generate mode: текстовый промпт → SDXL 4.0 → превью → принять/перегенерировать
- **Удаление**: Кнопка удаления с подтверждением

### Outfits Manager
- **Просмотр**: Grid full-body outfit изображений
- **Добавление**:
  - Composite mode: загрузка частей (👕 верх, 👖 низ, 👟 обувь, 👜 аксессуары) → SDXL собирает в полный образ
  - Название обязательно
- **Генерация**: SDXL создает full-height portrait на основе загруженных частей
- **Удаление**: Кнопка удаления с подтверждением

## API Endpoints

### Locations
```
POST   /api/bloggers/{id}/locations          # Add location
DELETE /api/bloggers/{id}/locations/{idx}    # Delete location
POST   /api/bloggers/{id}/locations/generate # Generate via SDXL
```

### Outfits
```
POST   /api/bloggers/{id}/outfits            # Add outfit
DELETE /api/bloggers/{id}/outfits/{idx}      # Delete outfit
POST   /api/bloggers/{id}/outfits/generate   # Generate composite outfit
```

## Database Schema

### Blogger Model
```python
locations = Column(JSON)  # [{title: str, description: str, thumbnail: str}]
outfits = Column(JSON)    # [{name: str, image_url: str, parts: {...}}]
```

## UI Components

### LocationsManager
**Location:** `frontend/app/bloggers/[id]/LocationsManager.tsx`

**Props:**
- `bloggerId: number`
- `locations: Location[]`
- `onUpdate: (locations: Location[]) => void`

### OutfitsManager
**Location:** `frontend/app/bloggers/[id]/OutfitsManager.tsx`

**Props:**
- `bloggerId: number`
- `outfits: Outfit[]`
- `onUpdate: (outfits: Outfit[]) => void`

### Integration
Both managers are integrated into **EditForm.tsx** and only shown for fashion bloggers (`type === "fashion"`).

## Workflow

1. **Setup Phase**: Edit blogger → Add locations/outfits → Save
2. **Task Creation Phase**: Create fashion task → Select from existing locations/outfits (visual grid selector)
3. **Generation**: SDXL 4.0 generates frames using selected presets

## Migration

Run migration to add `outfits` field:
```bash
psql $DATABASE_URL -f backend/migrations/add_outfits_field.sql
```

## SDXL Integration

- **Locations**: 16:9 aspect ratio (landscape)
- **Outfits**: 3:4 aspect ratio (portrait, full body)
- Uses existing `generate_fashion_frame()` from `backend/utils/image_generation.py`
- API: FAL.ai FLUX Pro v1.1-ultra

## Notes

- Locations/outfits stored as JSON arrays in database
- Frontend manages state locally, saves on form submit
- Delete operations rebuild array without deleted index
- Generation workflow: prompt → API call → preview → accept/regenerate
