# Express TypeScript Blog Management API

A robust REST API for blog management built with Express.js, TypeScript, and MongoDB. Features user authentication, blog CRUD operations, and comprehensive testing.

## Features

- **User Authentication**: Secure signup and signin with JWT tokens
- **Blog Management**: Full CRUD operations for blog posts
- **Authorization**: Protected routes with user-based access control
- **Data Validation**: Input validation using express-validator
- **Security**: Helmet for security headers, CORS support
- **Database**: MongoDB with Mongoose ODM
- **Testing**: Comprehensive test suite with Jest
- **API Documentation**: Swagger/OpenAPI documentation
- **TypeScript**: Full type safety throughout the application

## Tech Stack

- **Backend**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Security**: Helmet, CORS
- **Testing**: Jest with Supertest
- **Documentation**: Swagger/OpenAPI

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Yarn or npm

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd express-typescript-mongoose
```

2. Install dependencies:
```bash
yarn install
# or
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/blog-management
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key
```

5. Start MongoDB service (if running locally)

## Usage

### Development
```bash
yarn dev
# or
npm run dev
```

### Production
```bash
yarn build
yarn start
# or
npm run build
npm start
```

The server will start on `http://localhost:3000` (or your configured PORT).

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login

### Blogs (Protected Routes)
- `GET /api/blogs` - Get all blogs (with optional category filter)
- `POST /api/blogs` - Create a new blog
- `PUT /api/blogs/:id` - Update a blog (owner only)
- `DELETE /api/blogs/:id` - Delete a blog (owner only)

### API Documentation
Access Swagger documentation at: `http://localhost:3000/api-docs`

## Testing

Run the test suite:
```bash
yarn test
# or
npm test
```

Run tests in watch mode:
```bash
yarn test:watch
# or
npm run test:watch
```

Run with coverage:
```bash
yarn test --coverage
# or
npm run test -- --coverage
```

## Project Structure

```
src/
├── app.ts              # Express app configuration
├── server.ts           # Server startup
├── config/
│   ├── database.ts     # MongoDB connection
│   └── env.ts          # Environment variables
├── controllers/
│   ├── auth.controller.ts
│   └── blog.controller.ts
├── middlewares/
│   ├── auth.middleware.ts
│   └── validateRequest.middleware.ts
├── models/
│   ├── user.model.ts
│   └── blog.model.ts
├── routes/
│   ├── auth.routes.ts
│   └── blog.routes.ts
└── types/
    ├── blog.type.ts
    ├── express.d.ts
    └── user.type.ts
```

## Scripts

- `dev`: Start development server with hot reload
- `build`: Compile TypeScript to JavaScript
- `start`: Start production server
- `test`: Run test suite
- `test:watch`: Run tests in watch mode
- `lint`: Run ESLint
- `clean`: Remove build directory

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/blog-management |
| `NODE_ENV` | Environment mode | development |
| `JWT_SECRET` | JWT signing secret | (required) |

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Submit a pull request

## License

