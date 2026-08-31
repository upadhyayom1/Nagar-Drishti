# NagarDrishti - Command Center 🚀

NagarDrishti is an AI-powered vehicle intelligence and traffic analytics platform for Prayagraj. The frontend consumes the Express/Prisma backend for its cameras, roads, zones, detections, analytics, alerts, and blacklist records.

## 🛠 Tech Stack

*   **Framework:** [Next.js 14+](https://nextjs.org/) (App Router)
*   **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
*   **State Management:** [Zustand](https://github.com/pmndrs/zustand) (UI state) & [TanStack React Query](https://tanstack.com/query/latest) (Data fetching)
*   **Mapping:** [Leaflet](https://leafletjs.com/) with React-Leaflet
*   **3D Graphics:** [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction) & Drei (for the landing page hero scene)
*   **Icons:** [Lucide React](https://lucide.dev/)

---

## 💻 Getting Started (Local Development)

Follow these steps to get the project running locally on your machine. 

### 1. Prerequisites
Make sure you have Node.js installed (version 18.17 or higher is recommended). You can verify this by running:
```bash
node -v

```

### 2. Clone the Repository

Clone this repository to your local machine and navigate into the project folder:

```bash
git clone <paste-your-repo-url-here>
cd Frontend1

```

*(Note: If the folder name is different after cloning, navigate into that specific folder).*

### 3. Install Dependencies

This project uses `npm`. Run the following command to install all required packages. Node will automatically read the `package.json` file and download everything needed:

```bash
npm install

```

### 4. Run the backend

Configure `backend/.env` with `DATABASE_URL` and `JWT_SECRET`, then start the API:

```bash
cd ../backend
npm run dev
```

The API defaults to `http://localhost:8000/api`.

### 5. Run the Development Server

Start the Next.js development server:

```bash
npm run dev

```

### 6. View the App

Open your browser and navigate to:
👉 **[http://localhost:3000](http://localhost:3000)**

You should see the 3D animated landing page. Click **"Explore Command Center"** to enter the main dashboard.

---

## 📁 Project Structure Overview

Here is a quick guide to where everything lives so you can navigate the codebase easily:

* **`app/`**: Contains the Next.js routing logic.
* `app/page.tsx`: The public 3D landing page.
* `app/(dashboard)/`: The main authenticated app shell (Sidebar, TopBar) and all dashboard routes (`/dashboard`, `/live-cameras`, `/vehicles`, etc.).


* **`components/`**: Reusable UI elements.
* `/ui`: The core design system (GlassCard, StatCard, etc.).
* `/map`: Leaflet map components.
* `/three`: React Three Fiber components for the 3D background.


* **`services/`**: The typed data-fetching layer wrapping TanStack Query and the backend REST API.
* **`store/`**: Zustand stores for handling lightweight global UI state (like collapsing the sidebar).
* **`lib/`**: Utility functions (like class merging via `clsx` and `tailwind-merge`) and global providers.

---

## ⚠️ Troubleshooting & Tips

* **Blank Map / Map Rendering Issues:** Leaflet requires the browser's `window` object. If you make edits to the map components, ensure they are dynamically imported with `ssr: false`.
* **Styling Looks Broken (White Boxes):** This project uses highly customized Tailwind tokens. If you notice styles glitching after pulling new code, stop the server (`CTRL + C`) and restart it with `npm run dev` to clear the Turbopack cache.
* **Navigation:** Currently, clicking on a vehicle in the `/vehicles` "Recent Vehicles" list will automatically route you to that specific vehicle's animated trajectory map.

```

```
