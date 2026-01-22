# API Reference - Auctioneer Authentication System

## Base URL
```
http://localhost:4000/api/auctioneers
```

## Endpoints

### 1. Login
**Endpoint:** `POST /login`

**Description:** Authenticate an auctioneer and retrieve their franchise data.

**Request Body:**
```json
{
  "username": "string (required)",
  "password": "string (required)",
  "sport": "string (required - one of: football, basketball, cricket, baseball, volleyball)"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "auctioneer": {
    "id": "string",
    "username": "string",
    "email": "string",
    "name": "string",
    "phone": "string",
    "sport": "string",
    "franchiseId": "string",
    "profilePicture": "string"
  },
  "franchise": {
    "id": "string",
    "name": "string",
    "auctioneerId": "string",
    "sport": "string",
    "city": "string",
    "stadium": "string",
    "totalPurse": number,
    "purseRemaining": number,
    "playerCount": number,
    "wins": number,
    "losses": number
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid username/email or password"
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Sport is required"
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:4000/api/auctioneers/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "james_mitchell",
    "password": "password123",
    "sport": "football"
  }'
```

---

### 2. Get Auctioneer Details
**Endpoint:** `GET /details`

**Description:** Retrieve detailed information about a specific auctioneer.

**Query Parameters:**
- `auctioneerId` (required) - The ID of the auctioneer
- `sport` (required) - The sport category

**Success Response (200 OK):**
```json
{
  "success": true,
  "auctioneer": {
    "id": "string",
    "username": "string",
    "email": "string",
    "name": "string",
    "phone": "string",
    "sport": "string",
    "franchiseId": "string",
    "profilePicture": "string",
    "createdAt": "string",
    "active": boolean
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Auctioneer not found"
}
```

**Example cURL:**
```bash
curl -X GET "http://localhost:4000/api/auctioneers/details?auctioneerId=fb_a1&sport=football"
```

---

### 3. Create Franchise
**Endpoint:** `POST /franchise/create`

**Description:** Create a new franchise for an auctioneer. Prevents duplicate franchises.

**Request Body:**
```json
{
  "auctioneerId": "string (required)",
  "sport": "string (required)",
  "name": "string (required)",
  "city": "string (optional)",
  "stadium": "string (optional)",
  "capacity": number (optional),
  "auctioneerName": "string (optional)"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Franchise created successfully",
  "franchise": {
    "id": "string",
    "name": "string",
    "auctioneerId": "string",
    "sport": "string",
    "city": "string",
    "stadium": "string",
    "totalPurse": number,
    "purseRemaining": number,
    "playerCount": number,
    "wins": number,
    "losses": number
  }
}
```

**Error Response (400 Bad Request) - Already has franchise:**
```json
{
  "success": false,
  "message": "Auctioneer already has a franchise"
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:4000/api/auctioneers/franchise/create \
  -H "Content-Type: application/json" \
  -d '{
    "auctioneerId": "fb_a1",
    "sport": "football",
    "name": "New Franchise",
    "city": "New York",
    "stadium": "New Stadium",
    "capacity": 70000,
    "auctioneerName": "James Mitchell"
  }'
```

---

### 4. Update Franchise
**Endpoint:** `PUT /franchise/update`

**Description:** Update an existing franchise's details.

**Request Body:**
```json
{
  "franchiseId": "string (required)",
  "auctioneerId": "string (required)",
  "sport": "string (required)",
  "name": "string (optional)",
  "city": "string (optional)",
  "stadium": "string (optional)",
  "totalPurse": number (optional),
  "purseRemaining": number (optional)",
  "wins": number (optional)",
  "losses": number (optional)",
  "playerCount": number (optional)"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Franchise updated successfully",
  "franchise": {
    "id": "string",
    "name": "string",
    "auctioneerId": "string",
    "sport": "string",
    "city": "string",
    "stadium": "string",
    "totalPurse": number,
    "purseRemaining": number,
    "playerCount": number,
    "wins": number,
    "losses": number
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Franchise not found"
}
```

**Example cURL:**
```bash
curl -X PUT http://localhost:4000/api/auctioneers/franchise/update \
  -H "Content-Type: application/json" \
  -d '{
    "franchiseId": "fb_f1",
    "auctioneerId": "fb_a1",
    "sport": "football",
    "name": "Thunder Hawks Updated",
    "city": "New York",
    "wins": 16,
    "losses": 4
  }'
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input or missing required fields |
| 401 | Unauthorized - Invalid credentials |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error - Server error |

---

## Common Errors

### "Sport is required"
- **Cause:** The `sport` parameter is missing
- **Solution:** Include a valid sport (football, basketball, cricket, baseball, volleyball)

### "Username or email is required"
- **Cause:** Neither username nor email was provided
- **Solution:** Provide at least one of username or email

### "Password is required"
- **Cause:** The `password` field is missing
- **Solution:** Include the password in the request

### "Invalid username/email or password"
- **Cause:** The credentials don't match
- **Solution:** Verify username/email and password are correct

### "Auctioneer already has a franchise"
- **Cause:** Trying to create a franchise when one already exists
- **Solution:** Use the update endpoint instead

### "Franchise not found"
- **Cause:** The franchiseId is invalid or doesn't exist
- **Solution:** Verify the franchiseId is correct

---

## Testing with Postman

1. **Import the requests** using the examples above
2. **Set the following variables:**
   - Base URL: `http://localhost:4000/api/auctioneers`
3. **Test the login endpoint first**
4. **Use the returned franchiseId and auctioneerId for subsequent requests**

---

## Integration with Frontend

The frontend (`AuthContext.tsx`) handles API calls automatically:

```typescript
// Login
await login(username, password, 'auctioneer', sport);

// Result in context
const { user, franchise } = useAuth();
// user = auctioneer object
// franchise = franchise object or null

// Update franchise
const response = await fetch('http://localhost:4000/api/auctioneers/franchise/update', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    franchiseId: franchise.id,
    auctioneerId: user.id,
    sport: user.sport,
    ...updatedData
  })
});
```

---

## Notes

- All timestamps are in ISO 8601 format
- Currency is in Indian Rupees (₹)
- Sport values are case-sensitive: must be lowercase
- Auctioneer can only access their own franchise
- Passwords are not returned in responses
- Profile pictures are placeholder URLs (can be replaced with real URLs)
