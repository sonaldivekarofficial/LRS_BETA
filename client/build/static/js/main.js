const { useState, useEffect } = React;

const App = () => {
  const [page, setPage] = useState('landing');

  if (page === 'landing') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #eff6ff, #dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '48rem' }}>
          <h1 style={{ fontSize: '4rem', fontWeight: '900', color: '#0f172a', marginBottom: '1.5rem' }}>
            Life Resonance Schema (LRS)
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#475569', marginBottom: '3rem' }}>
            Discover your core psychological patterns and receive a personalized 4-week action plan.
          </p>
          <button 
            onClick={() => setPage('test')}
            style={{ padding: '1.5rem 3rem', background: '#4f46e5', color: 'white', fontSize: '1.5rem', fontWeight: 'bold', borderRadius: '9999px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', cursor: 'pointer' }}
          >
            Start Assessment →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '4rem', textAlign: 'center' }}>
      <h2 style={{ fontSize: '3rem', fontWeight: '900' }}>Test Page - React is Working!</h2>
      <p>If you see this, the app is fixed.</p>
      <button onClick={() => setPage('landing')}>Back</button>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
