import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="page container section">
      <div className="empty-state">
        <h1>404</h1>
        <p>That page does not exist.</p>
        <Link to="/" className="btn btn--primary">
          Back home
        </Link>
      </div>
    </div>
  );
}
