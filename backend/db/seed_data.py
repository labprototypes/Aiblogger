from .connection import engine
from .models import Base, Blogger
from sqlalchemy.orm import Session


def init_db():
    Base.metadata.create_all(bind=engine)
    with Session(engine) as s:
        if not s.query(Blogger).first():
            demo = Blogger(name="Demo Blogger", type="podcaster")
            s.add(demo)
            s.commit()


if __name__ == "__main__":
    init_db()
    print("Database initialized")
