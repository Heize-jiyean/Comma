import mysql.connector
from mysql.connector import Error

def create_connection(host_name, user_name, user_password, db_name):
    connection = None
    try:
        connection = mysql.connector.connect(
            host=host_name,
            user=user_name,
            passwd=user_password,
            database=db_name
        )
        print("MySQL 데이터베이스에 성공적으로 연결되었습니다")
    except Error as e:
        print(f"Error: '{e}'")
    return connection

def insert_data(connection, pid, aid, sim):
    insert_query = """
    INSERT INTO similarity_like (patient_id, article_id, similarity) VALUES (%s, %s, %s)
    """
    try:
        cursor = connection.cursor()
        cursor.execute(insert_query, (pid, aid, sim))
        connection.commit()
    except Error as e:
        print(f"Error: '{e}'")
        
def delete_data(connection, pid):
    delete_query = "DELETE FROM similarity_like WHERE patient_id = %s"
    try:
        cursor = connection.cursor()
        cursor.execute(delete_query, (pid, ))
        connection.commit()
    except Error as e:
        print(f"Error: '{e}'")