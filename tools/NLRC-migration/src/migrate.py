import requests
# r = requests.get('http://localhost:3000/api/health/health')
import psycopg2
import psycopg2.extras
import psycopg
import os
from dotenv import load_dotenv

load_dotenv()
excludedTables = [
    'belcash_request',
    'custom_migration_table',
    'fsp',
    'fsp_attribute',
    'instance',
    'permission',
    'program_aidworker_assignment',
    'program_aidworker_assignment_roles_user_role',
    'user_role',
    'user_role_permissions_permission',
    # imagecode_export_vouchers #only excluded for testing
    #'imagecode_export_vouchers',
  ]

def connect(credentialDB, useDict):
  # conn.autocommit = True
  if useDict:
    conn = psycopg2.connect(user=credentialDB['user'],
                            password=credentialDB['password'],
                            host=credentialDB['host'],
                            port=credentialDB['port'],
                            database=credentialDB['database'],
                            )
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
  else:
    conn = psycopg.connect(user=credentialDB['user'],
                            password=credentialDB['password'],
                            host=credentialDB['host'],
                           port=credentialDB['port'],
                           dbname=credentialDB['database'],
                            )
    cursor = conn.cursor()
  # Executing a SQL query
  cursor.execute('''set search_path to "121-service";''')
  cursor.execute("SELECT version();")
  # Fetch result

  record = cursor.fetchone()
  print("You are connected to, ", record, '\n HOST:', credentialDB['host'])
  return cursor, conn

def getForeignKeyConstrains(cursor):
  cursor.execute("""SELECT
    tc.table_schema,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
    FROM
        information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY';""")
  return cursor.fetchall()


def recreateSchemaOnCascade(fkey, cursor, conn):
  sqlConstraint = f"""
    ALTER TABLE "{fkey['table_name']}"
    DROP CONSTRAINT "{fkey['constraint_name']}",
    ADD CONSTRAINT "{fkey['constraint_name']}"
      FOREIGN KEY ("{fkey['column_name']}")
      REFERENCES "{fkey['foreign_table_name']}"("id")
      ON UPDATE CASCADE
      DEFERRABLE INITIALLY DEFERRED;
  """
  cursor.execute(sqlConstraint)
  conn.commit()




def getTableNames(cursor):
    cursor.execute("""
      SELECT table_name FROM information_schema.tables WHERE table_schema='121-service'
    """)
    return cursor.fetchall()

def tableIdPlusMillion(table, cursor, conn):
  cursor.execute(f"""
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name='{table['table_name']}' and column_name='id';
  """)
  result = cursor.fetchone()
  if result is not None and table['table_name'] not in excludedTables:
    if table['table_name'] == 'program':
      idIncrease = 1
    else:
      idIncrease = 10000000
    sqlUpdateId = f"""
        UPDATE "{table['table_name']}" SET id = id + {idIncrease};
      """
    cursor.execute(sqlUpdateId)
    conn.commit()

def migrateData(cursorOrigin, cursorDestination, connDestination):
    tablesNames = getTableNames(cursorOrigin)
    # https://www.psycopg.org/psycopg3/docs/basic/copy.html
    for tableNameObj in tablesNames:
      tableName = tableNameObj[0]
      print("Copy data table: ", tableName)
      if tableName not in excludedTables:
        with cursorOrigin.copy(f"""COPY "{tableName}" TO STDOUT (FORMAT BINARY)""") as copy1:
          cursorDestination.execute(f"""ALTER TABLE "{tableName}" DISABLE TRIGGER ALL;""")
          with cursorDestination.copy(f"""COPY "{tableName}" FROM STDIN (FORMAT BINARY)""") as copy2:
              for data in copy1:
                  copy2.write(data)
          cursorDestination.execute(
              f"""ALTER TABLE "{tableName}" ENABLE TRIGGER ALL;""")
    connDestination.commit()

def changeUserNames(cursor, conn):
  # It was confirmed that all users from PV can be reused in LVV
  cursor.execute(
      f"""UPDATE "user" SET username = 'MIGRATED_PV_' || username""")
  cursor.execute(
      f"""UPDATE "user" SET password = 'MIGRATED_PV_' || password""")
  conn.commit()

def prepareOrigin(cursor, conn):
  changeUserNames(cursor, conn)
  foreignKeys = getForeignKeyConstrains(cursor)
  for fkey in foreignKeys:
    recreateSchemaOnCascade(fkey, cursor, conn)

  tables = getTableNames(cursor)
  for table in tables:
    tableIdPlusMillion(table, cursor, conn)
    print("Updating table IDs in table:, ", table)


def getCookies():
  baseurl = os.getenv('URL_DESTINATION')
  s = requests.Session()
  body = {
      "username": "admin@example.org",
      "password": os.getenv('ADMIN_PASSWORD_DESTINATION')
  }
  loginUrl = f"""{baseurl}api/user/login"""
  print('loginUrl: ', loginUrl)
  r = s.post(loginUrl, body)
  print('Login result: ', r)
  return s


def setAdminUserProgram2(cursorDestination, connDestination):
  cursorDestination.execute("""
    INSERT INTO program_aidworker_assignment("userId", "programId")
    VALUES((SELECT id FROM "user" WHERE username = 'admin@example.org') , 2);


  INSERT INTO program_aidworker_assignment_roles_user_role("programAidworkerAssignmentId", "userRoleId")
  VALUES((SELECT max(id) FROM program_aidworker_assignment), (SELECT id FROM user_role WHERE "role" = 'program-admin'));
  """)
  connDestination.commit()


def assignUserToProgram2(cursorDestination, connDestination):
  # Checks for the roles each user has for program 1 and assigns them to program 2

  setAdminUserProgram2(cursorDestination, connDestination)
  session = getCookies()
  baseurl = os.getenv('URL_DESTINATION')
  response = session.get(f"""{baseurl}api/programs/1""")
  data = response.json()
  for assignment in data['aidworkerAssignments']:
    roles = []
    for r in assignment['roles']:
      roles.append(r['role'])
    body = {'roles': roles}
    postRoleUrl = f"""{baseurl}api/programs/2/users/{assignment['user']['id']}/assignments"""
    postRoleResult = session.post(postRoleUrl, json=body)
    print('postRoleResult: ', postRoleResult.text)

if __name__ == "__main__":
  crendentialDbOrigin = {
      'user': os.getenv('USERNAME'),
      'host': os.getenv('HOST_ORIGIN'),
      'port': os.getenv('PORT_ORIGIN'),
      'password': os.getenv('PASSWORD_ORIGIN'),
      'database': os.getenv('DATABASE')
  }
  dictCursorOrigin, dictConnOrigin = connect(crendentialDbOrigin, True)

  prepareOrigin(dictCursorOrigin, dictConnOrigin)
  dictConnOrigin.close()

  cursorOrigin, connOrigin = connect(crendentialDbOrigin, False)

  crendentialDbDestination = {
      'user': os.getenv('USERNAME'),
      'host': os.getenv('HOST_DESTINATION'),
      'port': os.getenv('PORT_DESTINATION'),
      'password': os.getenv('PASSWORD_DESTINATION'),
      'database': os.getenv('DATABASE')
  }
  cursorDestination, connDestination = connect(crendentialDbDestination, False)

  migrateData(cursorOrigin, cursorDestination, connDestination)

  assignUserToProgram2(cursorDestination, connDestination)


