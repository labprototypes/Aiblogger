from sqlalchemy.orm import declarative_base
from sqlalchemy import Column, Integer, String, Text, Date, JSON, ForeignKey
from sqlalchemy.orm import relationship

Base = declarative_base()


class Blogger(Base):
    __tablename__ = "bloggers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)
    image = Column(String(1024))
    tone_of_voice = Column(Text)
    theme = Column(Text)
    voice_id = Column(String(255))
    content_schedule = Column(JSON)
    content_types = Column(JSON)

    tasks = relationship("ContentTask", back_populates="blogger")


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

    blogger = relationship("Blogger", back_populates="tasks")
