# ZenEM UI

A modern React TypeScript application for ZenEM tenant onboarding dashboard.

## Features

- **Authentication**: Secure login with JWT token management
- **Dashboard**: Real-time onboarding status tracking
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Type Safety**: Full TypeScript implementation

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- ZenEM Backend API running on `http://localhost:8080`

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

### Test Credentials

Use these credentials to test the application:

- **Email**: `admin@default.com`
- **Password**: `admin123`

Alternative (legacy support):
- **Username**: `admin`  
- **Password**: `admin123`

## Project Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   ├── auth/            # Authentication components
│   ├── dashboard/       # Dashboard-specific components
│   └── layout/          # Layout components
├── hooks/
│   ├── useAuth.ts       # Authentication state management
│   └── useStatus.ts     # Status data management
├── pages/
│   ├── Login.tsx        # Login page
│   └── Dashboard.tsx    # Main dashboard
├── services/
│   └── api.ts           # API service layer
├── types/
│   └── index.ts         # TypeScript type definitions
└── utils/
    ├── constants.ts     # Application constants
    └── mockData.ts      # Development mock data
```

## API Integration

The application connects to the ZenEM backend API:

### Endpoints

- **Login**: `POST /api/auth/login`
- **Status**: `GET /api/auth/status`

### Authentication

The app uses JWT token authentication stored in localStorage. Tokens are automatically included in API requests via the `Authorization: Bearer <token>` header.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Environment Variables

Create a `.env.local` file for local configuration:

```
VITE_API_BASE_URL=http://localhost:8080/api
```

## Design System

### Colors

- **Primary**: Blue (#2563eb)
- **Success**: Green (#059669) 
- **Warning**: Amber (#d97706)
- **Error**: Red (#dc2626)

### Status Indicators

- 🔴 **Not Onboarded**: No outcomes configured
- 🟡 **Partially Onboarded**: Some outcomes configured
- 🟢 **Fully Onboarded**: All outcomes configured

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Security Features

- JWT token management
- Automatic token expiration handling
- Secure localStorage usage
- Input validation and sanitization

## Accessibility

- WCAG 2.1 AA compliant
- Keyboard navigation support
- Screen reader compatible
- High contrast ratios

## Production Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy the `dist/` folder to your web server

3. Configure your web server to serve `index.html` for all routes (SPA routing)

## Troubleshooting

### Common Issues

**"Network Error" on login**
- Ensure the backend API is running on `http://localhost:8080`
- Check CORS configuration on the backend

**"Authentication Failed" with correct credentials**
- Verify the backend API endpoint is accessible
- Check browser network tab for detailed error messages

**Blank page after build**
- Ensure proper base URL configuration for your deployment
- Check console for JavaScript errors

## Contributing

1. Follow the existing code style and patterns
2. Add TypeScript types for all new interfaces
3. Include error handling for all API calls
4. Test responsive design on multiple screen sizes
5. Update this README for any new features

## License

Proprietary - ZenEM Internal Use Only