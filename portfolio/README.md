# Aman — portfolio

A one-page personal site in plain HTML, CSS and a little JavaScript. No build step, no frameworks.

```
portfolio/
├── index.html    all the text and sections
├── style.css     colours, fonts and layout
├── script.js     menu, active link, hero waveform, contact form
└── assets/       photos (swap these for your own)
```

## Preview it on your computer

Double-click `index.html`, or run a tiny local server from this folder:

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080.

## Edit the text

All words live in `index.html`. Each section starts with a comment like `<!-- ============ 4. PROJECTS ============ -->`, so search for the section name and edit the text between the tags. Anything marked `PLACEHOLDER` in a comment is a value you should check or replace.

- **Add a project:** in the Projects section there is a commented template. Copy it, remove the `<!--` and `-->`, fill it in, and add the screenshot to `assets/`.
- **Add a recording:** in the Music section there is a commented YouTube and audio example. Replace the `embed-slot` block with one of them.
- **Change colours:** edit the variables at the top of `style.css` (`--blue`, `--navy`, `--pale`).

## Swap the photos

Replace these files in `assets/` with your own, **keeping the same file names**, and nothing else needs to change:

| File | Used for | Best size |
| --- | --- | --- |
| `profile.jpg` | Hero photo | square, 800×800 |
| `project-school-portal.jpg` | Project screenshot | 1200×750 |
| `music-1.jpg` | Large music photo | 800×600 |
| `music-2.jpg`, `music-3.jpg` | Small music photos | 800×600 |

Tips: save photos as JPG under about 150 KB each (squoosh.app is free) so the page stays fast on mobile data. Then update each image's `alt` text in `index.html` to describe what's actually in your photo.

## Put it online for free

### GitHub Pages
1. Create a new public repository on GitHub, for example `portfolio`.
2. Upload the contents of this folder (`index.html`, `style.css`, `script.js`, `assets/`, this README) to the repository root.
3. Go to **Settings → Pages**, set **Source** to "Deploy from a branch", choose `main` and `/ (root)`, and save.
4. After a minute your site is live at `https://your-username.github.io/portfolio/`.

### Netlify
1. Sign in at app.netlify.com.
2. Open **Sites**, then drag this whole `portfolio` folder onto the "Deploy manually" drop zone.
3. Netlify gives you a live link straight away. You can rename it under **Site configuration → Change site name**.

To update the site later, re-upload the changed files (GitHub) or drag the folder in again (Netlify).
