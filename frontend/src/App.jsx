import { useState } from 'react';
import './App.css';

const API_URL = window.__ENV__?.API_URL || 'http://localhost:3000';

export default function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState('');
  const [links, setLinks] = useState([]); // session history, newest first

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/shorten`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      setLinks((prev) => [{ ...data, original_url: url }, ...prev]);
      setUrl('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(shortUrl, code) {
    navigator.clipboard.writeText(shortUrl).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(''), 1500);
    });
  }

  return (
    <div className="page">
      <div className="card">
        <h1>
          Short<span className="accent">Link</span>
        </h1>
        <p className="subtitle">Paste a long URL, get a short one back.</p>

        <form onSubmit={handleSubmit} className="form">
          <input
            type="url"
            required
            placeholder="https://example.com/a/very/long/path"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={loading || !url}>
            {loading ? <span className="spinner" /> : 'Shorten'}
          </button>
        </form>

        {error && <p className="error">{error}</p>}

        {links.length > 0 && (
          <ul className="link-list">
            {links.map((link) => (
              <li key={link.code} className="link-item">
                <div className="link-info">
                  <a href={link.short_url} target="_blank" rel="noreferrer">
                    {link.short_url}
                  </a>
                  <span className="original" title={link.original_url}>
                    {link.original_url}
                  </span>
                </div>
                <button
                  className="copy-btn"
                  onClick={() => handleCopy(link.short_url, link.code)}
                >
                  {copiedCode === link.code ? 'Copied' : 'Copy'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
