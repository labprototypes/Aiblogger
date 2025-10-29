from sqlalchemy.orm import declarative_base
from sqlalchemy import Column, Integer, String, Text, Date, JSON, ForeignKey
from sqlalchemy.orm import relationship

Base = declarative_base()


class Blogger(Base):
    __tablename__ = "bloggers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)  # "podcaster" or "fashion"
    image = Column(String(1024))  # Main frontal photo URL
    tone_of_voice = Column(Text)
    theme = Column(Text)
    voice_id = Column(String(255))
    
    # New fields
    locations = Column(JSON)  # [{title: "...", description: "...", thumbnail: "..."}]
    outfits = Column(JSON)  # [{name: "...", image_url: "...", parts: {top: "url", bottom: "url", ...}}]
    editing_types_enabled = Column(JSON)  # ["overlay", "rotoscope", "static"] - available options
    subtitles_enabled = Column(Integer, default=0)  # 0 or 1 (boolean)
    
    # Legacy fields (deprecated but kept for compatibility)
    content_schedule = Column(JSON)
    content_types = Column(JSON)

    tasks = relationship("ContentTask", back_populates="blogger", cascade="all, delete-orphan")


class ContentTask(Base):
    __tablename__ = "content_tasks"

    id = Column(Integer, primary_key=True, index=True)
    blogger_id = Column(Integer, ForeignKey("bloggers.id"), nullable=False)
    date = Column(String(10), nullable=False)  # YYYY-MM-DD for simplicity
    content_type = Column(String(50), nullable=False)
    idea = Column(Text)
    status = Column(String(50), default="DRAFT")
    script = Column(Text)
    preview_url = Column(String(1024))
    editing_type = Column(String(50))  # Selected editing type for this specific task
    
    # Fashion post generation fields
    location_id = Column(Integer)  # Index of location from blogger.locations array
    location_description = Column(Text)  # Custom location description if not using pre-loaded
    outfit = Column(JSON)  # {"top": "url", "bottom": "url", "shoes": "url", "socks": "url", "accessories": "url"} or text descriptions
    main_image_url = Column(String(1024))  # Confirmed main frame URL
    prompts = Column(JSON)  # {"main": "...", "angle1": "...", "angle2": "...", "angle3": "..."}
    generated_images = Column(JSON)  # {"main": ["url1", "url2"], "angle1": ["url1"], ...} - history of generations

    blogger = relationship("Blogger", back_populates="tasks")


class TaskMeta(Base):
    __tablename__ = "task_meta"

    id = Column(Integer, primary_key=True)
    task_id = Column(Integer, ForeignKey("content_tasks.id"), nullable=False, index=True)
    # style/outfit/location/weather or other recommendations
    data = Column(JSON)


class TaskVersion(Base):
    __tablename__ = "task_versions"

    id = Column(Integer, primary_key=True)
    task_id = Column(Integer, ForeignKey("content_tasks.id"), nullable=False, index=True)
    kind = Column(String(50), default="script")
    content = Column(Text)
