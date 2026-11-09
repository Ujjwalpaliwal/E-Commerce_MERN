export default function Loader({ label = "Loading..." }) {
  return (
    <div className="loader" role="status" aria-live="polite">
      <span className="spinner" />
      <span>{label}</span>
    </div>
  );
}
