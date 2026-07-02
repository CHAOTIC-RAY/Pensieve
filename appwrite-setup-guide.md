# Pensieve Appwrite Setup Guide

This guide provides detailed, step-by-step instructions on how to set up and configure an Appwrite instance for use with Pensieve. Appwrite enables you to securely store and sync your thoughts, and host your own personal cloud storage.

---

## 1. Prerequisites

You can choose to use either the **Appwrite Cloud** service or **Self-Host** Appwrite on your own server.

*   **Appwrite Cloud (Easiest)**:
    1. Sign up for a free account at [appwrite.io](https://appwrite.io/).
    2. Once logged in, navigate to your Appwrite Console.
*   **Self-Hosting (For total control)**:
    * Follow the official [Appwrite Self-Hosting Installation Guide](https://appwrite.io/docs/installation) for your operating system.

---

## 2. Creating a Project and Database

1.  **Create a New Project**:
    * In the Appwrite console, click **Create Project**.
    * Name the project (e.g., `Pensieve`).
    * Click **Create**.
    * Copy the **Project ID** from the project settings dashboard (you will need this in Pensieve's settings).

2.  **Create a Database**:
    * In your project sidebar, click on **Databases**.
    * Click **Create Database**.
    * Name your database (e.g., `pensieve-db`).
    * Use `pensieve-db` as your **Database ID** (or click the edit icon to choose a custom ID).
    * Click **Create**.

---

## 3. Creating a Collection and Attributes

1.  **Create a Collection**:
    * Inside your newly created database, click **Create Collection**.
    * Name the collection (e.g., `Mind Items`).
    * Set the **Collection ID** as `mind-items` (or click the edit icon to choose a custom ID).
    * Click **Create**.

2.  **Add Attributes**:
    * Click on your new collection and go to the **Attributes** tab.
    * You **MUST** add exactly these three attributes with the exact keys below:
      
      * **Key 1**: `items`
        * **Type**: `String`
        * **Size**: `1000000` (or the maximum allowed size, e.g., `4194304` for large JSON string contents).
        * **Required**: `Yes`
      
      * **Key 2**: `user_id`
        * **Type**: `String`
        * **Size**: `255`
        * **Required**: `Yes`
      
      * **Key 3**: `updated_at`
        * **Type**: `String`
        * **Size**: `255`
        * **Required**: `Yes`

3.  **Set Collection Permissions**:
    * Go to the **Settings** tab inside your collection.
    * Scroll down to the **Permissions** section.
    * Click **Add Role**.
    * Add the **Any** role (or **Users** role for authenticated users only).
    * Grant permissions: Check **Create**, **Read**, **Update**, and **Delete**.
    * Click **Update** to save the permissions.

---

## 4. Creating a Storage Bucket (For Image & Audio uploads)

For storing card images, favicons, audio, and drawing canvas attachments, you will need to set up a Storage Bucket.

1.  **Create a Storage Bucket**:
    * In your project sidebar, click on **Storage**.
    * Click **Create Bucket**.
    * Name your bucket (e.g., `Pensieve Media`).
    * Use `pensieve-bucket` (or click the edit icon to choose a custom ID) as the **Bucket ID**.
    * Click **Create**.

2.  **Set Bucket Permissions**:
    * Navigate to the **Settings** tab for your newly created bucket.
    * Under the **Permissions** section, click **Add Role**.
    * Add the **Any** role (or **Users** role for authenticated users only).
    * Grant permissions: Check **Create**, **Read**, **Update**, and **Delete**.
    * Click **Update** to save the permissions.

---

## 5. Configuring Pensieve

Now that your Appwrite backend is ready, input your credentials into Pensieve:

1. Open the **Settings Panel** (clicking the gear icon or clicking **More** in mobile menu).
2. Go to the **Database & Sync** tab.
3. Switch the **Default Database Strategy** to **Appwrite**.
4. Scroll down to the **Custom Appwrite Connection** section and fill in:
   * **Endpoint URL**: `https://cloud.appwrite.io/v1` (or your custom self-hosted domain).
   * **Project ID**: From step 2.1.
   * **Database ID**: `pensieve-db`.
   * **Collection ID**: `mind-items`.
   * **Bucket ID**: `pensieve-bucket`.
5. The application will immediately sync and save your configuration reactively. The floating Appwrite notification will instantly disappear.

---

## Troubleshooting

*   **"Missing or insufficient permissions"**:
    * Ensure you have added the **Any** or **Users** role to BOTH the collection settings permissions AND the storage bucket settings permissions with all CRUD rights checked.
*   **"Database not found" or "Collection not found"**:
    * Double check that the IDs entered in Pensieve match the IDs in your Appwrite console exactly (Note: Appwrite IDs are case-sensitive).
*   **"Attribute not found"**:
    * Ensure the attribute keys `items`, `user_id`, and `updated_at` are spelled exactly as specified.
