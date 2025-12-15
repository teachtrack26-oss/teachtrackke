
import os

print(f"CWD: {os.getcwd()}")
file_path = os.path.abspath("frontend/app/professional-records/lesson-plans/print/page.tsx")
print(f"Target: {file_path}")
if os.path.exists(file_path):
    print("File exists before write")
else:
    print("File does NOT exist before write")

try:
    with open(file_path, "w", encoding="utf-8") as f:
        f.write("TEST_CONTENT")
    print("Write successful")
except Exception as e:
    print(f"Write failed: {e}")

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()
    print(f"Content after write: {content}")
