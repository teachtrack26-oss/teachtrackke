from database import engine
from sqlalchemy import text

conn = engine.connect()
result = conn.execute(text(
    "SELECT substrand_name, specific_learning_outcomes IS NULL as is_null "
    "FROM sub_strands LIMIT 3"
))

print('Sub-strands check:')
for row in result:
    print(f'{row[0]}: specific_learning_outcomes is NULL = {bool(row[1])}')

conn.close()
