# House Booking Express API

A robust Express.js backend for a house booking platform with PostgreSQL and Sequelize ORM.

## Features

- 🔐 Authentication & Authorization
  - User registration and login
  - Email verification
  - Password reset
  - Role-based access control (User, Host, Admin)

- 🏠 House Management
  - CRUD operations for house listings
  - Host verification system
  - Property details and amenities

- 👥 User Management
  - User profiles
  - Host profiles
  - Guest profiles
  - Verification system

- 💰 Booking System
  - Booking creation and management
  - Payment integration
  - Host earnings tracking

- 📝 Reviews & Ratings
  - Review system
  - Rating management
  - Review responses

- 🔍 Search & Discovery
  - Advanced search filters
  - Search history
  - Location-based search

## Tech Stack

- Node.js & Express.js
- PostgreSQL
- Sequelize ORM
- JWT Authentication
- Bcrypt for password hashing
- Express Validator
- Helmet for security
- CORS enabled

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/house-booking-express.git
cd house-booking-express
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
PORT=3000
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password
DATABASE_NAME=house_booking
JWT_SECRET=your_jwt_secret
APP_URL=http://localhost:3000
```

4. Run database migrations:
```bash
npm run migrate
```

5. Start the server:
```bash
npm start
```

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `GET /api/auth/verify/:token` - Verify email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### House Endpoints

- `GET /api/houses` - List all houses
- `GET /api/houses/:id` - Get house details
- `POST /api/houses` - Create new house (Host only)
- `PUT /api/houses/:id` - Update house (Host only)
- `DELETE /api/houses/:id` - Delete house (Host only)

### User Endpoints

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/settings` - Get user settings
- `PUT /api/users/settings` - Update user settings

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email your-email@example.com or open an issue in the repository. 