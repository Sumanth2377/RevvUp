// This file is the single entry point for all Firebase-related functionality.
// It re-exports everything from the provider, hooks, and utilities.
// This allows for cleaner imports in other parts of the application.

export * from './provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './errors';
export * from './error-emitter';
