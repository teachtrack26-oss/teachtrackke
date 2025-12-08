import sys
import os
from database import engine, Base
from models import *  # Import all models to ensure they are registered

def reset_database():
    print("⚠️  WARNING: This will DELETE ALL DATA in the database.")
    print("   Target Database:", engine.url)
    
    if len(sys.argv) > 1 and sys.argv[1] == "--force":
        print("Force flag detected. Proceeding without prompt.")
    else:
        confirm = input("Are you sure you want to proceed? (type 'yes' to confirm): ")
        if confirm != "yes":
            print("❌ Operation cancelled.")
            return

    print("\n🗑️  Dropping all tables...")
    try:
        Base.metadata.drop_all(bind=engine)
        print("✅ All tables dropped.")
    except Exception as e:
        print(f"❌ Error dropping tables: {e}")
        return

    print("\n🏗️  Creating new tables...")
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ New tables created successfully!")
        print("\n🚀 Database reset complete. You can now restart the server.")
    except Exception as e:
        print(f"❌ Error creating tables: {e}")

if __name__ == "__main__":
    reset_database()
