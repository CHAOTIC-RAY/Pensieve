import fs from 'fs';
let content = fs.readFileSync('src/services/storeService.ts', 'utf-8');

content = content.replace(
  "const endpoint = import.meta.env.VITE_STORE_APPWRITE_ENDPOINT;",
  "// @ts-ignore\nconst endpoint = import.meta.env.VITE_STORE_APPWRITE_ENDPOINT;"
).replace(
  "const projectId = import.meta.env.VITE_STORE_APPWRITE_PROJECT_ID;",
  "// @ts-ignore\nconst projectId = import.meta.env.VITE_STORE_APPWRITE_PROJECT_ID;"
).replace(
  "const databaseId = import.meta.env.VITE_STORE_APPWRITE_DATABASE_ID;",
  "// @ts-ignore\nconst databaseId = import.meta.env.VITE_STORE_APPWRITE_DATABASE_ID;"
).replace(
  "const collectionId = import.meta.env.VITE_STORE_APPWRITE_COLLECTION_ID;",
  "// @ts-ignore\nconst collectionId = import.meta.env.VITE_STORE_APPWRITE_COLLECTION_ID;"
);

fs.writeFileSync('src/services/storeService.ts', content);
