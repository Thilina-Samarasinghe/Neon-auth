# Authentication Flow Diagram

This document contains visual diagrams illustrating how the JWT-based authentication system works, including the roles of the client, server, database, and tokens.

## 1. Authentication Activity Flow (Flowchart)

This flowchart represents the high-level activity flow when a user attempts to access a protected resource and logs in.

```mermaid
graph TD
    %% Define styles
    classDef client fill:#3498db,stroke:#2980b9,stroke-width:2px,color:#fff
    classDef server fill:#2ecc71,stroke:#27ae60,stroke-width:2px,color:#fff
    classDef db fill:#f39c12,stroke:#d35400,stroke-width:2px,color:#fff
    classDef error fill:#e74c3c,stroke:#c0392b,stroke-width:2px,color:#fff

    A([Start: Client Accesses Resource]) ---> B{Has Access Token?}
    B -- Yes --> C[Send Request with Access Token]
    B -- No --> D[Redirect to Login]

    C --> E[Server Validates Access Token]
    E -- Valid --> F[Process Request & Return Data]
    E -- Expired/Invalid --> G{Has Refresh Token?}

    G -- Yes --> H[Send Request to /refresh-token]
    G -- No --> D

    H --> I[Validate Refresh Token in DB]
    I -- Valid --> J[Generate New Tokens & Update DB]
    J --> K[Return New Access Token]
    K --> C
    I -- Invalid --> L[Clear Cookies & Revoke Tokens]
    L --> D

    D --> M[User Submits Credentials]
    M --> N[Server Verifies Credentials & Password]
    N -- Valid --> O[Create Session & Store Refresh Token in DB]
    O --> P[Set HTTP-only Cookies for Tokens]
    P --> C
    N -- Invalid --> Q[Return Error / Increment Failed Attempts]
    Q --> M

    F --> R([End: Resource Loaded])

    class A,C,D,H,K,M,R client
    class E,I,J,L,N,O,P,Q server
    class F db
```

## 2. Sequence Diagram: Login and Session Creation

This sequence diagram details the exact interactions between the Client window, Next.js API (Server), and Neon Database during a login event.

```mermaid
sequenceDiagram
    participant C as Client (Browser)
    participant A as Next.js API (/api/auth)
    participant D as Neon Database (Prisma)
    
    C->>A: POST /login (email, password)
    A->>D: Find User by Email
    D-->>A: Return User Record & Password Hash
    
    alt User Not Found or Account Locked
        A-->>C: 401 Unauthorized
    else User Found
        A->>A: Verify Password (bcrypt)
        
        alt Password Invalid
            A->>D: Increment Failed Login Attempts
            A-->>C: 401 Unauthorized
        else Password Valid
            A->>D: Count Active Sessions
            alt Active Sessions >= 2
                A->>D: Delete Oldest Session (Limit to 2)
            end
            
            A->>A: Generate JWT Access Token (Short-lived, e.g., 15m)
            A->>A: Generate JWT Refresh Token (Long-lived, e.g., 7d)
            A->>D: Create New Session (Store Refresh Token, Device Info)
            D-->>A: Session Created
            
            A->>C: Set-Cookie: accessToken (HTTP-only, Secure)
            A->>C: Set-Cookie: refreshToken (HTTP-only, Secure)
            A-->>C: 200 OK (Login Successful, Returns User Info)
        end
    end
```

## 3. Sequence Diagram: Token Refresh Flow

When the Access Token expires, this flow silently requests new tokens using the Refresh Token without requiring the user to log in again.

```mermaid
sequenceDiagram
    participant C as Client (Browser)
    participant A as Next.js API (/api/auth)
    participant D as Neon Database (Prisma)

    C->>A: GET /protected-route (Expired Access Token)
    A-->>C: 401 Unauthorized (Token Expired)
    
    C->>A: POST /refresh-token (Sends Refresh Token Cookie)
    A->>A: Verify Refresh Token JWT Signature
    
    alt Invalid/Expired JWT
        A->>C: Clear Cookies
        A-->>C: 401 Unauthorized (Redirect slowly to Login)
    else Valid JWT
        A->>D: Find Session with this Refresh Token
        D-->>A: Session Data
        
        alt Session Revoked or Not Found
            A->>C: Clear Cookies
            A-->>C: 401 Unauthorized
        else Session Valid
            A->>A: Generate NEW Access Token
            A->>A: Generate NEW Refresh Token (Rotation)
            
            A->>D: Update Session (Replace Old Refresh Token)
            D-->>A: Updated
            
            A->>C: Set-Cookie: NEW accessToken
            A->>C: Set-Cookie: NEW refreshToken
            A-->>C: 200 OK (Tokens Refreshed)
            
            Note right of C: Client retries original request<br>with new Access Token
        end
    end
```

## How the Elements Work Together:

1. **JWT (JSON Web Tokens)**:
   - **Access Token**: Contains user claims (e.g., `userId`, `role`). Used to authorize requests to protected API endpoints. It is short-lived to minimize damage if hijacked.
   - **Refresh Token**: A cryptographically signed token used to get a new Access Token. It is long-lived but tightly coupled with the database.
   
2. **Database (Neon PostgreSQL & Prisma)**:
   - Does NOT store the Access Token.
   - Stores the hashed `Refresh Token` in a `Session` model.
   - Allows tracking devices and enforcing session limits (e.g., maximum 2 devices simultaneously). If a user logs in on a 3rd device, the oldest session in the DB is deleted, effectively logging out the 1st device on its next refresh attempt.
   
3. **HTTP-only Cookies**:
   - Both tokens are sent to the client via `Set-Cookie` HTTP headers with `HttpOnly`, `Secure`, and `SameSite=Strict` attributes.
   - This prevents Cross-Site Scripting (XSS) from stealing the tokens, as JavaScript cannot read HTTP-only cookies.
