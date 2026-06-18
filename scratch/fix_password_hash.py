import sqlite3
from werkzeug.security import generate_password_hash

DEMO_PASSWORDS = {
    "k.singh@secnet.ai": "admin123",
    "a.rahman@secnet.ai": "analyst123",
    "s.ivanova@secnet.ai": "engineer123",
    "p.nair@secnet.ai": "auditor123",
}

db_path = "backend/instance/securenet_ai.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    for email, pwd in DEMO_PASSWORDS.items():
        cursor.execute("SELECT id, password_hash FROM users WHERE email=?", (email,))
        row = cursor.fetchone()
        if row:
            user_id, current_hash = row
            if not current_hash:
                p_hash = generate_password_hash(pwd)
                cursor.execute("UPDATE users SET password_hash=? WHERE id=?", (p_hash, user_id))
                print(f"Updated password hash for {email}")
            else:
                print(f"Password hash already exists for {email}")
        else:
            print(f"User {email} not found in database")
            
    conn.commit()
    print("Database update committed successfully.")
except Exception as e:
    print("Error updating database:", e)
finally:
    conn.close()
