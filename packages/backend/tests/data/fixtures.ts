export const simplePageHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Test Page</title>
  <link rel="stylesheet" href="/styles/main.css">
  <script src="/scripts/app.js"></script>
</head>
<body>
  <h1>Welcome to Test Page</h1>
  <img src="/images/logo.png" alt="Logo">
  <img srcset="/images/hero-1x.jpg 1x, /images/hero-2x.jpg 2x" alt="Hero">
  <form action="/login" method="post">
    <input type="text" name="username">
    <input type="password" name="password">
    <button type="submit">Login</button>
  </form>
</body>
</html>`;

export const complexPageHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Complex Page</title>
  <base href="https://example.com/app/">
  <link rel="stylesheet" href="styles/main.css">
  <link rel="icon" href="/favicon.ico">
  <link rel="apple-touch-icon" href="/apple-icon.png">
  <style>
    body { background-image: url('/images/bg.jpg'); }
    .header { background: url(/images/header-bg.png) no-repeat; }
  </style>
</head>
<body>
  <div style="background-image: url('/images/inline-bg.jpg')">
    <img src="images/logo.svg" alt="Logo">
    <img srcset="images/photo-300.jpg 300w, images/photo-600.jpg 600w" sizes="100vw" alt="Photo">
    <video poster="/images/poster.jpg" src="/videos/intro.mp4"></video>
    <source src="/media/backup.mp4">
    <form action="submit" method="post">
      <input type="email" name="email">
    </form>
  </div>
</body>
</html>`;

export const noAssetsPageHtml = `<!DOCTYPE html>
<html>
<head>
  <title>No Assets Page</title>
</head>
<body>
  <h1>Simple Content</h1>
  <p>No external assets referenced.</p>
  <a href="#section1">Jump to section</a>
  <a href="javascript:void(0)">JS Link</a>
  <a href="mailto:test@example.com">Email</a>
  <form action="/submit" method="post">
    <input type="text" name="field">
  </form>
</body>
</html>`;

export const cssContent = `
body { margin: 0; background: url('/images/bg.jpg'); }
.icon { background-image: url('/images/icon.png'); }
@import url('/fonts/custom.woff2');
.header { font-family: 'Custom', sans-serif; }
`;

export const sampleJobOutput = {
  siteImportId: "test-import-id",
  html: simplePageHtml,
  finalUrl: "https://example.com",
  stats: {
    discovered: 5,
    downloaded: 5,
    failed: 0,
    skipped: 0,
  },
  warnings: [],
};
