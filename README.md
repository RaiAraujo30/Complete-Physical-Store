# Physical Store Service 🌟

A NestJS-based application for managing physical stores, their delivery criteria, and calculating distances and shipping costs. The project integrates with external APIs like Google Maps, Correios, and GeoCodingAPI to provide efficient delivery logic and store management. 📍📦🛒

---

## Table of Contents 📖

1. [Features](#features)
2. [Technologies](#technologies)
3. [Setup Instructions](#setup-instructions)
4. [Usage](#usage)
5. [API Documentation](#api-documentation)
6. [Project Structure](#project-structure)
7. [Testing](#testing)
8. [Contributing](#contributing)

---

## Features ✨

- **Store Management**: Create, update, delete, and retrieve stores.
- **Delivery Logic**:
  - Calculates delivery methods, prices, and estimated times based on distance.
  - Handles special criteria for PDVs and stores beyond 50 km.
- **External API Integration**:
  - Google Maps for distance calculation.
  - Correios for dynamic shipping costs.
  - GeoCodingAPI for address validation.
- **MongoDB Database**: Stores persistent store and delivery criteria data.
- **Pagination**: Paginated store listings for efficient responses.
- **Validation**: Input validation for state and CEP formats.

---

## Technologies 🛠️

- **Core**: NestJS, TypeScript
- **Database**: MongoDB (via Mongoose)
- **Logging**: Winston
- **External APIs**:
  - Google Maps
  - Correios
  - GeoCodingAPI
- **Testing**: Jest, MongoMemoryServer

---

## Setup Instructions 🏗️

### Prerequisites 📋
- [Node.js](https://nodejs.org/) 
- [MongoDB](https://www.mongodb.com/) 


### Installation 💾

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/physical-store.git
   cd physical-store
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and configure:
   ```env
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/physical-store
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

4. Run the service:
   ```bash
   npm run start:dev
   ```

---

## Usage 🚀

### Start the Application 🎉
- Development Mode:
  ```bash
  npm run start:dev
  ```


### Endpoints 🌐
| Method | Endpoint                 | Description                           |
|--------|--------------------------|---------------------------------------|
| GET    | /store                   | List all stores                      |
| POST   | /store                   | Create a new store                   |
| GET    | /store/:id               | Get a store by ID                    |
| DELETE | /store/:id               | Delete a store by ID                 |
| GET    | /store/cep/:cep          | Get nearby stores based on CEP       |
| GET    | /deliveryCriteria        | List all delivery criteria           |
| POST   | /deliveryCriteria        | Add a new delivery criterion         |
| DELETE | /deliveryCriteria/:id    | Delete a delivery criterion          |

---

## API Documentation 📚

Swagger documentation is available for exploring API endpoints. 🚀

- Start the application.
- Navigate to: `http://localhost:3000/api-docs`

---

## Project Structure 🗂️

```
physical-store/
├── src/
│   ├── api/
│   │   ├── correios/
│   │   ├── maps/
│   ├── store/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── services/
│   ├── delivery/
│   ├── common/
│   ├── config/
│   ├── main.ts
├── test/
├── README.md
```

---

## Testing 🧪

1. Run unit tests:
   ```bash
   npm run test
   ```
---

## Contributing 🤝

1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature-name
   ```
3. Make changes and commit:
   ```bash
   git commit -m "Add new feature"
   ```
4. Push to your branch:
   ```bash
   git push origin feature-name
   ```
5. Open a pull request.

---

