# Plan Together

A small, mobile-friendly invitation made for Judy. It is a static site designed
for GitHub Pages.

The original Judy invitation remains at the site root. A reusable invitation template
is available at `invite/`; set the recipient by changing only the `name` query parameter:

```text
https://penglongzhaochina.github.io/plan-together/invite/?name=Yuxiao
```

For another person, replace `Yuxiao` in the URL. Each name gets separate browser storage,
so one invitation cannot overwrite another invitation's progress.

## How it works

1. Judy opens the invitation and accepts the date.
2. She chooses one or more possible dates and times.
3. She chooses activities such as pickleball, dinner, or coffee.
4. Her response is emailed to the inviter through FormSubmit.
5. The site reveals a wedding-invitation-style "佳期已定" confirmation.

No custom backend or database is used. FormSubmit receives the selected date, activities,
and optional note to deliver the email.

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
