# Plan Together

A small, mobile-friendly website for finding a date, time, and activity that works
for friends. It is a static site designed for GitHub Pages.

## How it works

1. The first person adds their available dates and times.
2. They choose activities such as pickleball, dinner, or coffee.
3. The site creates an invite link containing their response.
4. A friend opens the link, adds their response, and sends the updated link back.
5. The result shows overlapping times and activities everyone selected.

No backend or database is used. Responses are encoded in the URL fragment, which
browsers do not send to the web server. Anyone who receives the link can still read
the plan, so the link should be shared only with trusted participants.

## Run locally

Because the JavaScript uses ES modules, serve the directory instead of opening the
HTML files directly:

```powershell
npx --yes serve .
```

Then open the local address printed by the command.

## Test

```powershell
npm test
npm run check
```

## Publish on GitHub Pages

1. Create a public GitHub repository named `plan-together`.
2. Push this project to its `main` branch.
3. In the repository, open **Settings > Pages**.
4. Under **Build and deployment**, choose **GitHub Actions**.
5. The included workflow tests and publishes the website.

