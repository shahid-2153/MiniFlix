# 🎬 MiniFlix

MiniFlix is a responsive, frontend-only media catalogue built with HTML, CSS and vanilla JavaScript.

## Features

- Responsive landing, catalogue, category and player pages
- Demo account registration and sign-in stored in the current browser
- PBKDF2 password hashing through the browser Web Crypto API
- Demo verification flow with a clearly labelled on-screen code
- Search and a browser-local **My List**
- One JSON catalogue shared by the home page, category pages and player

## Run the project

Serve the repository root with a static web server, or deploy it to GitHub Pages, Cloudflare Pages or another static host. The authentication flow uses Web Crypto, so use HTTPS (or localhost) rather than opening the HTML files directly.

## Important limitations

This is a learning/demo project, not a production streaming service.

- Registration and sign-in are local to the browser and device. There is no server-side user database or session validation.
- Passwords are hashed before local storage, but client-side storage can be edited by the user. This does **not** replace secure backend authentication.
- The verification code is displayed on the page for demonstration. No email is sent.
- The repository currently contains poster images but no video files. The player will explain when a title's media is missing instead of pretending it can play.
- No paid streaming catalogue, DRM, payment flow or real notification service is included.

## Add video files

1. Add your own video file to a folder such as `assets/videos/`.
2. Open `data/videos.json`.
3. Set that title's `source` to a repository-relative path, for example `assets/videos/example.mp4`.
4. Commit and deploy the changes.

Each catalogue item uses this shape:

```json
{
  "id": "example-title",
  "title": "Example Title",
  "category": "movies",
  "categoryLabel": "Movie",
  "thumbnail": "assets/images/AVATAR.jpg",
  "source": "assets/videos/example.mp4"
}
```

## Main structure

- `index.html` — loading screen and entry point
- `MiniFlix.html` — landing and sign-up email form
- `Register.html`, `OTP.html`, `Login.html` — demo account flow
- `Home.html` — main catalogue
- `pagtes/` — category pages
- `Video-Player.html` — HTML5 media player
- `assets/js/app.js` — shared authentication, catalogue and player logic
- `assets/css/home.css` — shared catalogue styling
- `data/videos.json` — title metadata and media paths
