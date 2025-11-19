#!/usr/bin/env python3
"""
Test script for Schemes of Work API endpoints
"""

import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
TEST_EMAIL = "teacher@school.com"
TEST_PASSWORD = "password123"

def print_section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print('='*60)

def print_response(response):
    print(f"Status: {response.status_code}")
    try:
        data = response.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        return data
    except:
        print(f"Response: {response.text}")
        return None

def test_schemes_api():
    """Test all schemes of work endpoints"""
    
    print_section("1. Login to get access token")
    
    # Login
    login_data = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    
    response = requests.post(f"{BASE_URL}/login", json=login_data)
    
    if response.status_code != 200:
        print("❌ Login failed. Please check credentials or create a test user.")
        print_response(response)
        return
    
    data = response.json()
    token = data.get("access_token")
    print(f"✅ Login successful!")
    print(f"Token: {token[:50]}...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Get user's subjects
    print_section("2. Get User Subjects")
    response = requests.get(f"{BASE_URL}/subjects", headers=headers)
    subjects_data = print_response(response)
    
    if not subjects_data or len(subjects_data) == 0:
        print("❌ No subjects found. Please add subjects first.")
        return
    
    subject = subjects_data[0]
    print(f"✅ Using subject: {subject['subject_name']} (ID: {subject['id']})")
    
    # Create a test scheme of work
    print_section("3. Create Scheme of Work")
    
    scheme_data = {
        "subject_id": subject['id'],
        "teacher_name": "John Doe",
        "school": "Test Academy",
        "term": "Term 1",
        "year": 2025,
        "subject": subject['subject_name'],
        "grade": subject['grade'],
        "total_weeks": 2,
        "total_lessons": 8,
        "status": "draft",
        "weeks": [
            {
                "week_number": 1,
                "lessons": [
                    {
                        "lesson_number": 1,
                        "strand": "Numbers",
                        "sub_strand": "Whole Numbers",
                        "specific_learning_outcomes": "By the end of the lesson, the learner should be able to:\na. Identify whole numbers up to 10 million\nb. Read and write whole numbers\nc. Apply whole numbers in real life",
                        "key_inquiry_questions": "What are whole numbers?\nHow do we use numbers in daily life?",
                        "learning_experiences": "The learner is guided to:\n● Count objects in groups\n● Write numbers in words\n● Identify place values",
                        "learning_resources": "Number charts, counters, textbooks, digital devices",
                        "assessment_methods": "Written questions, Oral questions, Observation",
                        "reflection": ""
                    },
                    {
                        "lesson_number": 2,
                        "strand": "Numbers",
                        "sub_strand": "Whole Numbers",
                        "specific_learning_outcomes": "By the end of the lesson, the learner should be able to:\na. Compare whole numbers\nb. Order whole numbers\nc. Use place value",
                        "key_inquiry_questions": "How do we compare numbers?\nWhat is place value?",
                        "learning_experiences": "The learner is guided to:\n● Use comparison symbols\n● Arrange numbers in ascending/descending order\n● Identify place values",
                        "learning_resources": "Place value charts, number lines, counters",
                        "assessment_methods": "Practical work, Written exercises",
                        "reflection": ""
                    }
                ]
            },
            {
                "week_number": 2,
                "lessons": [
                    {
                        "lesson_number": 1,
                        "strand": "Numbers",
                        "sub_strand": "Addition and Subtraction",
                        "specific_learning_outcomes": "By the end of the lesson, the learner should be able to:\na. Add whole numbers\nb. Solve addition problems\nc. Apply addition in real situations",
                        "key_inquiry_questions": "How do we add numbers?\nWhen do we use addition?",
                        "learning_experiences": "The learner is guided to:\n● Add numbers with regrouping\n● Solve word problems\n● Use mental math strategies",
                        "learning_resources": "Textbooks, calculators, real objects",
                        "assessment_methods": "Written tests, Oral questions",
                        "reflection": ""
                    }
                ]
            }
        ]
    }
    
    response = requests.post(f"{BASE_URL}/schemes", json=scheme_data, headers=headers)
    created_scheme = print_response(response)
    
    if response.status_code != 200:
        print("❌ Failed to create scheme")
        return
    
    scheme_id = created_scheme['id']
    print(f"✅ Scheme created with ID: {scheme_id}")
    
    # Get all schemes
    print_section("4. Get All Schemes")
    response = requests.get(f"{BASE_URL}/schemes", headers=headers)
    schemes = print_response(response)
    print(f"✅ Found {len(schemes)} scheme(s)")
    
    # Get specific scheme with full details
    print_section("5. Get Specific Scheme")
    response = requests.get(f"{BASE_URL}/schemes/{scheme_id}", headers=headers)
    scheme_details = print_response(response)
    print(f"✅ Retrieved scheme with {len(scheme_details['weeks'])} weeks")
    
    # Get statistics
    print_section("6. Get Schemes Statistics")
    response = requests.get(f"{BASE_URL}/schemes/stats", headers=headers)
    stats = print_response(response)
    print(f"✅ Statistics retrieved")
    
    # Update scheme status
    print_section("7. Update Scheme Status")
    update_data = {
        "status": "active"
    }
    response = requests.put(f"{BASE_URL}/schemes/{scheme_id}", json=update_data, headers=headers)
    updated_scheme = print_response(response)
    print(f"✅ Scheme status updated to: {updated_scheme['status']}")
    
    # Update a specific lesson
    print_section("8. Update Specific Lesson")
    lesson_id = scheme_details['weeks'][0]['lessons'][0]['id']
    
    lesson_update = {
        "lesson_number": 1,
        "strand": "Numbers",
        "sub_strand": "Whole Numbers",
        "specific_learning_outcomes": "By the end of the lesson, the learner should be able to:\na. Identify whole numbers up to 10 million\nb. Read and write whole numbers\nc. Apply whole numbers in real life\nd. Compare and order numbers",
        "key_inquiry_questions": "What are whole numbers?\nHow do we use numbers in daily life?\nHow do we compare numbers?",
        "learning_experiences": "The learner is guided to:\n● Count objects in groups\n● Write numbers in words\n● Identify place values\n● Compare numbers using symbols",
        "learning_resources": "Number charts, counters, textbooks, digital devices, place value charts",
        "assessment_methods": "Written questions, Oral questions, Observation, Practical work",
        "reflection": "Lesson went well. Students were engaged and understood the concepts."
    }
    
    response = requests.put(
        f"{BASE_URL}/schemes/{scheme_id}/lessons/{lesson_id}",
        json=lesson_update,
        headers=headers
    )
    updated_lesson = print_response(response)
    print(f"✅ Lesson updated with reflection")
    
    # Filter schemes by subject
    print_section("9. Filter Schemes by Subject")
    response = requests.get(
        f"{BASE_URL}/schemes?subject_id={subject['id']}",
        headers=headers
    )
    filtered_schemes = print_response(response)
    print(f"✅ Found {len(filtered_schemes)} scheme(s) for subject")
    
    # Filter by status
    print_section("10. Filter Schemes by Status")
    response = requests.get(
        f"{BASE_URL}/schemes?status=active",
        headers=headers
    )
    active_schemes = print_response(response)
    print(f"✅ Found {len(active_schemes)} active scheme(s)")
    
    # Delete scheme
    print_section("11. Delete Scheme")
    confirm = input("\nDo you want to delete the test scheme? (yes/no): ")
    
    if confirm.lower() == 'yes':
        response = requests.delete(f"{BASE_URL}/schemes/{scheme_id}", headers=headers)
        print_response(response)
        print(f"✅ Scheme deleted")
    else:
        print(f"⏭️  Skipped deletion. Scheme ID {scheme_id} still exists.")
    
    print_section("✅ All Tests Complete!")

if __name__ == "__main__":
    print("="*60)
    print("  Schemes of Work API Test Script")
    print("="*60)
    print("\nThis script will test all schemes of work endpoints.")
    print(f"Backend URL: {BASE_URL}")
    print(f"Test User: {TEST_EMAIL}")
    
    try:
        test_schemes_api()
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Cannot connect to backend server.")
        print("Please ensure the backend is running on http://localhost:8000")
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
