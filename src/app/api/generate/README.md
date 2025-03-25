# API Routes for Generator

This directory contains API routes for the website generator functionality.

## Main Routes

- `POST /api/generate`: Creates a new Next.js project based on the provided form data
- `GET /api/generate/preview`: Returns a preview of the generated files or project structure
- `GET /api/generate/download`: Creates and returns a ZIP archive of the generated project

## Structure

The API routes use the business logic that's defined in `/src/app/generate/`. This separation keeps the API routes clean and focused on handling HTTP requests, while the actual generation logic lives outside the API directory.

```
src/app/
├── api/                      # API Routes
│   └── generate/             # Generator API routes
│       ├── download/         # Project download as ZIP
│       │   └── route.ts      # GET /api/generate/download
│       ├── preview/          # Project preview
│       │   └── route.ts      # GET /api/generate/preview
│       └── route.ts          # POST /api/generate
└── generate/                 # Business logic
    ├── components/           # Components generation
    ├── project/              # Project setup
    └── shared/               # Shared utilities and types
```

## API Routes Documentation

### POST /api/generate

Creates a new Next.js project based on the provided form data.

**Request Body:**
```json
{
  "businessName": "Example Business",
  "businessType": "ecommerce",
  "industry": "fashion",
  "description": "A modern fashion store",
  "language": "he",
  "primaryColor": "#3b82f6",
  "secondaryColor": "#10b981"
}
```

**Response:**
```json
{
  "success": true,
  "projectDir": "example-business",
  "projectPath": "/tmp/landing-page-generator/example-business",
  "components": [
    {
      "name": "Hero",
      "path": "Hero.tsx",
      "dependencies": []
    },
    {
      "name": "ContactForm",
      "path": "ContactForm.tsx",
      "dependencies": []
    }
  ]
}
```

### GET /api/generate/preview

Returns a preview of the generated files or project structure.

**Query Parameters:**
- `project`: The project directory name
- `path`: (Optional) Specific file path to view

**Response (project structure):**
```json
{
  "projectDir": "example-business",
  "structure": [
    {
      "name": "src",
      "path": "/example-business/src",
      "type": "directory",
      "children": [
        {
          "name": "app",
          "path": "/example-business/src/app",
          "type": "directory",
          "children": []
        }
      ]
    }
  ]
}
```

### GET /api/generate/download

Creates and returns a ZIP archive of the generated project.

**Query Parameters:**
- `project`: The project directory name

**Response:**
Binary ZIP file with appropriate headers for download 