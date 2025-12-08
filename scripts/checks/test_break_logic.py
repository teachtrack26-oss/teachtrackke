from datetime import datetime, timedelta

# Mock data based on DB
term_data = {
    'term_number': 2,
    'year': 2025,
    'start_date': '2025-04-28',
    'end_date': '2025-08-01',
    'mid_term_break_start': '2025-06-25',
    'mid_term_break_end': '2025-06-29'
}

# Mock input data
data_term = "Term 2"
data_year = 2025
data_total_weeks = 14
data_lessons_per_week = 5

# Logic from backend/main.py

term_start_date = None
mid_term_start = None
mid_term_end = None

# 1. Parse Term Data
term_num_str = data_term.lower().replace("term", "").strip()
if term_num_str.isdigit():
    term_number = int(term_num_str)
    if term_number == term_data['term_number'] and data_year == term_data['year']:
        print(f"Found Term: {term_data}")
        term_start_date = datetime.strptime(term_data['start_date'], "%Y-%m-%d")
        mid_term_start = datetime.strptime(term_data['mid_term_break_start'], "%Y-%m-%d")
        mid_term_end = datetime.strptime(term_data['mid_term_break_end'], "%Y-%m-%d")

# 2. Simulate Week Loop
current_lesson_idx = 0
total_lessons_count = 100 # Mock

for week_num in range(1, data_total_weeks + 1):
    week_start = None
    if term_start_date:
        week_start = term_start_date + timedelta(weeks=week_num - 1)
        week_end = week_start + timedelta(days=6)
        print(f"Week {week_num}: {week_start.strftime('%Y-%m-%d')} to {week_end.strftime('%Y-%m-%d')}")

    # Check Full Week Break
    is_full_week_break = False
    if week_start and mid_term_start and mid_term_end:
        mon = week_start
        fri = week_start + timedelta(days=4)
        if mid_term_start <= mon and mid_term_end >= fri:
            is_full_week_break = True

    if is_full_week_break:
        print(f"  -> FULL WEEK BREAK")
        continue

    # Check Lessons
    for lesson_num in range(1, data_lessons_per_week + 1):
        is_break = False
        if week_start and mid_term_start and mid_term_end:
            day_offset = lesson_num - 1
            if day_offset > 6: day_offset = 6
            lesson_date = week_start + timedelta(days=day_offset)
            
            if mid_term_start <= lesson_date <= mid_term_end:
                is_break = True
        
        if is_break:
            print(f"  Lesson {lesson_num}: BREAK ({lesson_date.strftime('%Y-%m-%d')})")
        else:
            print(f"  Lesson {lesson_num}: Lesson Content (idx {current_lesson_idx})")
            current_lesson_idx += 1
