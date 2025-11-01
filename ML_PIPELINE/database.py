# database.py
import sqlite3
from sqlite3 import Connection
from typing import Optional

DB_FILE = "menomap.db"

def get_db_connection() -> Connection:
    conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS user_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            age INTEGER,
            symptoms TEXT,
            preferences TEXT,
            mood TEXT,
            extra_json TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    conn.commit()
    conn.close()

def insert_user_data(user_id: str, age: Optional[int], symptoms: str,
                     preferences: str, mood: Optional[str], extra_json: Optional[str] = None):
    conn = get_db_connection()
    conn.execute(
        "INSERT INTO user_data (user_id, age, symptoms, preferences, mood, extra_json) VALUES (?, ?, ?, ?, ?, ?)",
        (user_id, age, symptoms, preferences, mood, extra_json),
    )
    conn.commit()
    conn.close()

def get_latest_user_record(user_id: str):
    conn = get_db_connection()
    row = conn.execute(
        "SELECT * FROM user_data WHERE user_id = ? ORDER BY timestamp DESC LIMIT 1",
        (user_id,),
    ).fetchone()
    conn.close()
    return row