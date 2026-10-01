function Loader({ label = "Loading…", fullscreen = false }) {
  return (
    <div
      className={`page-loader ${fullscreen ? "fullscreen" : ""}`}
      role="status"
      aria-live="polite"
    >
      <div className="spinner" />
      <span>{label}</span>
    </div>
  );
}

export default Loader;
