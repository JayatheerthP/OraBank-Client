# API Documentation for Microservices System

## Overview
This document outlines the RESTful API endpoints for a banking/financial microservices system comprising `UserService`, `AccountService`, `TransactionService`, and `NotificationService`. The APIs are accessed through a `GatewayService` acting as the entry point, with service discovery via `EurekaService`. Communication between services uses RestTemplate for synchronous calls and Kafka for asynchronous event-driven interactions.

All endpoints are prefixed with `/api/v1/` as per the provided `@RequestMapping` annotations. Authentication is required for certain endpoints (e.g., transactions), typically via a JWT token passed in the `Authorization` header.

### Error Response Format
All error responses follow a standardized structure as defined by the `ErrorResponse` class:
```json
{
  "message": "Detailed error message",
  "status": "Error status code or description (e.g., BAD_REQUEST, UNAUTHORIZED)",
  "timestamp": "2023-10-01T10:00:00"
}
```

### General Notes
- **Authentication**: Most endpoints require a valid JWT token in the `Authorization` header (e.g., `Bearer <token>`). The token is validated by the `GatewayService` before routing.
- **Error Handling**: Errors return appropriate HTTP status codes with a standardized `ErrorResponse` JSON object containing `message`, `status`, and `timestamp`.
- **Content Type**: All requests and responses use `application/json` as the content type unless specified otherwise.
- **Versioning**: APIs are versioned under `/api/v1/` to allow for future updates without breaking existing clients.

---

## 1. User Service API
**Base Path**: `/api/v1/users`  
**Purpose**: Manages user registration, authentication, and status retrieval.

### 1.1. Sign Up
- **Endpoint**: `POST /api/v1/users/signup`
- **Description**: Registers a new user in the system.
- **Request Body**: `UserSignUpRequest`
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePass123",
    "phoneNumber": "+1-123-456-7890",
    "fullName": "John Doe",
    "dateOfBirth": "1990-01-01",
    "address": "123 Main St, City, Country"
  }
  ```
- **Response**: `UserSignUpResponse` (HTTP 200 OK)
  ```json
  {
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "fullName": "John Doe",
    "isActive": true,
    "isLocked": false,
    "createdAt": "2023-10-01T10:00:00"
  }
  ```
- **Error Responses**:
  - HTTP 400 Bad Request: Invalid input (e.g., invalid email format, password too short).
    ```json
    {
      "message": "Email should be valid",
      "status": 000,
      "timestamp": "2023-10-01T10:00:00"
    }
    ```
  - HTTP 409 Conflict: Email already exists.
    ```json
    {
      "message": "Email already registered",
      "status": 000,
      "timestamp": "2023-10-01T10:00:00"
    }
    ```

### 1.2. Sign In
- **Endpoint**: `POST /api/v1/users/signin`
- **Description**: Authenticates a user and returns a JWT token.
- **Request Body**: `UserSignInRequest`
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePass123"
  }
  ```
- **Response**: `UserSignInResponse` (HTTP 200 OK)
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "expiresIn": 3600
  }
  ```
- **Error Responses**:
  - HTTP 400 Bad Request: Invalid input.
    ```json
    {
      "message": "Email is mandatory",
      "status": 000,
      "timestamp": "2023-10-01T10:00:00"
    }
    ```
  - HTTP 401 Unauthorized: Invalid credentials or account locked.
    ```json
    {
      "message": "Authentication failed or account is locked",
      "status": 000,
      "timestamp": "2023-10-01T10:00:00"
    }
    ```

### 1.3. Get User Details
- **Endpoint**: `GET /api/v1/users/user/{userId}`
- **Description**: Retrieves detailed information about a user.
- **Path Parameter**: `userId` (UUID, e.g., `123e4567-e89b-12d3-a456-426614174000`)
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `UserResponse` (HTTP 200 OK)
  ```json
  {
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "phoneNumber": "+1-123-456-7890",
    "fullName": "John Doe",
    "dateOfBirth": "1990-01-01",
    "address": "123 Main St, City, Country",
    "isActive": true,
    "isLocked": false,
    "createdAt": "2023-10-01T10:00:00"
  }
  ```
- **Error Responses**:
  - HTTP 401 Unauthorized: Invalid or missing token.
    ```json
    {
      "message": "Invalid or missing token",
      "status": 000,
      "timestamp": "2023-10-01T10:00:00"
    }
    ```
  - HTTP 404 Not Found: User not found.
    ```json
    {
      "message": "User not found",
      "status": 000,
      "timestamp": "2023-10-01T10:00:00"
    }
    ```

### 1.4. Get User Status
- **Endpoint**: `GET /api/v1/users/user/{userId}/status`
- **Description**: Retrieves the status of a user.
- **Path Parameter**: `userId` (UUID)
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `UserStatusResponse` (HTTP 200 OK)
  ```json
  {
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "isActive": true,
    "isLocked": false,
    "failedLoginAttempts": 0
  }
  ```
- **Error Responses**:
  - HTTP 401 Unauthorized: Invalid or missing token.
    ```json
    {
      "message": "Invalid or missing token",
      "status": 000,
      "timestamp": "2023-10-01T10:00:00"
    }
    ```
  - HTTP 404 Not Found: User not found.
    ```json
    {
      "message": "User not found",
      "status": 000,
      "timestamp": "2023-10-01T10:00:00"
    }
    ```

---

## 2. Account Service API
**Base Path**: `/api/v1/accounts`  
**Purpose**: Manages account creation, retrieval, and balance operations.

### 2.1. Create Account
- **Endpoint**: `POST /api/v1/accounts/createaccount`
- **Description**: Creates a new account for a user.
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: `AccountCreateRequest`
  ```json
  {
    "accountType": "SAVINGS",
    "currency": "USD",
    "initialDeposit": 100.00,
    "branch": "Main Branch"
  }
  ```
- **Response**: `AccountCreateResponse` (HTTP 200 OK)
  ```json
  {
    "accountNumber": "ACC123456789",
    "accountType": "SAVINGS",
    "branch": "Main Branch",
    "balance": 100.00,
    "currency": "USD",
    "isActive": true,
    "isLocked": false,
    "createdAt": "2023-10-01T10:00:00"
  }
  ```
- **Error Responses**:
  - HTTP 400 Bad Request: Invalid input (e.g., invalid currency code).
    ```json
    {
      "message": "Currency must be a 3-letter code (e.g., USD)",
      "status": 000,
      "timestamp": "2023-10-01T10:00:00"
    }
    ```
  - HTTP 401 Unauthorized: Invalid or missing token.
    ```json
    {
      "message": "Invalid or missing token",
      "status": 000,
      "timestamp": "2023-10-01T10:00:00"
    }
    ```

### 2.2. Get Account Details
- **Endpoint**: `GET /api/v1/accounts/account/{accountNumber}`
- **Description**: Retrieves detailed information about a specific account.
- **Path Parameter**: `accountNumber` (e.g., `ACC123456789`)
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `AccountResponse` (HTTP 200 OK)
  ```json
  {
    "accountNumber": "ACC123456789",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "accountType": "SAVINGS",
    "balance": 100.00,
    "currency": "USD",
    "isActive": true,
    "isLocked": false,
    "createdAt": "2023-10-01T10:00:00"
  }
  ```
- **Error Responses**:
  - HTTP 401 Unauthorized: Invalid or missing token.
    ```json
    {
      "message": "Invalid or missing token",
      "status": 000,
      "timestamp": "2023-10-01T10:00:00"
    }
    ```
  - HTTP 404 Not Found: Account not found.
    ```json
    {
      "message": "Account not found",
      "status": 000,
      "timestamp": "2023-10-01T10:00:00"
    }
    ```

### 2.3. Get User Accounts
- **Endpoint**: `GET /api/v1/accounts/user`
- **Description**: Retrieves all accounts associated with the authenticated user.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `AccountUserResponse` (HTTP 200 OK)
  ```json
  {
    "accounts": [
      {
        "accountNumber": "ACC123456789",
        "accountType": "SAVINGS",
        "branch": "Main Branch",
        "balance": 100.00,
        "currency": "USD",
        "isActive": true,
        "isLocked": false
      }
    ]
  }
  ```
- **Error Responses**:
  - HTTP 401 Unauthorized: Invalid or missing token.
    ```json
    {
      "message": "Invalid or missing token",
      "status": 000,
      "timestamp": "2023-10-01T10:00:00"
    }
    ```

### 2.4. Get Account Balance
- **Endpoint**: `GET /api/v1/accounts/{accountNumber}/balance`
- **Description**: Retrieves the balance of a specific account.
- **Path Parameter**: `accountNumber` (e.g., `ACC123456789`)
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `AccountBalanceResponse` (HTTP 200 OK)
  ```json
  {
    "accountNumber": "ACC123456789",
    "balance": 100.00,
    "currency": "USD",
    "lastUpdated": "2023-10-01T10:00:00"
  }
  ```
- **Error Responses**:
  - HTTP 401 Unauthorized: Invalid or missing token.
    ```json
    {
      "message": "Invalid or missing token",
      "status": 000,
      "timestamp": "2023-10-01T10:00:00"
    }
    ```
  - HTTP 404 Not Found: Account not found.
    ```json
    {
      "message": "Account not found",
      "status": 000,
      "timestamp": "2023-10-01T10:00:00"
    }
    ```

### 2.5. Update Account Balance
- **Endpoint**: `PUT /api/v1/accounts/{accountNumber}/balance`
- **Description**: Updates the balance of a specific account (used internally or by Transaction Service).
- **Path Parameter**: `accountNumber` (e.g., `ACC123456789`)
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: `AccountBalanceUpdateRequest`
  ```json
  {
    "amount": 50.00,
    "updateType": "DEPOSIT"
  }
  ```
- **Response**: `AccountBalanceResponse` (HTTP 200 OK)
  ```json
  {
    "accountNumber": "ACC123456789",
    "balance": 150.00,
    "currency": "USD",
    "lastUpdated": "2023-10-01T10:05:00"
  }
  ```
- **Error Responses**:
  - HTTP 400 Bad Request: Invalid input or insufficient balance for withdrawal.
    ```json
    {
      "message": "Amount must be greater than 0",
      "status": 000,
      "timestamp": "2023-10-01T10:00:00"
    }
    ```
  - HTTP 401 Unauthorized: Invalid or missing token.
    ```json
    {
      "message": "Invalid or missing token",
      "status": 000,
      "timestamp": "2023-10-01T10:00:00"
    }
    ```
  - HTTP 403 Forbidden: Account inactive or locked.
    ```json
    {
      "message": "Account is inactive or locked",
      "status": 000,
      "timestamp": "2023-10-01T10:00:00"
    }
    ```
  - HTTP 404 Not Found: Account not found.
    ```json
    {
      "message": "Account not found",
      "status": 000,
      "timestamp": "2023-10-01T10:00:00"
    }
    ```

---

## 3. Transaction Service API
**Base Path**: `/api/v1/transactions`  
**Purpose**: Manages financial transactions and retrieves statements.

### 3.1. Perform Transaction
- **Endpoint**: `POST /api/v1/transactions/transact`
- **Description**: Initiates a transaction (e.g., transfer) between accounts.
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: `TransactionRequest`
  ```json
  {
    "transactionType": "TRANSFER",
    "fromAccountNumber": "ACC123456789",
    "toAccountNumber": "ACC987654321",
    "amount": 50.00,
    "description": "Payment for services"
  }
  ```
- **Response**: `TransactionResponse` (HTTP 200 OK)
  ```json
  {
    "transactionId": "123e4567-e89b-12d3-a456-426614174001",
    "fromAccountNumber": "ACC123456789",
    "toAccountNumber": "ACC987654321",
    "amount": 50.00,
    "transactionType": "TRANSFER",
    "status": "SUCCESS",
    "description": "Payment for services",
    "createdAt": "2023-10-01T10:10:00"
  }
  ```
- **Error Responses**:
  - HTTP 400 Bad Request: Invalid input (e.g., negative amount).
    ```json
    {
      "message": "Amount must be greater than 0",
      "status": 000,
      "timestamp": "2023-10-01T10:00:00"
    }
    ```
  - HTTP 401 Unauthorized: Invalid or missing token.
    ```json
    {
      "message": "Invalid or missing token",
      "status": 000,
      "timestamp": "2023-10-01T10:00:00"
    }
    ```
  - HTTP 403 Forbidden: Insufficient balance or accounts inactive/locked.
    ```json
    {
      "message": "Insufficient balance",
      "status": 000,
      "timestamp": "2023-10-01T10:00:00"
    }
    ```
  - HTTP 404 Not Found: Account not found.
    ```json
    {
      "message": "Account not found",
      "status": 000,
      "timestamp": "2023-10-01T10:00:00"
    }
    ```

### 3.2. Get Transaction Statement
- **Endpoint**: `GET /api/v1/transactions/{accountNumber}/statement`
- **Description**: Retrieves transaction history for a specific account.
- **Path Parameter**: `accountNumber` (e.g., `ACC123456789`)
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `TransactionStatementResponse` (HTTP 200 OK)
  ```json
  {
    "accountNumber": "ACC123456789",
    "transactions": [
      {
        "transactionId": "123e4567-e89b-12d3-a456-426614174001",
        "date": "2023-10-01T10:10:00",
        "description": "Payment for services",
        "transactionType": "TRANSFER",
        "amount": 50.00,
        "status": "SUCCESS",
        "otherParty": "ACC987654321"
      }
    ]
  }
  ```
- **Error Responses**:
  - HTTP 401 Unauthorized: Invalid or missing token.
    ```json
    {
      "message": "Invalid or missing token",
      "status": 000,
      "timestamp": "2023-10-01T10:00:00"
    }
    ```
  - HTTP 404 Not Found: Account not found.
    ```json
    {
      "message": "Account not found",
      "status": 000,
      "timestamp": "2023-10-01T10:00:00"
    }
    ```

---

## 4. Notification Service API
**Base Path**: Internal (not directly exposed to clients; triggered via Kafka events)  
**Purpose**: Sends notifications for system events (e.g., welcome, account creation, transactions).  
**Note**: Notification Service APIs are primarily internal and triggered by Kafka events. They are not directly accessible via REST endpoints for clients but are included for completeness based on the `NotificationService` interface. Since they are internal, error responses are logged rather than returned to clients.

### 4.1. Send Welcome Notification (Internal)
- **Method**: `sendWelcomeNotification(WelcomeNotification request)`
- **Description**: Sends a welcome notification to a new user.
- **Input**: `WelcomeNotification` object (via Kafka event)
- **Logic**: Creates a `Notification` entity and sends the notification (e.g., via email).
- **Error**: Logs exception if sending fails; retries may be configured. No client-facing `ErrorResponse`.

### 4.2. Send Account Created Notification (Internal)
- **Method**: `sendAccountCreatedNotification(AccountCreatedNotification request)`
- **Description**: Sends a notification when an account is created.
- **Input**: `AccountCreatedNotification` object (via Kafka event)
  ```json
  {
    "recipient": "user@example.com",
    "accountNumber": "ACC123456789",
    "accountType": "SAVINGS",
    "branch": "Main Branch"
  }
  ```
- **Logic**: Creates a `Notification` entity and sends the notification.
- **Error**: Logs exception if sending fails. No client-facing `ErrorResponse`.

### 4.3. Send Transaction Notification (Internal)
- **Method**: `sendTransactionNotification(TransactionNotification request)`
- **Description**: Sends a notification for a completed transaction.
- **Input**: `TransactionNotification` object (via Kafka event)
  ```json
  {
    "recipient": "user@example.com",
    "transactionId": "123e4567-e89b-12d3-a456-426614174001",
    "amount": "50.00",
    "transactionType": "TRANSFER",
    "date": "2023-10-01"
  }
  ```
- **Logic**: Creates a `Notification` entity and sends the notification.
- **Error**: Logs exception if sending fails. No client-facing `ErrorResponse`.

### 4.4. Send Login Locked Notification (Internal)
- **Method**: `sendLoginLockedNotification(LoginLockedNotification request)`
- **Description**: Sends a notification when a user account is locked due to failed login attempts.
- **Input**: `LoginLockedNotification` object (via Kafka event)
- **Logic**: Creates a `Notification` entity and sends the notification.
- **Error**: Logs exception if sending fails. No client-facing `ErrorResponse`.