// One formatter per zone, made once and reused. Building a new
// Intl.DateTimeFormat on every request leaks native (ICU) memory that the
// garbage collector never sees, and on Render's 512 MB instance that grew
// until the server was killed. Keys are lowercased because zone names are
// case-insensitive, so the map holds at most one entry per real zone; invalid
// zones throw before they're stored.
const formatters = new Map();

const formatterFor = (timeZone) => {
  const key = timeZone.toLowerCase();
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    formatters.set(key, formatter);
  }
  return formatter;
};

// The user's calendar date ("YYYY-MM-DD") in an IANA time zone, or null if
// the zone isn't valid. en-CA formats dates as YYYY-MM-DD.
export const dayIn = (timeZone, date = new Date()) => {
  try {
    return formatterFor(timeZone).format(date);
  } catch {
    return null;
  }
};

// Sets req.today from the X-Time-Zone header the client sends (its
// Intl.DateTimeFormat().resolvedOptions().timeZone), so XP lands on the
// user's own "today" and the streak follows their days. Missing or invalid
// zones fall back to UTC.
export const localDay = (req, _res, next) => {
  const zone = req.get("X-Time-Zone");
  req.today = (zone && zone.length <= 64 && dayIn(zone)) || dayIn("UTC");
  next();
};
