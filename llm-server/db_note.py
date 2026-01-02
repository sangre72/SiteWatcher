import os
import mysql.connector
from mysql.connector import Error
from langchain_core.tools import StructuredTool

def note_to_mysql(note: str) -> str:
    """MySQL 데이터베이스에 노트 저장."""
    try:

        #host: 'localhost',
        #user: 'dbuser',
        #password: 'dbuser',
        #database: 'egov'
        # MySQL 데이터베이스 연결 설정
        connection = mysql.connector.connect(
            host='localhost',  # 데이터베이스 호스트
            user='dbuser',   # 데이터베이스 사용자 이름
            password='dbuser',  # 데이터베이스 패스워드
            database='egov'    # 데이터베이스 이름
        )

        if connection.is_connected():
            db_info = connection.get_server_info()
            print("MySQL server version:", db_info)
            cursor = connection.cursor()

            # 노트 저장 쿼리
            query = "INSERT INTO tb_jsonl (jsonl) VALUES (%s)"
            cursor.execute(query, (note,))

            # 변경 사항 커밋
            connection.commit()
            print("Note saved to MySQL database.")

            return "Note saved successfully."

    except Error as e:
        print("Error while connecting to MySQL", e)
        return "Failed to save note."

    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()
            print("MySQL connection is closed.")

# FunctionTool 생성
db_note_engine = StructuredTool.from_function(
    func=note_to_mysql,
    name="MySQL Note Saver",
    description="Insert a note to the egov.tb_jsonl table in MySQL"
)
