# 🎬 MiniFlix

<p align="center">
  <strong>A cinematic, responsive media-catalogue experience built with HTML, CSS and vanilla JavaScript.</strong>
  <br />
  Browse movies, anime, TV shows and web series through a custom multi-page interface.
</p>

<p align="center">
  <a href="https://miniflix-4zd.pages.dev/">Live Demo</a> ·
  <a href="https://github.com/shahid-2153/MiniFlix">Source Code</a>
</p>

---

## ✨ Overview

MiniFlix is a personal frontend project exploring the experience of a modern streaming-platform interface. It brings together a landing page, account-flow screens, content categories and a dedicated video-player page.

The current website is a **static frontend prototype**. Its catalogue and demo account flow run in the browser; production authentication, connected user data and real video delivery are still planned.

## 🖥️ Features

- **Multi-page experience** — landing, registration, verification, login, catalogue and player pages.
- **Content categories** — separate browsing pages for movies, anime, TV shows and web series.
- **Responsive interface** — layouts designed for desktop and mobile screens.
- **Browser-based demo accounts** — registration and sign-in prototype using the Web Crypto API with PBKDF2 password hashing.
- **Demo verification flow** — an on-screen verification code for demonstrating the account journey; it does not send an email.
- **Catalogue data** — a JSON file holds the current title, thumbnail and media-source references.
- **Player page** — a dedicated HTML5 video-player interface for titles with an available media source.

## 🧰 Tech Stack

| Technology | Use |
| --- | --- |
| HTML5 | Page structure and media interface |
| CSS3 | Layout, styling and responsive design |
| JavaScript | UI behaviour, catalogue and demo account flow |
| Web Crypto API | PBKDF2 password hashing in the browser |
| JSON | Catalogue metadata |
| Cloudflare Pages | Static website hosting |
| Supabase | Database foundation for planned backend integration |

## 🗂️ Project Structure

```text
MiniFlix/
├── assets/
│   ├── css/              # Stylesheets
│   ├── images/           # Posters, logos and visual assets
│   └── js/
│       └── app.js        # Shared frontend logic
├── data/
│   └── videos.json       # Current catalogue metadata
├── pagtes/
│   ├── animes.html
│   ├── movies.html
│   ├── tvshow.html
│   ├── web.html
│   └── ...               # Additional page files
├── index.html            # Entry/loading page
├── MiniFlix.html         # Landing page
├── Register.html         # Demo registration
├── OTP.html              # Demo verification
├── Login.html            # Demo login
├── Home.html             # Main catalogue
├── Video-Player.html     # Video-player page
└── README.md
```

## 🚀 Run Locally

Because MiniFlix uses browser APIs and relative asset paths, run it through a local web server rather than opening the HTML files directly.

For example, with the VS Code **Live Server** extension:

1. Clone the repository.
   ```bash
   git clone https://github.com/shahid-2153/MiniFlix.git
   ```
2. Open the project folder in VS Code.
3. Start Live Server from `index.html`.
4. Open the local URL shown by the extension.

You can also deploy the repository as a static site using Cloudflare Pages or another static hosting provider.

## 🗃️ Backend Foundation

A separate Supabase project has been created for MiniFlix in the Mumbai region (`ap-south-1`). Its initial database schema has been applied and verified.

The database currently contains 10 tables:

| Table | Purpose |
| --- | --- |
| `profiles` | User profiles and roles |
| `genres` | Content categories |
| `movies` | Movie metadata |
| `series` | Anime and TV-series metadata |
| `seasons` | Series seasons |
| `episodes` | Episode metadata |
| `movie_genres` | Movie-to-genre relationships |
| `series_genres` | Series-to-genre relationships |
| `watch_history` | User playback progress |
| `watchlist` | User-saved titles |

Row Level Security (RLS) is enabled on all 10 tables. The database is a **backend foundation only** at this stage: the current deployed frontend has not yet been connected to it, and the browser-based demo account flow remains separate.

## 🎞️ Video & Catalogue Notes

The current catalogue is stored in `data/videos.json`. Each entry contains a title, thumbnail path and media-source reference.

Example:

```json
{
  "title": "Example Title",
  "thumbnail": "/img/example-poster.jpg",
  "source": "../TRAILERS/example-video.mp4"
}
```

The media paths are references, not proof that the corresponding video files are included or hosted. **No real video library has been uploaded to Cloudflare, and production streaming is not implemented yet.**

Only add media that you own or are licensed to use.

## 🛣️ Roadmap

- [x] Build the multi-page frontend and responsive catalogue interface
- [x] Add browser-based demo registration and login flow
- [x] Create the Supabase project
- [x] Design and verify the initial 10-table database schema
- [ ] Connect the frontend to Supabase Authentication
- [ ] Load catalogue content from the database
- [ ] Add persistent watchlists and watch history
- [ ] Build an admin workflow for managing catalogue content
- [ ] Set up video storage and streaming as the final phase

## ⚠️ Current Project Status

MiniFlix is a work in progress and is **not yet a production streaming service**.

- Demo accounts are stored locally in the browser and are not shared across devices.
- The verification code is displayed in the demo flow; no email delivery is configured.
- Supabase is provisioned and its schema is ready, but frontend integration is pending.
- Real video hosting, streaming infrastructure, DRM, subscriptions and payments are not implemented.

---

<p align="center">
  Made with 🎬 and code.
</p>
