import ReactDOM from 'react-dom/client';
import './index.css';

const App = () => {
  return (
    <div style={{ padding: '16px', width: '300px', fontFamily: 'sans-serif' }}>
      <h2>Kick Your Ads</h2>
      <p>你有 <strong>23 封</strong> 來自 <strong>Amazon</strong> 的廣告信。</p>
      <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
        <button style={{ padding: '8px', flex: 1 }}>🗑 一鍵刪除</button>
        <button style={{ padding: '8px', flex: 1 }}>🚫 一鍵退訂</button>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
