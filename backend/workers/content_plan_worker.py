from sqlalchemy.orm import Session
from ..db.connection import engine
from ..db import models
from ..utils.openai_chat import generate_text
from datetime import datetime, date
from typing import Dict, List


def generate_plan(blogger_id: int, days: list[str], content_type: str = "video"):
    """Legacy method - kept for backwards compatibility"""
    with Session(engine) as s:
        for day in days:
            idea = generate_text(f"Idea for {day} ({content_type})")
            task = models.ContentTask(
                blogger_id=blogger_id,
                date=day,
                content_type=content_type,
                idea=idea,
                status="PLANNED",
            )
            s.add(task)
        s.commit()
    return True


def generate_plan_smart(
    blogger_id: int, 
    days: List[str], 
    content_frequency: Dict[str, int],
    blogger_context: Dict[str, str]
):
    """
    Smart content planning:
    1. Parse content_frequency (e.g., {reels: 3, post: 2} = 3 reels + 2 posts per week)
    2. Distribute content types across weeks logically
    3. Generate AI-powered ideas for each task based on blogger context + season + trends
    """
    
    if not content_frequency:
        # Fallback: create 3 posts per week if no frequency set
        content_frequency = {"post": 3}
    
    # Build weekly schedule pattern
    # Example: {reels: 3, post: 2} -> Mon/Wed/Fri = reels, Tue/Thu = post
    weekly_pattern = _build_weekly_pattern(content_frequency)
    
    with Session(engine) as s:
        tasks_created = 0
        
        for day_str in days:
            day_date = date.fromisoformat(day_str)
            weekday = day_date.weekday()  # 0=Mon, 6=Sun
            
            # Determine content type for this day based on pattern
            content_type = weekly_pattern.get(weekday)
            if not content_type:
                continue  # Skip days with no content scheduled
            
            # Generate contextual idea using AI
            idea = _generate_contextual_idea(
                content_type=content_type,
                date=day_date,
                blogger_context=blogger_context
            )
            
            task = models.ContentTask(
                blogger_id=blogger_id,
                date=day_str,
                content_type=content_type,
                idea=idea,
                status="PLANNED",
            )
            s.add(task)
            tasks_created += 1
        
        s.commit()
    
    return {"tasks_created": tasks_created}


def _build_weekly_pattern(content_frequency: Dict[str, int]) -> Dict[int, str]:
    """
    Build a weekly pattern from content_frequency.
    
    Example input: {reels: 3, post: 2, story: 1}
    Example output: {0: 'reels', 1: 'post', 2: 'reels', 3: 'post', 4: 'reels', 5: 'story'}
    
    Logic: Distribute content types evenly across the week
    """
    pattern = {}
    available_days = list(range(7))  # Mon-Sun
    
    # Sort by frequency (highest first) for better distribution
    sorted_types = sorted(content_frequency.items(), key=lambda x: x[1], reverse=True)
    
    for content_type, weekly_count in sorted_types:
        if weekly_count <= 0:
            continue
        
        # Calculate spacing between posts
        if weekly_count >= len(available_days):
            # If requesting more than 7/week, fill all available days
            days_to_use = available_days[:weekly_count]
        else:
            # Distribute evenly
            step = len(available_days) / weekly_count
            days_to_use = [available_days[int(i * step)] for i in range(weekly_count)]
        
        for day in days_to_use:
            if day not in pattern:  # Don't override already assigned days
                pattern[day] = content_type
        
        # Remove used days from available pool
        available_days = [d for d in available_days if d not in days_to_use]
    
    return pattern


def _generate_contextual_idea(
    content_type: str,
    date: date,
    blogger_context: Dict[str, str]
) -> str:
    """
    Generate AI-powered content idea with full context:
    - Blogger type (podcaster/fashion)
    - Theme and tone
    - Current season
    - Trends and occasions
    """
    
    # Determine season
    month = date.month
    if month in [12, 1, 2]:
        season = "зима"
    elif month in [3, 4, 5]:
        season = "весна"
    elif month in [6, 7, 8]:
        season = "лето"
    else:
        season = "осень"
    
    # Format date nicely
    date_str = date.strftime("%d.%m.%Y")
    
    blogger_type = blogger_context.get("type", "блогер")
    theme = blogger_context.get("theme", "общая тематика")
    tone = blogger_context.get("tone", "дружелюбный стиль")
    name = blogger_context.get("name", "блогер")
    
    prompt = f"""Придумай идею для контента блогера.

Тип блогера: {blogger_type}
Имя: {name}
Тематика: {theme}
Стиль общения: {tone}

Тип контента: {content_type}
Дата публикации: {date_str}
Сезон: {season}

Учитывай:
- Актуальные тренды в соцсетях
- Сезонность и погоду
- Праздники и инфоповоды (если есть рядом с этой датой)
- Специфику формата {content_type}

Напиши ТОЛЬКО краткую идею контента (1-2 предложения), без лишних пояснений."""

    try:
        idea = generate_text(prompt, max_tokens=150)
        return idea.strip()
    except Exception as e:
        # Fallback idea if AI fails
        return f"Идея для {content_type} на тему {theme}"
