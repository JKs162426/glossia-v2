// Loads `url` as a fresh page: every bit of in-memory state starts over.
// Its own module so tests can replace it (jsdom can't navigate).
export const reloadAt = (url) => window.location.replace(url);
