import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os
import sys
import environ

def setup_database():
    env = environ.Env()
    base_dir = os.path.dirname(os.path.abspath(__file__))
    environ.Env.read_env(os.path.join(base_dir, '.env'))

    db_name = env('DB_NAME', default='mou_dashboard')
    db_user = env('DB_USER', default='postgres')
    db_password = env('DB_PASSWORD', default='password')
    db_host = env('DB_HOST', default='localhost')
    db_port = env('DB_PORT', default='5432')

    print("Attempting to connect to PostgreSQL...")
    try:
        # Connect to template1 or postgres database to create the database
        conn = psycopg2.connect(
            dbname="postgres",
            user=db_user,
            password=db_password,
            host=db_host,
            port=db_port,
            connect_timeout=3
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()

        # Check if database exists
        cursor.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{db_name}';")
        exists = cursor.fetchone()

        if not exists:
            print(f"Database '{db_name}' does not exist. Creating...")
            cursor.execute(f"CREATE DATABASE {db_name};")
            print(f"Database '{db_name}' created successfully.")
        else:
            print(f"Database '{db_name}' already exists.")

        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print("\n" + "="*60)
        print("WARNING: PostgreSQL connection failed.")
        print(f"Error details: {e}")
        print("Falling back to SQLite database for local development.")
        print("="*60 + "\n")
        return False

if __name__ == "__main__":
    setup_database()
