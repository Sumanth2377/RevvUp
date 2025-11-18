# RevvUp: Smart Vehicle Maintenance

Welcome to RevvUp! This is a Next.js application designed to help you manage your vehicle's maintenance schedule intelligently. It uses Firebase for backend services and Google's Generative AI (Genkit) to provide smart maintenance suggestions.

This project was bootstrapped with [Firebase Studio](https://firebase.google.com/studio).

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started: A Step-by-Step Guide for Newbies](#getting-started-a-step-by-step-guide-for-newbies)
  - [Step 1: Make Sure You Have the Tools](#step-1-make-sure-you-have-the-tools)
  - [Step 2: Get the Code](#step-2-get-the-code)
  - [Step 3: Install Project Dependencies](#step-3-install-project-dependencies)
  - [Step 4: Run the App!](#step-4-run-the-app)
- [Firebase Integration](#firebase-integration)
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

## Getting Started: A Step-by-Step Guide for Newbies

If you're new to the project, follow these steps carefully to get everything running on your computer.

### Step 1: Make Sure You Have the Tools

Before you can work with this project, you need a couple of things installed on your computer:
- **[Node.js](https://nodejs.org/) (version 18 or newer):** This is the environment that runs the JavaScript code.
- **[npm](https://www.npmjs.com/):** This is the package manager for Node.js, and it comes included when you install Node.js.

### Step 2: Get the Code

First, you need to have the project's code on your machine. If you're working with a version control system like Git, clone the repository.

### Step 3: Install Project Dependencies

Once you have the code, open your terminal or command prompt, navigate into the project's main folder, and run the following command:

```bash
npm install
```
This command reads the `package.json` file and downloads all the external code libraries that the project depends on. You only need to do this once after you get the code, or whenever new dependencies are added.

### Step 4: Run the App!

After the installation is complete, you can start the application. Run this command in your terminal:

```bash
npm run dev
```

This will start the local development server. You'll see a message in your terminal telling you that the server is ready. You can now open your web browser and go to:

**http://localhost:9002**

You should see the RevvUp application running!

## Firebase Integration

This project is tightly integrated with Firebase for authentication and database services. The setup is managed by Firebase Studio, which automates project creation and configuration.

- **`src/firebase/config.ts`**: This file contains your project's public Firebase configuration keys. These are automatically populated by Firebase Studio and are safe to be included in client-side code.
- **`docs/backend.json`**: This file serves as a **blueprint** for the Firestore database structure and data entities.
- **`firestore.rules`**: This file defines the security rules for your Firestore database, ensuring that users can only access and modify their own data.

## AI Features (Genkit)

The application uses Genkit to integrate generative AI for intelligent features.

- **`src/ai/flows/`**: This directory contains the Genkit "flows," which are server-side functions that orchestrate calls to large language models (LLMs).
- **Optional: Running the Genkit Inspector:** If you want to test or debug the AI flows separately, you can run the Genkit developer UI. Open a **new terminal window** (keep the `npm run dev` one running!) and run:
    ```bash
    npm run genkit:dev
    ```
    This will start the Genkit inspector, typically on `http://localhost:4000`.
