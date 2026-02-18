#!/bin/bash
# Test all APIs with curl. Requires dev server running (npm run dev) and DB seeded (npm run db:seed).
set -e
BASE="${BASE_URL:-http://localhost:3004}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@demo.com}"
ADMIN_PASS="${ADMIN_PASS:-admin123}"

echo "=== Base URL: $BASE ==="
echo ""

# 1) Login as admin and get user id
echo "1. POST /api/auth/login (admin)"
LOGIN=$(curl -s -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}")
if echo "$LOGIN" | grep -q '"success":true'; then
  echo "   OK"
  USER_ID=$(echo "$LOGIN" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "   userId=$USER_ID"
else
  echo "   FAIL: $LOGIN"
  exit 1
fi
echo ""

# 2) Auth me
echo "2. GET /api/auth/me?userId=$USER_ID"
ME=$(curl -s "$BASE/api/auth/me?userId=$USER_ID")
echo "$ME" | grep -q '"success":true' && echo "   OK" || echo "   FAIL: $ME"
echo ""

# 3) Employees list
echo "3. GET /api/employees"
curl -s "$BASE/api/employees" | grep -q '"success":true' && echo "   OK" || echo "   FAIL"
echo ""

# 4) Customers list
echo "4. GET /api/customers"
curl -s "$BASE/api/customers" | grep -q '"success":true' && echo "   OK" || echo "   FAIL"
echo ""

# 5) Loans list
echo "5. GET /api/loans"
curl -s "$BASE/api/loans" | grep -q '"success":true' && echo "   OK" || echo "   FAIL"
echo ""

# 6) Chat list
echo "6. GET /api/chat?userId=$USER_ID"
curl -s "$BASE/api/chat?userId=$USER_ID" | grep -q '"success":true' && echo "   OK" || echo "   FAIL"
echo ""

# 7) Notifications
echo "7. GET /api/notifications?userId=$USER_ID"
curl -s "$BASE/api/notifications?userId=$USER_ID" | grep -q '"success":true' && echo "   OK" || echo "   FAIL"
echo ""

# 8) Create employee (admin)
echo "8. POST /api/employees (create employee)"
CREATE_EMP=$(curl -s -X POST "$BASE/api/employees" -H "Content-Type: application/json" -d '{"name":"Test Employee","email":"testemp@demo.com","password":"test1234"}')
if echo "$CREATE_EMP" | grep -q '"success":true'; then
  echo "   OK"
  EMP_ID=$(echo "$CREATE_EMP" | grep -o '"id":"employee-[^"]*"' | head -1 | cut -d'"' -f4)
else
  echo "   (may fail if testemp@demo.com exists): $CREATE_EMP"
fi
echo ""

# 9) Create customer (admin)
echo "9. POST /api/customers (create customer)"
CREATE_CUST=$(curl -s -X POST "$BASE/api/customers" -H "Content-Type: application/json" -d '{"name":"Test Customer","email":"testcust@demo.com","password":"test1234"}')
if echo "$CREATE_CUST" | grep -q '"success":true'; then
  echo "   OK"
else
  echo "   (may fail if email exists): $CREATE_CUST"
fi
echo ""

# 10) Create room (admin)
echo "10. POST /api/chat/create-room"
ROOM=$(curl -s -X POST "$BASE/api/chat/create-room" -H "Content-Type: application/json" -d "{\"roomName\":\"Test Room\",\"employeeIds\":[\"employee-1\"],\"adminId\":\"$USER_ID\"}")
echo "$ROOM" | grep -q '"success":true' && echo "   OK" || echo "   FAIL: $ROOM"
echo ""

# 11) Signup (public)
echo "11. POST /api/auth/signup"
SIGNUP=$(curl -s -X POST "$BASE/api/auth/signup" -H "Content-Type: application/json" -d '{"name":"Signup Test","email":"signuptest@demo.com","password":"test1234"}')
if echo "$SIGNUP" | grep -q '"success":true'; then
  echo "   OK"
else
  echo "   (may fail if email exists): $SIGNUP"
fi
echo ""

# 12) Login (invalid)
echo "12. POST /api/auth/login (invalid credentials)"
INVALID=$(curl -s -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" -d '{"email":"wrong@x.com","password":"wrong"}')
echo "$INVALID" | grep -q '"success":false' && echo "   OK (correctly rejected)" || echo "   FAIL: $INVALID"
echo ""

# 13) Auth me without userId
echo "13. GET /api/auth/me (no userId)"
curl -s "$BASE/api/auth/me" | grep -q '"success":false' && echo "   OK (correctly rejected)" || echo "   FAIL"
echo ""

echo "=== API tests completed ==="
