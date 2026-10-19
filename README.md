# HIRE-VIA — Stepwise Hiring Form

A modern, responsive multi-step registration form for **HIRE-VIA Manpower & Staffing Services** built with React, TypeScript, TanStack Router, Tailwind CSS, and Zod validation.

## Features

- **Multi-Step Form Flow**:
  1. **Personal Details**: Contact information, address, date of birth, gender, and sales employee code.
  2. **Job Preferences**: Role selection, preferred work location, employment types, experience, previous employer, expected salary, and joining date.
  3. **Education & Skills**: Qualification, specialized skills, and languages known.
  4. **Emergency Contact**: Emergency contact person details and relationship.
  5. **Declarations & Background**: Accuracy declaration, police clearance certificate, and background verification consent.
  6. **Review & Confirmation**: Full summary of submitted information with digital signature confirmation.
- **Robust Validation**: Zod schema validation for all form steps.
- **Responsive & Modern Design**: Clean UI with custom styled components, mobile-friendly navigation, and step indicators.
- **Static Site Build**: Ready for deployment on any static hosting (Netlify, Vercel, GitHub Pages, Apache, Nginx, etc.) with pre-rendered HTML and assets in `dist/`.

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or bun

### Installation

```sh
npm install
```

### Development

To start the local development server:

```sh
npm run dev
```

### Production Build

To build the static application into the `dist/` folder:

```sh
npm run build
```

The output will be generated in `dist/` containing `index.html` and all static assets ready for deployment.

### Preview Build

To preview the production build locally:

```sh
npm run preview
```
