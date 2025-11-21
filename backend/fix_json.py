
import os

file_path = r"c:\Users\MKT\desktop\teachtrack\G7\grade-7-mathematics.json"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Lines are 0-indexed in Python list
# Line 639 in file is index 638
# Line 833 in file is index 832

# We want to keep lines 1-638 (indices 0-637)
# And lines 834-end (indices 833-end)

# Verify content before deleting
print(f"Line 639 (should be {{): {lines[638]}")
print(f"Line 640 (should be strand 4.0): {lines[639]}")
print(f"Line 833 (should be }}): {lines[832]}")
print(f"Line 834 (should be {{): {lines[833]}")

# Construct new content
new_lines = lines[:638] + lines[833:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("File fixed.")
