import sqlite3
from tabulate import tabulate

def view_table(conn, table_name):
    cursor = conn.cursor()
    cursor.execute(f"SELECT * FROM {table_name}")
    rows = cursor.fetchall()
    
    # Get column names
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = [col[1] for col in cursor.fetchall()]
    
    print(f"\n=== {table_name.upper()} TABLE ===")
    if rows:
        print(tabulate(rows, headers=columns, tablefmt="grid"))
    else:
        print("No records found")
    print("\n")

def main():
    try:
        conn = sqlite3.connect('attendance.db')
        tables = ['students', 'faculty', 'section_mapping', 'attendance']
        
        for table in tables:
            view_table(conn, table)
            
    except sqlite3.Error as e:
        print(f"Database error: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    main() 