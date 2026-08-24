# Plan Together

A small, mobile-friendly invitation made for Judy. It is a static site designed
for GitHub Pages.

## How it works

1. Judy opens the invitation and accepts the date.
2. She chooses one or more possible dates and times.
3. She chooses activities such as pickleball, dinner, or coffee.
4. The site reveals a wedding-invitation-style "佳期已定" confirmation.
5. Judy shares the generated reply link so the inviter can see her choices.

No backend or database is used. Judy's reply is encoded in the URL fragment, which
browsers do not send to the web server. Anyone who receives the link can still read
the reply, so the link should be shared only with the inviter.

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
