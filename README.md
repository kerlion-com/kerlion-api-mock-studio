# KERLION API Mock Studio

**Build and test REST API response examples in your browser — before the backend is ready.**

KERLION API Mock Studio is a free, open-source, browser-based workspace for defining REST-style endpoints, creating JSON response bodies, and testing how requests match those endpoint definitions.

<p align="center">
  <img src="assets/social-preview.png" alt="KERLION API Mock Studio social preview" width="100%">
</p>

**Official website:** https://www.kerlionvip.com  
**GitHub:** https://github.com/kerlion-com/kerlion-api-mock-studio

## Features

- Create, edit, search, and delete mock endpoint definitions.
- Configure GET, POST, PUT, PATCH, and DELETE routes.
- Use path parameters such as `/api/users/:id`.
- Set common HTTP response status codes.
- Define JSON response bodies and optional response headers.
- Test request matching in the built-in local playground.
- Import and export portable workspace files as JSON.
- Responsive interface for desktop and mobile.
- No account, build step, backend, or third-party JavaScript dependency.

## Important scope note

**The first release simulates request matching inside the browser interface. It does not start a real HTTP server, expose network endpoints, or provide shareable API URLs.** The request playground shows the response that a configured mock route would return. A network-accessible mock server may be considered as a separate future capability.

## Run locally

No installation or build process is required.

1. Clone or download this repository.
2. Open `index.html` in a modern browser.
3. Select an example endpoint or create a new one.
4. Edit its method, path, status, response JSON, and headers.
5. Use **Send request** to test route matching.
6. Use **Export** to download your workspace as a JSON file.

You can also serve the folder with any static web server. All application files are static assets.

## Route examples

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/users` | Return a users collection |
| POST | `/api/users` | Return a created-user example |
| GET | `/api/users/:id` | Match a user ID path parameter |
| GET | `/api/products` | Return a products collection |

Route parameters match one non-empty path segment. Query strings and URL fragments are not part of route definitions in this release.

## Workspace format

Exported files use this structure:

```json
{
  "format": "kerlion-api-mock-studio",
  "version": 1,
  "endpoints": [
    {
      "id": "users-list",
      "name": "List users",
      "method": "GET",
      "path": "/api/users",
      "status": 200,
      "body": {
        "data": []
      },
      "headers": [
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ]
    }
  ]
}
```

The importer validates the file format, endpoint methods, paths, status codes, and header values. Workspaces are limited to 200 endpoints per import.

## Privacy

- Endpoint definitions and response examples stay in the current browser page.
- The application does not upload workspace data to a KERLION server.
- Exported JSON files are saved only when you choose Export.
- Do not put passwords, access tokens, or real personal data in sample responses.

## Project structure

```text
kerlion-api-mock-studio/
├── assets/
│   └── favicon.svg
├── index.html
├── styles.css
├── app.js
├── tests.js
├── README.md
└── LICENSE
```

## Tests

The project includes lightweight browser-console tests for path normalization, route matching, and endpoint validation.

1. Open `index.html`.
2. Open the browser developer console.
3. Load `tests.js) in the same page context (for example, by temporarily adding `<script src="tests.js"></script>` after `app.js` in `index.html`).
4. Confirm that all tests pass.

The test file is kept separate from the normal application runtime.

## Browser support

The project uses modern browser APIs including the File API, Blob, URL object URLs, and `crypto.randomUUID` when available (with a fallback for endpoint IDs). Use a current version of Chrome, Edge, Firefox, or Safari.

## License

This project is released under the [MIT License](LICENSE).

## About KERLION

KERLION is an independent digital platform focused on technology, web development, developer resources, digital tools, and practical software projects.

Website: https://www.kerlionvip.com  
GitHub: https://github.com/kerlion-com

**Explore Tools. Share Knowledge. Build Better Solutions.**
