# Mech.io: Smart Vehicle Maintenance

Welcome to Mech.io! This is a Next.js application designed to help you manage your vehicle's maintenance schedule intelligently. It uses Firebase for backend services and Google's Generative AI (Genkit) to provide smart maintenance suggestions.

This project was bootstrapped with [Firebase Studio](https://firebase.google.com/studio).

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Development Server](#running-the-development-server)
- [Firebase Integration](#firebase-integration)
  - [Backend Configuration](#backend-configuration)
  - [Security Rules](#security-rules)
  - [Firebase Hooks](#firebase-hooks)
- [AI Features (Genkit)](#ai-features-genkit)

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (with App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [ShadCN/UI](https://ui.shadcn.com/)
- **Backend:** [Firebase](https://firebase.google.com/)
  - **Authentication:** Email/Password & Anonymous sign-in
  - **Database:** Cloud Firestore
- **Generative AI:** [Genkit](https://firebase.google.com/docs/genkit)

## Project Structure

Here is a high-level overview of the most important files and directories:

```
.
├── src
│   ├── app/                # Next.js pages and layouts (App Router)
│   │   ├── (auth)/         # Authentication-related pages (login, signup)
│   │   ├── vehicles/       # Pages for viewing and adding vehicles
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Home/Dashboard page
│   ├── components/         # Reusable React components
│   │   └── ui/             # ShadCN UI components
│   ├── firebase/           # Firebase configuration and hooks
│   │   ├── config.ts       # Firebase project configuration
│   │   ├── index.ts        # Main entry point for Firebase utilities
│   │   ├── provider.tsx    # Core Firebase context provider
│   │   └── ...hooks        # Custom hooks (useUser, useDoc, useCollection)
│   ├── lib/                # Application-specific logic
│   │   ├── actions.ts      # Next.js Server Actions
│   │   ├── data.ts         # Data fetching hooks (e.g., useVehicles)
│   │   ├── types.ts        # Core TypeScript types for the app
│   │   └── utils.ts        # Utility functions
│   └── ai/                 # Genkit AI flows and configuration
│       └── flows/          # AI-powered business logic
├── docs/
│   └── backend.json        # Defines the data model for Firestore
└── firestore.rules         # Security rules for the Firestore database
```

## Getting Started

Follow these steps to get the project running on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Installation

1.  Clone the repository to your local machine.
2.  Install the necessary dependencies using npm:

    ```bash
    npm install
    ```

### Running the Development Server

Once the dependencies are installed, you can start the Next.js development server:

```bash
npm run dev
```

This will start the application on `http://localhost:9002`.

You can also run the Genkit development server separately to inspect your AI flows:

```bash
npm run genkit:dev
```

This will start the Genkit developer UI, typically on `http://localhost:4000`.

## Firebase Integration

This project is tightly integrated with Firebase for authentication and database services. The setup is managed by Firebase Studio, which automates project creation and configuration.

### Backend Configuration

- **`src/firebase/config.ts`**: This file contains your project's public Firebase configuration keys. These are automatically populated by Firebase Studio and are safe to be included in client-side code.
- **`docs/backend.json`**: This file serves as a **blueprint** for the Firestore database structure and data entities. It defines the schemas for `User`, `Vehicle`, `MaintenanceTask`, etc. This file is used as a reference for code generation and to maintain a consistent data model.

### Security Rules

- **`firestore.rules`**: This file defines the security rules for your Firestore database. The rules are structured to ensure that users can only access and modify their own data. For example, all vehicle and maintenance data is stored in subcollections under `/users/{userId}`, and the rules enforce that `request.auth.uid` matches the `userId` in the path.

### Firebase Hooks

The project includes several custom hooks to simplify interaction with Firebase:

- **`useUser()`**: Gets the current authentication state (`user`, `isUserLoading`).
- **`useFirestore()`**: Returns the Firestore database instance.
- **`useDoc(docRef)`**: Subscribes to a single Firestore document in real-time.
- **`useCollection(collectionRef)`**: Subscribes to a Firestore collection in real-time.

These hooks are provided via the `FirebaseProvider` in `src/app/layout.tsx`.

## AI Features (Genkit)

The application uses Genkit to integrate generative AI for intelligent features.

- **`src/ai/flows/`**: This directory contains the Genkit "flows," which are server-side functions that orchestrate calls to large language models (LLMs).
  - **`intelligent-maintenance-schedule.ts`**: This flow takes vehicle details as input and returns an AI-generated maintenance schedule. It is connected to the "AI Suggestions" tab on the vehicle details page.
- **`src/lib/actions.ts`**: The AI flows are invoked from Next.js Server Actions, which allows the client to securely call these server-side functions without exposing an API endpoint.
