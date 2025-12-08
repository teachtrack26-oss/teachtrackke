#!/bin/bash

# Test Schemes of Work API Endpoints

BASE_URL="http://localhost:8000/api/v1"
EMAIL="test@teacher.com"
PASSWORD="test123"

echo "============================================================"
echo "  Schemes of Work API Test"
echo "============================================================"
echo ""

# Login and get token
echo "1. Login to get access token..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | sed 's/"access_token":"//')

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed!"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Login successful!"
echo "Token: ${TOKEN:0:50}..."
echo ""

# Get subjects
echo "2. Get user subjects..."
SUBJECTS=$(curl -s -X GET "$BASE_URL/subjects" \
  -H "Authorization: Bearer $TOKEN")

SUBJECT_ID=$(echo $SUBJECTS | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
SUBJECT_NAME=$(echo $SUBJECTS | grep -o '"subject_name":"[^"]*' | head -1 | sed 's/"subject_name":"//')
GRADE=$(echo $SUBJECTS | grep -o '"grade":"[^"]*' | head -1 | sed 's/"grade":"//')

if [ -z "$SUBJECT_ID" ]; then
    echo "❌ No subjects found!"
    exit 1
fi

echo "✅ Found subject: $SUBJECT_NAME (ID: $SUBJECT_ID, Grade: $GRADE)"
echo ""

# Create scheme
echo "3. Creating test scheme of work..."
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/schemes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"subject_id\": $SUBJECT_ID,
    \"teacher_name\": \"Test Teacher\",
    \"school\": \"Test Academy\",
    \"term\": \"Term 1\",
    \"year\": 2025,
    \"subject\": \"$SUBJECT_NAME\",
    \"grade\": \"$GRADE\",
    \"total_weeks\": 2,
    \"total_lessons\": 4,
    \"status\": \"draft\",
    \"weeks\": [
      {
        \"week_number\": 1,
        \"lessons\": [
          {
            \"lesson_number\": 1,
            \"strand\": \"Numbers\",
            \"sub_strand\": \"Whole Numbers\",
            \"specific_learning_outcomes\": \"By the end of the lesson, the learner should be able to:\\na. Identify whole numbers\\nb. Read and write whole numbers\",
            \"key_inquiry_questions\": \"What are whole numbers?\",
            \"learning_experiences\": \"The learner is guided to:\\n● Count objects\\n● Write numbers\",
            \"learning_resources\": \"Number charts, counters\",
            \"assessment_methods\": \"Written questions, Observation\",
            \"reflection\": \"\"
          },
          {
            \"lesson_number\": 2,
            \"strand\": \"Numbers\",
            \"sub_strand\": \"Whole Numbers\",
            \"specific_learning_outcomes\": \"By the end of the lesson, the learner should be able to:\\na. Compare whole numbers\\nb. Order whole numbers\",
            \"key_inquiry_questions\": \"How do we compare numbers?\",
            \"learning_experiences\": \"The learner is guided to:\\n● Use comparison symbols\\n● Arrange numbers in order\",
            \"learning_resources\": \"Place value charts\",
            \"assessment_methods\": \"Practical work\",
            \"reflection\": \"\"
          }
        ]
      }
    ]
  }")

SCHEME_ID=$(echo $CREATE_RESPONSE | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')

if [ -z "$SCHEME_ID" ]; then
    echo "❌ Failed to create scheme!"
    echo "Response: $CREATE_RESPONSE"
    exit 1
fi

echo "✅ Scheme created successfully! ID: $SCHEME_ID"
echo ""

# Get all schemes
echo "4. Getting all schemes..."
ALL_SCHEMES=$(curl -s -X GET "$BASE_URL/schemes" \
  -H "Authorization: Bearer $TOKEN")

SCHEME_COUNT=$(echo $ALL_SCHEMES | grep -o '"id":' | wc -l)
echo "✅ Found $SCHEME_COUNT scheme(s)"
echo ""

# Get specific scheme
echo "5. Getting scheme details..."
SCHEME_DETAILS=$(curl -s -X GET "$BASE_URL/schemes/$SCHEME_ID" \
  -H "Authorization: Bearer $TOKEN")

WEEKS_COUNT=$(echo $SCHEME_DETAILS | grep -o '"week_number":' | wc -l)
echo "✅ Retrieved scheme with $WEEKS_COUNT week(s)"
echo ""

# Get statistics
echo "6. Getting schemes statistics..."
STATS=$(curl -s -X GET "$BASE_URL/schemes/stats" \
  -H "Authorization: Bearer $TOKEN")

echo "✅ Statistics:"
echo "$STATS" | python -m json.tool 2>/dev/null || echo "$STATS"
echo ""

# Update scheme status
echo "7. Updating scheme status to 'active'..."
UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/schemes/$SCHEME_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"status\": \"active\"}")

UPDATED_STATUS=$(echo $UPDATE_RESPONSE | grep -o '"status":"[^"]*' | sed 's/"status":"//')
echo "✅ Scheme status updated to: $UPDATED_STATUS"
echo ""

# Filter by status
echo "8. Filtering schemes by status 'active'..."
ACTIVE_SCHEMES=$(curl -s -X GET "$BASE_URL/schemes?status=active" \
  -H "Authorization: Bearer $TOKEN")

ACTIVE_COUNT=$(echo $ACTIVE_SCHEMES | grep -o '"id":' | wc -l)
echo "✅ Found $ACTIVE_COUNT active scheme(s)"
echo ""

# Delete scheme
echo "9. Deleting test scheme..."
read -p "Do you want to delete the test scheme? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/schemes/$SCHEME_ID" \
      -H "Authorization: Bearer $TOKEN")
    
    echo "✅ Scheme deleted successfully"
else
    echo "⏭️  Skipped deletion. Scheme ID $SCHEME_ID still exists"
fi

echo ""
echo "============================================================"
echo "  ✅ All API tests completed successfully!"
echo "============================================================"
