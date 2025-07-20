# SINPE Wi-Fi Admin Portal

This project is a React-based web application for managing a Wi-Fi access system that uses SINPE Móvil for payments. It includes an admin dashboard for approving payments and managing users, and a separate user-facing page for submitting payment proof.

## Project Structure

- `/public`: Contains the main HTML shell for the application.
- `/src`: Contains all React source code, components, and styles.
  - `App.jsx`: The main component for the **Admin Dashboard**.
  - `UserPage.jsx`: The component for the **public-facing User Portal**.
  - `firebaseConfig.js`: **IMPORTANT:** Your Firebase credentials and app settings go here.
  - `index.css`: Global stylesheet with Tailwind CSS imports.
  - `index.jsx`: The main entry point for the React application.
- `package.json`: Project dependencies and scripts.

## Setup and Installation

1.  **Install Dependencies:**
    Open your terminal in the project root and run:
    ```bash
    npm install
    ```

2.  **Configure Firebase:**
    - Open `src/firebaseConfig.js`.
    - Replace the placeholder values (`YOUR_API_KEY`, etc.) with your actual credentials from the Firebase Console.

## Running the Application

### To run the Admin Dashboard:

1.  Make sure your `src/index.jsx` file is rendering the `<App />` component.
2.  Run the following command in your terminal:
    ```bash
    npm run dev
    ```
3.  Open your browser to `http://localhost:5173`.

### To run the User Portal:

1.  Edit `src/index.jsx` and change `<App />` to `<UserPage />`.
2.  The development server will automatically update.
