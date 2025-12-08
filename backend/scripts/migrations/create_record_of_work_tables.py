from database import engine, Base
from models import RecordOfWork, RecordOfWorkEntry

print("Dropping Record of Work tables...")
RecordOfWorkEntry.__table__.drop(engine, checkfirst=True)
RecordOfWork.__table__.drop(engine, checkfirst=True)

print("Creating Record of Work tables...")
Base.metadata.create_all(bind=engine)
print("Tables created successfully!")
