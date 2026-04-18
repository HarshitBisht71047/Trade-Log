const { useState, useEffect, useRef, useCallback } = React;

// ---- STORAGE ----
function loadUsers() { try { return JSON.parse(localStorage.getItem('tj_users') || '[]'); } catch { return []; } }
function saveUsers(u) { localStorage.setItem('tj_users', JSON.stringify(u)); }
function loadTrades(uid) { try { return JSON.parse(localStorage.getItem('tj_trades_' + uid) || '[]'); } catch { return []; } }
function saveTrades(uid, t) { localStorage.setItem('tj_trades_' + uid, JSON.stringify(t)); }
function loadSession() { try { return JSON.parse(localStorage.getItem('tj_session') || 'null'); } catch { return null; } }
function saveSession(u) { localStorage.setItem('tj_session', JSON.stringify(u)); }

// ---- HELPERS ----
const fmt = (v, decimals = 2) => {
  const n = parseFloat(v);
  if (isNaN(n)) return '—';
  return (n >= 0 ? '+' : '') + n.toFixed(decimals);
};
const fmtCurrency = (v, curr = '$') => {
  const n = parseFloat(v);
  if (isNaN(n)) return '—';
  return (n >= 0 ? '+' + curr : '-' + curr) + Math.abs(n).toFixed(2);
};
const fmtDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
};

const STRATEGIES = ['Breakout', 'Reversal', 'Trend Follow', 'Scalp', 'Swing', 'News Play', 'Options Play'];
const MARKETS = ['Equity', 'Crypto', 'Forex', 'Futures', 'Options', 'Commodity'];
const EMOTIONS = ['Confident', 'FOMO', 'Disciplined', 'Revenge Trade', 'Patient', 'Anxious', 'Overtrading'];

// ---- AUTH ----
function AuthPage({ onLogin }) {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');

  const handle = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const hashPass = async (pass) => {
    const msgBuffer = new TextEncoder().encode(pass);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const submit = async () => {
    setErr('');
    const users = loadUsers();
    if (tab === 'signup') {
      if (!form.name || !form.email || !form.password) return setErr('Please fill all fields');
      if (users.find(u => u.email === form.email)) return setErr('Email already registered');
      const hashedPw = await hashPass(form.password);
      const user = { id: Date.now().toString(), name: form.name, email: form.email, password: hashedPw, avatar: form.name[0].toUpperCase() };
      saveUsers([...users, user]);
      saveSession(user);
      onLogin(user);
    } else {
      if (!form.email || !form.password) return setErr('Please fill all fields');
      const hashedPw = await hashPass(form.password);
      const user = users.find(u => u.email === form.email && (u.password === hashedPw || u.password === form.password));
      if (!user) return setErr('Invalid email or password');
      saveSession(user);
      onLogin(user);
    }
  };

  const guestLogin = () => {
    const users = loadUsers();
    let user = users.find(u => u.email === 'guest@tradelog.io');
    if (!user) {
      user = { id: 'guest_demo', name: 'Demo Trader', email: 'guest@tradelog.io', avatar: 'guest', isGuest: true };
      saveUsers([...users, user]);
      
      const demoTrades = [
        { id: 'd1', symbol: 'TSLA', type: 'Long', market: 'Equity', strategy: 'Breakout', entry: '180.50', exit: '185.00', qty: '100', pnl: '450.00', date: new Date(Date.now() - 86400000*3).toISOString().split('T')[0], reason: 'Broke pre-market high with volume', tags: ['Breakout'], emotions: ['Confident'] },
        { id: 'd2', symbol: 'BTCUSD', type: 'Short', market: 'Crypto', strategy: 'Reversal', entry: '64000', exit: '65200', qty: '0.5', pnl: '-600.00', date: new Date(Date.now() - 86400000*2).toISOString().split('T')[0], reason: 'Double top rejection', tags: ['Reversal'], emotions: ['FOMO'] },
        { id: 'd3', symbol: 'AAPL', type: 'Long', market: 'Equity', strategy: 'Trend Follow', entry: '170.20', exit: '173.00', qty: '200', pnl: '560.00', date: new Date(Date.now() - 86400000*1).toISOString().split('T')[0], reason: 'Riding the 20 EMA', tags: ['Trend Follow'], emotions: ['Patient'] },
        { id: 'd4', symbol: 'EURUSD', type: 'Short', market: 'Forex', strategy: 'Scalp', entry: '1.0850', exit: '1.0840', qty: '100000', pnl: '100.00', date: new Date().toISOString().split('T')[0], reason: 'Quick scalp on minor resistance', tags: ['Scalp'], emotions: ['Disciplined'] }
      ];
      saveTrades(user.id, demoTrades);
    }
    saveSession(user);
    onLogin(user);
  };

  return React.createElement('div', { className: 'auth-wrap' },
    React.createElement('div', { className: 'auth-bg' }),
    React.createElement('div', { className: 'auth-card' },
      React.createElement('div', { className: 'auth-logo' }, 'Trade', React.createElement('span', null, 'Log')),
      React.createElement('div', { className: 'auth-sub' }, 'Your edge starts with clarity.'),
      React.createElement('div', { className: 'auth-tabs' },
        ['login', 'signup'].map(t => React.createElement('button', { key: t, className: 'auth-tab' + (tab === t ? ' active' : ''), onClick: () => { setTab(t); setErr(''); } }, t === 'login' ? 'Sign In' : 'Sign Up'))
      ),
      tab === 'signup' && React.createElement('div', { className: 'field' },
        React.createElement('label', null, 'Full Name'),
        React.createElement('input', { placeholder: 'Your name', value: form.name, onChange: handle('name') })
      ),
      React.createElement('div', { className: 'field' },
        React.createElement('label', null, 'Email'),
        React.createElement('input', { type: 'email', placeholder: 'you@example.com', value: form.email, onChange: handle('email') })
      ),
      React.createElement('div', { className: 'field' },
        React.createElement('label', null, 'Password'),
        React.createElement('input', { type: 'password', placeholder: '••••••••', value: form.password, onChange: handle('password'), onKeyDown: e => e.key === 'Enter' && submit() })
      ),
      err && React.createElement('div', { style: { color: '#f87171', fontSize: '0.82rem', marginBottom: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(248,113,113,0.08)', borderRadius: '6px' } }, err),
      React.createElement('button', { className: 'btn-primary', onClick: submit }, tab === 'login' ? 'Sign In' : 'Create Account'),
      React.createElement('div', { className: 'divider' }, 'or'),
      React.createElement('button', { className: 'btn-guest', onClick: guestLogin },
        React.createElement('i', { className: 'ph ph-user', style: { fontSize: '1.1rem' } }), ' Continue as Guest (Demo)'
      )
    )
  );
}

// ---- CHARTS ----
function LineChartComponent({ trades, currency }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date));
    let cum = 0;
    const labels = sorted.map(t => fmtDate(t.date));
    const data = sorted.map(t => { cum += parseFloat(t.pnl || 0); return parseFloat(cum.toFixed(2)); });
    if (labels.length === 0) { labels.push('No data'); data.push(0); }

    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Equity Curve',
          data,
          borderColor: data[data.length - 1] >= 0 ? '#4ade80' : '#f87171',
          backgroundColor: data[data.length - 1] >= 0 ? 'rgba(74,222,128,0.07)' : 'rgba(248,113,113,0.07)',
          fill: true,
          tension: 0.4,
          pointRadius: data.length > 20 ? 0 : 3,
          pointBackgroundColor: '#4ade80',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { backgroundColor: '#13161e', borderColor: '#2a2e3a', borderWidth: 1, titleColor: '#8a91a8', bodyColor: '#e8eaf0', callbacks: { label: ctx => fmtCurrency(ctx.raw, currency) } } },
        scales: { x: { ticks: { color: '#555c73', font: { size: 11 }, maxTicksLimit: 8 }, grid: { color: 'rgba(255,255,255,0.04)' } }, y: { ticks: { color: '#555c73', font: { size: 11 }, callback: v => currency + v }, grid: { color: 'rgba(255,255,255,0.04)' } } }
      }
    });
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [trades]);

  return React.createElement('div', { className: 'chart-wrap', style: { height: '220px' } },
    React.createElement('canvas', { ref: canvasRef, role: 'img', 'aria-label': 'Equity curve over time' }, 'Equity curve chart')
  );
}

function PnLBarChart({ trades, currency }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const sorted = [...trades].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-15);
    const labels = sorted.map(t => t.symbol);
    const data = sorted.map(t => parseFloat(t.pnl || 0));
    const colors = data.map(v => v >= 0 ? 'rgba(74,222,128,0.75)' : 'rgba(248,113,113,0.75)');

    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderRadius: 4 }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { backgroundColor: '#13161e', borderColor: '#2a2e3a', borderWidth: 1, callbacks: { label: ctx => fmtCurrency(ctx.raw, currency) } } },
        scales: { x: { ticks: { color: '#555c73', font: { size: 11 }, autoSkip: false, maxRotation: 45 }, grid: { display: false } }, y: { ticks: { color: '#555c73', font: { size: 11 }, callback: v => currency + v }, grid: { color: 'rgba(255,255,255,0.04)' } } }
      }
    });
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [trades]);

  return React.createElement('div', { className: 'chart-wrap', style: { height: '220px' } },
    React.createElement('canvas', { ref: canvasRef, role: 'img', 'aria-label': 'PnL per trade bar chart' }, 'PnL per trade chart')
  );
}

function DonutChart({ trades }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const wins = trades.filter(t => parseFloat(t.pnl) > 0).length;
    const losses = trades.filter(t => parseFloat(t.pnl) <= 0).length;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new Chart(canvasRef.current, {
      type: 'doughnut',
      data: { labels: ['Wins', 'Losses'], datasets: [{ data: [wins || 1, losses || 1], backgroundColor: ['rgba(74,222,128,0.8)', 'rgba(248,113,113,0.7)'], borderWidth: 0, hoverOffset: 4 }] },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '65%',
        plugins: { legend: { display: false }, tooltip: { backgroundColor: '#13161e', borderColor: '#2a2e3a', borderWidth: 1, bodyColor: '#e8eaf0' } }
      }
    });
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [trades]);

  const wins = trades.filter(t => parseFloat(t.pnl) > 0).length;
  const winRate = trades.length ? ((wins / trades.length) * 100).toFixed(0) : 0;

  return React.createElement('div', { style: { position: 'relative' } },
    React.createElement('div', { className: 'chart-wrap', style: { height: '180px' } },
      React.createElement('canvas', { ref: canvasRef, role: 'img', 'aria-label': 'Win/Loss donut chart' }, 'Win vs loss chart')
    ),
    React.createElement('div', { style: { textAlign: 'center', marginTop: '0.75rem' } },
      React.createElement('div', { style: { display: 'flex', justifyContent: 'center', gap: '1.25rem', fontSize: '0.78rem', color: 'var(--text2)' } },
        React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: '5px' } }, React.createElement('span', { style: { width: 9, height: 9, borderRadius: 2, background: 'rgba(74,222,128,0.8)', display: 'inline-block' } }), 'Wins ' + wins),
        React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: '5px' } }, React.createElement('span', { style: { width: 9, height: 9, borderRadius: 2, background: 'rgba(248,113,113,0.7)', display: 'inline-block' } }), 'Losses ' + (trades.length - wins))
      )
    )
  );
}

function StrategyChart({ trades, currency }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const strats = {};
    trades.forEach(t => {
      if (!t.strategy) return;
      strats[t.strategy] = (strats[t.strategy] || 0) + parseFloat(t.pnl || 0);
    });
    const labels = Object.keys(strats);
    const data = labels.map(k => parseFloat(strats[k].toFixed(2)));
    const colors = data.map(v => v >= 0 ? 'rgba(96,165,250,0.75)' : 'rgba(251,191,36,0.75)');

    if (chartRef.current) chartRef.current.destroy();
    if (labels.length === 0) return;
    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderRadius: 4 }] },
      options: {
        responsive: true, maintainAspectRatio: false, indexAxis: 'y',
        plugins: { legend: { display: false }, tooltip: { backgroundColor: '#13161e', borderColor: '#2a2e3a', borderWidth: 1, callbacks: { label: ctx => fmtCurrency(ctx.raw, currency) } } },
        scales: { x: { ticks: { color: '#555c73', font: { size: 11 }, callback: v => currency + v }, grid: { color: 'rgba(255,255,255,0.04)' } }, y: { ticks: { color: '#8a91a8', font: { size: 11 } }, grid: { display: false } } }
      }
    });
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [trades]);

  return React.createElement('div', { className: 'chart-wrap', style: { height: Math.max(160, Object.keys(trades.reduce((a, t) => { a[t.strategy || '?'] = 1; return a; }, {})).length * 40 + 60) + 'px' } },
    React.createElement('canvas', { ref: canvasRef, role: 'img', 'aria-label': 'PnL by strategy bar chart' }, 'PnL by strategy')
  );
}

function EmotionChart({ trades, currency }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const emotionsMap = {};
    trades.forEach(t => {
      if (!t.emotions || t.emotions.length === 0) return;
      t.emotions.forEach(e => {
        emotionsMap[e] = (emotionsMap[e] || 0) + parseFloat(t.pnl || 0);
      });
    });
    const labels = Object.keys(emotionsMap);
    const data = labels.map(k => parseFloat(emotionsMap[k].toFixed(2)));
    const colors = data.map(v => v >= 0 ? 'rgba(167,139,250,0.75)' : 'rgba(244,114,182,0.75)');

    if (chartRef.current) chartRef.current.destroy();
    if (labels.length === 0) return;
    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderRadius: 4 }] },
      options: {
        responsive: true, maintainAspectRatio: false, indexAxis: 'y',
        plugins: { legend: { display: false }, tooltip: { backgroundColor: '#13161e', borderColor: '#2a2e3a', borderWidth: 1, callbacks: { label: ctx => fmtCurrency(ctx.raw, currency) } } },
        scales: { x: { ticks: { color: '#555c73', font: { size: 11 }, callback: v => currency + v }, grid: { color: 'rgba(255,255,255,0.04)' } }, y: { ticks: { color: '#8a91a8', font: { size: 11 } }, grid: { display: false } } }
      }
    });
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [trades]);

  return React.createElement('div', { className: 'chart-wrap', style: { height: Math.max(160, Object.keys(trades.reduce((a, t) => { (t.emotions||[]).forEach(e => a[e]=1); return a; }, {})).length * 40 + 60) + 'px' } },
    React.createElement('canvas', { ref: canvasRef, role: 'img', 'aria-label': 'PnL by emotion bar chart' }, 'PnL by emotion')
  );
}

// ---- ADD TRADE FORM ----
function AddTrade({ user, onAdd, editingTrade, onUpdate, onCancelEdit, userStrats, userEms }) {
  const [form, setForm] = useState(editingTrade || { symbol: '', type: 'Long', market: 'Equity', strategy: '', entry: '', exit: '', stopLoss: '', takeProfit: '', qty: '', pnl: '', date: new Date().toISOString().split('T')[0], reason: '', emotion: '', notes: '', imageUrl: '' });
  const [tags, setTags] = useState(editingTrade ? (editingTrade.tags || []) : []);
  const [emotions, setEmotions] = useState(editingTrade ? (editingTrade.emotions || []) : []);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    if (editingTrade) {
      setForm(editingTrade);
      setTags(editingTrade.tags || []);
      setEmotions(editingTrade.emotions || []);
    } else {
      setForm({ symbol: '', type: 'Long', market: 'Equity', strategy: '', entry: '', exit: '', stopLoss: '', takeProfit: '', qty: '', pnl: '', date: new Date().toISOString().split('T')[0], reason: '', emotion: '', notes: '', imageUrl: '' });
      setTags([]); setEmotions([]);
    }
  }, [editingTrade]);

  const handle = (k) => (e) => {
    const v = e.target.value;
    setForm(f => {
      const next = { ...f, [k]: v };
      if ((k === 'entry' || k === 'exit' || k === 'qty' || k === 'type') && next.entry && next.exit && next.qty) {
        const diff = (parseFloat(next.exit) - parseFloat(next.entry)) * parseFloat(next.qty);
        next.pnl = isNaN(diff) ? '' : (next.type === 'Short' ? (-diff).toFixed(2) : diff.toFixed(2));
      }
      return next;
    });
  };

  const toggleTag = (t) => setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  const toggleEmotion = (e) => setEmotions(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setForm(f => ({ ...f, imageUrl: dataUrl }));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const submit = () => {
    if (!form.symbol || !form.date || form.pnl === '') {
      alert('Please fill out symbol, date, and ensure P&L is calculated.');
      return;
    }
    if (isNaN(parseFloat(form.pnl))) {
      alert('P&L must be a valid number.');
      return;
    }
    if (editingTrade) {
      onUpdate({ ...form, tags, emotions });
    } else {
      const trade = { ...form, id: Date.now().toString(), tags, emotions };
      onAdd(trade);
      setForm({ symbol: '', type: 'Long', market: 'Equity', strategy: '', entry: '', exit: '', stopLoss: '', takeProfit: '', qty: '', pnl: '', date: new Date().toISOString().split('T')[0], reason: '', emotion: '', notes: '', imageUrl: '' });
      setTags([]); setEmotions([]);
      setToast(true);
      setTimeout(() => setToast(false), 2500);
    }
  };

  let rrText = '—';
  if (form.entry && form.stopLoss && form.takeProfit) {
    const en = parseFloat(form.entry); const sl = parseFloat(form.stopLoss); const tp = parseFloat(form.takeProfit);
    if (form.type === 'Long' && en > sl && tp > en) {
      const risk = en - sl; const reward = tp - en;
      if (risk > 0) rrText = '1:' + (reward/risk).toFixed(2);
    } else if (form.type === 'Short' && sl > en && en > tp) {
      const risk = sl - en; const reward = en - tp;
      if (risk > 0) rrText = '1:' + (reward/risk).toFixed(2);
    }
  }

  return React.createElement('div', null,
    React.createElement('div', { className: 'form-card' },
      React.createElement('div', { className: 'page-header', style: { marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
        React.createElement('div', null,
          React.createElement('div', { className: 'page-title' }, editingTrade ? 'Edit Trade' : 'Log a Trade'),
          React.createElement('div', { className: 'page-sub' }, editingTrade ? 'Modify the details of your trade.' : 'Record your entry, reasoning, and outcome.')
        ),
        editingTrade && React.createElement('button', { className: 'btn-export', style: { marginLeft: 0 }, onClick: onCancelEdit }, 'Cancel Edit')
      ),
      React.createElement('div', { className: 'form-grid' },
        ['symbol', 'entry', 'stopLoss', 'takeProfit', 'exit', 'qty'].map(k => React.createElement('div', { className: 'form-field', key: k },
          React.createElement('label', null, k === 'symbol' ? 'Symbol' : k === 'entry' ? 'Entry' : k === 'stopLoss' ? 'Stop Loss' : k === 'takeProfit' ? 'Take Profit' : k === 'exit' ? 'Exit Price' : 'Quantity'),
          React.createElement('input', { type: k === 'symbol' ? 'text' : 'number', step: 'any', placeholder: k === 'symbol' ? 'e.g. BTC' : '0.00', value: form[k], onChange: handle(k) })
        )),
        React.createElement('div', { className: 'form-field' },
          React.createElement('label', null, 'Direction'),
          React.createElement('select', { value: form.type, onChange: handle('type') },
            ['Long', 'Short'].map(o => React.createElement('option', { key: o, value: o }, o))
          )
        ),
        React.createElement('div', { className: 'form-field' },
          React.createElement('label', null, 'Market'),
          React.createElement('select', { value: form.market, onChange: handle('market') },
            MARKETS.map(o => React.createElement('option', { key: o, value: o }, o))
          )
        ),
        React.createElement('div', { className: 'form-field' },
          React.createElement('label', null, 'Strategy'),
          React.createElement('select', { value: form.strategy, onChange: handle('strategy') },
            React.createElement('option', { value: '' }, 'Select...'),
            userStrats.map(o => React.createElement('option', { key: o, value: o }, o))
          )
        ),
        React.createElement('div', { className: 'form-field' },
          React.createElement('label', null, 'Date'),
          React.createElement('input', { type: 'date', value: form.date, onChange: handle('date') })
        ),
        React.createElement('div', { className: 'form-field' },
          React.createElement('label', null, 'P&L (auto-calculated)'),
          React.createElement('input', { value: form.pnl, onChange: handle('pnl'), placeholder: 'Auto or manual', style: { color: form.pnl > 0 ? 'var(--accent)' : form.pnl < 0 ? 'var(--red)' : 'var(--text)' } })
        ),
        React.createElement('div', { className: 'form-field' },
          React.createElement('label', null, 'Expected R:R'),
          React.createElement('input', { value: rrText, disabled: true, style: { background: 'transparent', border: 'none', paddingLeft: 0, color: 'var(--blue)', fontWeight: 'bold' } })
        ),
        React.createElement('div', { className: 'form-field form-full' },
          React.createElement('label', null, 'Setup Image (Upload from PC)'),
          React.createElement('input', { type: 'file', accept: 'image/*', onChange: handleImageUpload, style: { padding: '0.4rem', cursor: 'pointer' } }),
          form.imageUrl && React.createElement('div', { style: { marginTop: '0.75rem', position: 'relative', display: 'inline-block' } }, 
            React.createElement('img', { src: form.imageUrl, alt: 'Preview', style: { maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', border: '1px solid var(--border)' } }),
            React.createElement('button', { type: 'button', onClick: () => setForm(f => ({ ...f, imageUrl: '' })), style: { position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }, title: 'Remove Image' }, React.createElement('i', { className: 'ph ph-x' }))
          )
        ),
        React.createElement('div', { className: 'form-field form-full' },
          React.createElement('label', null, 'Reason for Trade'),
          React.createElement('textarea', { placeholder: 'What was your setup? Why did you enter?', value: form.reason, onChange: handle('reason') })
        ),
        React.createElement('div', { className: 'form-field form-full' },
          React.createElement('label', null, 'Strategy Tags'),
          React.createElement('div', { className: 'tag-row' },
            userStrats.map(t => React.createElement('span', { key: t, className: 'tag' + (tags.includes(t) ? ' selected' : ''), onClick: () => toggleTag(t) }, t))
          )
        ),
        React.createElement('div', { className: 'form-field form-full' },
          React.createElement('label', null, 'Emotional State'),
          React.createElement('div', { className: 'tag-row' },
            userEms.map(e => React.createElement('span', { key: e, className: 'tag' + (emotions.includes(e) ? ' selected' : ''), onClick: () => toggleEmotion(e) }, e))
          )
        ),
        React.createElement('div', { className: 'form-field form-full' },
          React.createElement('label', null, 'Notes / Lessons'),
          React.createElement('textarea', { placeholder: 'What did you learn? What would you do differently?', value: form.notes, onChange: handle('notes') })
        )
      ),
      React.createElement('button', { className: 'btn-submit', onClick: submit }, editingTrade ? 'Update Trade' : '+ Log Trade')
    ),
    toast && React.createElement('div', { className: 'toast' }, '✓ Trade logged successfully')
  );
}

function TradeDetailsModal({ trade, onClose, currency }) {
  const [enlarged, setEnlarged] = useState(false);

  if (!trade) return null;

  const en = parseFloat(trade.entry);
  const sl = parseFloat(trade.stopLoss);
  const tp = parseFloat(trade.takeProfit);
  const qty = parseFloat(trade.qty);
  const actualPnl = parseFloat(trade.pnl);

  let targetPnl = '—';
  let slPnl = '—';

  if (!isNaN(en) && !isNaN(qty)) {
    if (trade.type === 'Long') {
      if (!isNaN(tp)) targetPnl = ((tp - en) * qty).toFixed(2);
      if (!isNaN(sl)) slPnl = ((sl - en) * qty).toFixed(2);
    } else if (trade.type === 'Short') {
      if (!isNaN(tp)) targetPnl = ((en - tp) * qty).toFixed(2);
      if (!isNaN(sl)) slPnl = ((en - sl) * qty).toFixed(2);
    }
  }

  return React.createElement('div', { className: 'modal-overlay', onClick: onClose },
    React.createElement('div', { className: 'modal-content', onClick: e => e.stopPropagation() },
      React.createElement('button', { className: 'modal-close', onClick: onClose }, React.createElement('i', { className: 'ph ph-x' })),
      React.createElement('div', { className: 'modal-header' },
        React.createElement('div', { className: 'modal-title' },
          trade.symbol,
          React.createElement('span', { className: 'badge ' + (trade.type === 'Long' ? 'badge-long' : 'badge-short') }, trade.type)
        ),
        React.createElement('div', { style: { color: 'var(--text2)', fontSize: '0.85rem', marginTop: '0.4rem' } }, fmtDate(trade.date))
      ),
      React.createElement('div', { className: 'modal-grid' },
        React.createElement('div', null, React.createElement('div', { className: 'modal-label' }, 'Market'), React.createElement('div', { className: 'modal-value' }, trade.market || '—')),
        React.createElement('div', null, React.createElement('div', { className: 'modal-label' }, 'Strategy'), React.createElement('div', { className: 'modal-value' }, trade.strategy || '—')),
        React.createElement('div', null, React.createElement('div', { className: 'modal-label' }, 'Entry / Exit'), React.createElement('div', { className: 'modal-value' }, (trade.entry || '—') + ' → ' + (trade.exit || '—'))),
        React.createElement('div', null, React.createElement('div', { className: 'modal-label' }, 'Quantity'), React.createElement('div', { className: 'modal-value' }, trade.qty || '—'))
      ),
      React.createElement('div', { className: 'modal-section' },
        React.createElement('div', { className: 'modal-label' }, 'Performance Scenarios'),
        React.createElement('div', { className: 'scenario-row' },
          React.createElement('div', { className: 'scenario-card' },
            React.createElement('div', { className: 'modal-label', style: { color: 'var(--text2)' } }, 'Actual P&L'),
            React.createElement('div', { className: 'modal-value ' + (actualPnl > 0 ? 'pnl-pos' : actualPnl < 0 ? 'pnl-neg' : '') }, isNaN(actualPnl) ? '—' : fmtCurrency(actualPnl, currency))
          ),
          React.createElement('div', { className: 'scenario-card' },
            React.createElement('div', { className: 'modal-label', style: { color: 'var(--text2)' } }, 'If Hit Target (' + (trade.takeProfit || '—') + ')'),
            React.createElement('div', { className: 'modal-value ' + (parseFloat(targetPnl) > 0 ? 'pnl-pos' : '') }, targetPnl !== '—' ? fmtCurrency(targetPnl, currency) : '—')
          ),
          React.createElement('div', { className: 'scenario-card' },
            React.createElement('div', { className: 'modal-label', style: { color: 'var(--text2)' } }, 'If Hit Stop Loss (' + (trade.stopLoss || '—') + ')'),
            React.createElement('div', { className: 'modal-value ' + (parseFloat(slPnl) < 0 ? 'pnl-neg' : '') }, slPnl !== '—' ? fmtCurrency(slPnl, currency) : '—')
          )
        )
      ),
      React.createElement('div', { className: 'modal-section' },
        React.createElement('div', { className: 'modal-label' }, 'Emotions'),
        React.createElement('div', { className: 'tag-row' },
          (trade.emotions && trade.emotions.length > 0) ? trade.emotions.map(e => React.createElement('span', { key: e, className: 'tag selected', style: { cursor: 'default' } }, e)) : React.createElement('span', { style: { color: 'var(--text3)', fontSize: '0.85rem' } }, 'None logged')
        )
      ),
      React.createElement('div', { className: 'modal-section' },
        React.createElement('div', { className: 'modal-label' }, 'Reason for Trade'),
        React.createElement('div', { className: 'modal-text' }, trade.reason || 'No reasoning provided.')
      ),
      trade.imageUrl && React.createElement('div', { className: 'modal-section' },
        React.createElement('div', { className: 'modal-label' }, 'Setup Image (Click to enlarge)'),
        React.createElement('img', { src: trade.imageUrl, alt: 'Setup', style: { maxWidth: '100%', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer' }, onClick: () => setEnlarged(true) }),
        enlarged && React.createElement('div', { style: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', cursor: 'pointer' }, onClick: () => setEnlarged(false) },
          React.createElement('img', { src: trade.imageUrl, style: { maxWidth: '100%', maxHeight: '100%', borderRadius: '8px', objectFit: 'contain' } })
        )
      ),
      React.createElement('div', { className: 'modal-section', style: { marginBottom: 0 } },
        React.createElement('div', { className: 'modal-label' }, 'Notes / Lessons'),
        React.createElement('div', { className: 'modal-text' }, trade.notes || 'No notes provided.')
      )
    )
  );
}

// ---- JOURNAL PAGE ----
function JournalPage({ trades, onDelete, onEdit, currency, userStrats, onImport }) {
  const fileInputRef = useRef(null);

  const handleImportCsv = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    const reader = new FileReader();
    reader.onload = (event) => {
      let lines = [];
      if (isExcel) {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = window.XLSX.read(data, {type: 'array'});
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const csv = window.XLSX.utils.sheet_to_csv(firstSheet);
          lines = csv.split('\n').filter(l => l.trim());
        } catch(err) {
          return alert('Error reading Excel file.');
        }
      } else {
        const text = event.target.result;
        lines = text.split('\n').filter(l => l.trim());
      }
      if (lines.length < 2) return alert('Invalid file format');
      
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
      const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('time'));
      const symIdx = headers.findIndex(h => h.includes('symbol') || h.includes('ticker') || h.includes('instrument'));
      const pnlIdx = headers.findIndex(h => h.includes('p&l') || h.includes('profit') || h.includes('realized'));
      const qtyIdx = headers.findIndex(h => h.includes('qty') || h.includes('quantity') || h.includes('size'));
      const typeIdx = headers.findIndex(h => h.includes('type') || h.includes('side') || h.includes('action'));
      const priceIdx = headers.findIndex(h => h.includes('price') || h.includes('entry'));
      
      if (dateIdx === -1 || symIdx === -1 || pnlIdx === -1) {
        return alert('Could not detect required columns (Date, Symbol, P&L). Please rename your broker columns to match these standard headers.');
      }

      const newTrades = [];
      for (let i = 1; i < lines.length; i++) {
        let row = [];
        let inQuotes = false;
        let curr = '';
        for (let char of lines[i]) {
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) { row.push(curr); curr = ''; }
            else curr += char;
        }
        row.push(curr);
        row = row.map(v => v.trim().replace(/^"|"$/g, ''));

        if (row.length <= Math.max(dateIdx, symIdx, pnlIdx)) continue;
        
        let pnlStr = row[pnlIdx].replace(/[^0-9.-]/g, '');
        if (!pnlStr) continue;

        let dateStr = row[dateIdx];
        if (dateStr.includes(' ')) dateStr = dateStr.split(' ')[0];

        const t = {
            id: Date.now().toString() + Math.random().toString(),
            date: dateStr || new Date().toISOString().split('T')[0],
            symbol: row[symIdx] || 'Unknown',
            type: typeIdx !== -1 ? (row[typeIdx].toLowerCase().includes('buy') || row[typeIdx].toLowerCase().includes('long') ? 'Long' : 'Short') : 'Long',
            market: 'Equity',
            strategy: 'Imported',
            entry: priceIdx !== -1 ? row[priceIdx].replace(/[^0-9.]/g, '') : '',
            exit: '',
            qty: qtyIdx !== -1 ? row[qtyIdx].replace(/[^0-9.]/g, '') : '1',
            pnl: pnlStr,
            reason: 'Imported from CSV',
            emotions: [],
            notes: '',
            tags: [],
            imageUrl: ''
        };
        newTrades.push(t);
      }
      if (newTrades.length > 0) {
        onImport(newTrades);
        alert(`Successfully imported ${newTrades.length} trades!`);
      } else {
        alert('No valid trades found in CSV');
      }
      e.target.value = '';
    };
    if (isExcel) reader.readAsArrayBuffer(file);
    else reader.readAsText(file);
  };
  const [filter, setFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All Time');
  const [stratFilter, setStratFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [viewingTrade, setViewingTrade] = useState(null);

  const exportCsv = () => {
    const headers = ['Date', 'Symbol', 'Type', 'Market', 'Strategy', 'Entry', 'Exit', 'Qty', 'P&L', 'Reason', 'Emotions', 'Notes'];
    const sanitize = (val) => {
      const s = String(val || '');
      return /^[=+\-@]/.test(s) ? "'" + s : s;
    };
    const rows = trades.map(t => [
      t.date, sanitize(t.symbol), t.type, t.market, t.strategy, sanitize(t.entry), sanitize(t.exit), sanitize(t.qty), sanitize(t.pnl), 
      `"${sanitize(t.reason).replace(/"/g, '""')}"`, 
      `"${sanitize((t.emotions||[]).join(', ')).replace(/"/g, '""')}"`, 
      `"${sanitize(t.notes).replace(/"/g, '""')}"`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'tradelog_export.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = trades.filter(t => {
    if (filter === 'Wins' && parseFloat(t.pnl) <= 0) return false;
    if (filter === 'Losses' && parseFloat(t.pnl) >= 0) return false;
    if (filter === 'Long' && t.type !== 'Long') return false;
    if (filter === 'Short' && t.type !== 'Short') return false;
    if (stratFilter !== 'All' && t.strategy !== stratFilter) return false;
    
    if (dateFilter === 'This Month') {
      const d = new Date(t.date); const now = new Date();
      if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
    } else if (dateFilter === 'This Week') {
      const d = new Date(t.date); const now = new Date();
      if (now - d > 7 * 86400000) return false;
    }
    
    if (search && !t.symbol.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  return React.createElement('div', null,
    React.createElement('div', { className: 'page-header' },
      React.createElement('div', { className: 'page-title' }, 'Trade Journal'),
      React.createElement('div', { className: 'page-sub', style: { display: 'flex', gap: '1rem', alignItems: 'center' } }, 
        React.createElement('span', null, trades.length + ' trades logged'),
        React.createElement('button', { className: 'btn-export', onClick: exportCsv, style: { padding: '0.25rem 0.75rem', fontSize: '0.8rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: '4px', cursor: 'pointer', margin: 0 } }, 'Export CSV'),
        React.createElement('button', { className: 'btn-export', onClick: () => alert('Broker Import is currently in development to support more broker file formats. Stay tuned!'), style: { padding: '0.25rem 0.75rem', fontSize: '0.8rem', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text2)', borderRadius: '4px', cursor: 'not-allowed', margin: 0, opacity: 0.7 } }, 'Import Broker Data (In Development)'),
        React.createElement('input', { type: 'file', accept: '.csv, .xlsx, .xls', ref: fileInputRef, style: { display: 'none' }, onChange: handleImportCsv })
      )
    ),
    React.createElement('div', { className: 'filter-row' },
      ['All', 'Wins', 'Losses', 'Long', 'Short'].map(f =>
        React.createElement('button', { key: f, className: 'filter-btn' + (filter === f ? ' active' : ''), onClick: () => setFilter(f) }, f)
      ),
      React.createElement('select', { className: 'search-box', value: dateFilter, onChange: e => setDateFilter(e.target.value) },
        ['All Time', 'This Month', 'This Week'].map(o => React.createElement('option', { key: o, value: o }, o))
      ),
      React.createElement('select', { className: 'search-box', value: stratFilter, onChange: e => setStratFilter(e.target.value) },
        React.createElement('option', { value: 'All' }, 'All Strategies'),
        userStrats.map(o => React.createElement('option', { key: o, value: o }, o))
      ),
      React.createElement('input', { className: 'search-box', placeholder: 'Search symbol...', value: search, onChange: e => setSearch(e.target.value) })
    ),
    filtered.length === 0 ? React.createElement('div', { className: 'empty' }, React.createElement('div', { className: 'empty-icon' }, React.createElement('i', { className: 'ph ph-clipboard-text' })), React.createElement('p', null, 'No trades found. Log your first trade!')) :
    React.createElement('div', { className: 'table-wrap scrollable-table' },
      React.createElement('table', null,
        React.createElement('thead', null,
          React.createElement('tr', null,
            ['Date', 'Symbol', 'Dir', 'Market', 'Strategy', 'Entry', 'Exit', 'Qty', 'P&L', 'Status', 'Reason', ''].map(h =>
              React.createElement('th', { key: h }, h)
            )
          )
        ),
        React.createElement('tbody', null,
          filtered.map(t => {
            const pnl = parseFloat(t.pnl);
            return React.createElement('tr', { key: t.id },
              React.createElement('td', null, fmtDate(t.date)),
              React.createElement('td', { style: { fontWeight: 600, color: 'var(--text)', letterSpacing: '0.02em' } }, t.symbol),
              React.createElement('td', null, React.createElement('span', { className: 'badge ' + (t.type === 'Long' ? 'badge-long' : 'badge-short') }, t.type)),
              React.createElement('td', { style: { color: 'var(--text2)' } }, t.market || '—'),
              React.createElement('td', { style: { color: 'var(--text2)' } }, t.strategy || '—'),
              React.createElement('td', null, t.entry || '—'),
              React.createElement('td', null, t.exit || '—'),
              React.createElement('td', null, t.qty || '—'),
              React.createElement('td', { className: pnl > 0 ? 'pnl-pos' : 'pnl-neg' }, fmtCurrency(pnl, currency)),
              React.createElement('td', null, React.createElement('span', { className: 'badge ' + (pnl > 0 ? 'badge-win' : 'badge-loss') }, pnl > 0 ? 'Win' : 'Loss')),
              React.createElement('td', { style: { color: 'var(--text2)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Syne, sans-serif', fontSize: '0.82rem' } }, t.reason || '—'),
              React.createElement('td', null, 
                React.createElement('button', { className: 'edit-btn', onClick: () => setViewingTrade(t), title: 'View Details' }, React.createElement('i', { className: 'ph ph-eye' })),
                React.createElement('button', { className: 'edit-btn', onClick: () => onEdit(t), title: 'Edit' }, React.createElement('i', { className: 'ph ph-pencil-simple' })),
                React.createElement('button', { className: 'delete-btn', onClick: () => onDelete(t.id), title: 'Delete' }, React.createElement('i', { className: 'ph ph-trash' }))
              )
            );
          })
        )
      )
    ),
    viewingTrade && React.createElement(TradeDetailsModal, { trade: viewingTrade, onClose: () => setViewingTrade(null), currency })
  );
}

// ---- SETTINGS PAGE ----
function SettingsPage({ user, onUpdateUser }) {
  const [currency, setCurrency] = useState(user.currency || '$');
  const [balance, setBalance] = useState(user.balance || 10000);
  const [theme, setTheme] = useState(user.theme || 'dark');
  const [safeTradeCount, setSafeTradeCount] = useState(user.safeTradeCount || 3);
  const [customStrats, setCustomStrats] = useState((user.customStrategies || []).join(', '));
  const [customEms, setCustomEms] = useState((user.customEmotions || []).join(', '));
  const [toast, setToast] = useState(false);

  const save = () => {
    const parsedStrats = customStrats.split(',').map(s => s.trim()).filter(Boolean);
    const parsedEms = customEms.split(',').map(s => s.trim()).filter(Boolean);
    onUpdateUser({ ...user, currency, balance, theme, safeTradeCount: parseInt(safeTradeCount) || 3, customStrategies: parsedStrats, customEmotions: parsedEms });
    setToast(true);
    setTimeout(() => setToast(false), 2500);
  };

  const currencies = [
    { label: 'US Dollar ($)', value: '$' },
    { label: 'Euro (€)', value: '€' },
    { label: 'British Pound (£)', value: '£' },
    { label: 'Indian Rupee (₹)', value: '₹' },
    { label: 'Japanese Yen (¥)', value: '¥' },
    { label: 'Australian Dollar (A$)', value: 'A$' }
  ];

  return React.createElement('div', null,
    React.createElement('div', { className: 'page-header' },
      React.createElement('div', { className: 'page-title' }, 'Settings'),
      React.createElement('div', { className: 'page-sub' }, 'Customize your TradeLog experience.')
    ),
    React.createElement('div', { className: 'form-card', style: { maxWidth: '400px' } },
      React.createElement('div', { className: 'form-field', style: { marginBottom: '1.5rem' } },
        React.createElement('label', null, 'Starting Account Balance'),
        React.createElement('input', { type: 'number', value: balance, onChange: e => setBalance(e.target.value) })
      ),
      React.createElement('div', { className: 'form-field', style: { marginBottom: '1.5rem' } },
        React.createElement('label', null, 'Display Currency'),
        React.createElement('select', { value: currency, onChange: e => setCurrency(e.target.value) },
          currencies.map(c => React.createElement('option', { key: c.value, value: c.value }, c.label))
        )
      ),
      React.createElement('div', { className: 'form-field', style: { marginBottom: '1.5rem' } },
        React.createElement('label', null, 'Theme'),
        React.createElement('select', { value: theme, onChange: e => setTheme(e.target.value) },
          React.createElement('option', { value: 'dark' }, 'Dark Mode'),
          React.createElement('option', { value: 'light' }, 'Light Mode')
        )
      ),
      React.createElement('div', { className: 'form-field', style: { marginBottom: '1.5rem' } },
        React.createElement('label', null, 'Daily Trade Limit (Safe Count)'),
        React.createElement('input', { type: 'number', value: safeTradeCount, onChange: e => setSafeTradeCount(e.target.value) })
      ),
      React.createElement('div', { className: 'form-field', style: { marginBottom: '1.5rem' } },
        React.createElement('label', null, 'Custom Strategies (comma separated)'),
        React.createElement('input', { type: 'text', placeholder: 'e.g. Gap and Go, Golden Cross', value: customStrats, onChange: e => setCustomStrats(e.target.value) })
      ),
      React.createElement('div', { className: 'form-field', style: { marginBottom: '1.5rem' } },
        React.createElement('label', null, 'Custom Emotions (comma separated)'),
        React.createElement('input', { type: 'text', placeholder: 'e.g. Bored, Excited', value: customEms, onChange: e => setCustomEms(e.target.value) })
      ),
      React.createElement('button', { className: 'btn-submit', onClick: save }, 'Save Settings')
    ),
    toast && React.createElement('div', { className: 'toast' }, '✓ Settings saved successfully')
  );
}

// ---- DASHBOARD ----
function Dashboard({ trades, currency, startingBalance, safeTradeCount }) {
  const totalPnl = trades.reduce((s, t) => s + parseFloat(t.pnl || 0), 0);
  const currentBal = startingBalance + totalPnl;
  const roi = startingBalance > 0 ? ((totalPnl / startingBalance) * 100).toFixed(2) : 0;
  
  const uniqueDays = new Set(trades.map(t => t.date)).size;
  const avgTradesPerDay = uniqueDays ? (trades.length / uniqueDays).toFixed(1) : 0;
  const todayStr = new Date().toISOString().split('T')[0];
  const tradesToday = trades.filter(t => t.date === todayStr).length;
  
  const wins = trades.filter(t => parseFloat(t.pnl) > 0);
  const losses = trades.filter(t => parseFloat(t.pnl) <= 0);
  const winRate = trades.length ? ((wins.length / trades.length) * 100).toFixed(0) : 0;
  const avgWin = wins.length ? (wins.reduce((s, t) => s + parseFloat(t.pnl), 0) / wins.length).toFixed(2) : 0;
  const avgLoss = losses.length ? (losses.reduce((s, t) => s + parseFloat(t.pnl), 0) / losses.length).toFixed(2) : 0;
  const profitFactor = Math.abs(avgLoss) > 0 ? (parseFloat(avgWin) / Math.abs(parseFloat(avgLoss))).toFixed(2) : '∞';
  const bestTrade = trades.length ? trades.reduce((a, b) => parseFloat(b.pnl) > parseFloat(a.pnl) ? b : a, trades[0]) : null;

  let currentStreak = 0;
  let streakType = null;
  const sorted = [...trades].sort((a,b) => new Date(b.date) - new Date(a.date));
  for (let t of sorted) {
    const pnl = parseFloat(t.pnl);
    if (pnl === 0) continue;
    const isWin = pnl > 0;
    if (streakType === null) {
      streakType = isWin ? 'win' : 'loss';
      currentStreak = 1;
    } else if ((isWin && streakType === 'win') || (!isWin && streakType === 'loss')) {
      currentStreak++;
    } else {
      break;
    }
  }
  const streakText = currentStreak > 0 ? `${currentStreak} ${streakType === 'win' ? 'Wins' : 'Losses'}` : '0';
  const streakClass = streakType === 'win' ? 'green' : (streakType === 'loss' ? 'red' : '');

  const hasData = trades.length > 0;

  return React.createElement('div', null,
    React.createElement('div', { className: 'page-header' },
      React.createElement('div', { className: 'page-title' }, 'Dashboard'),
      React.createElement('div', { className: 'page-sub' }, hasData ? trades.length + ' trades analyzed' : 'Log trades to see your analytics')
    ),
    React.createElement('div', { className: 'stats-grid' },
      React.createElement('div', { className: 'stat-card' }, React.createElement('div', { className: 'stat-label' }, 'Current Balance'), React.createElement('div', { className: 'stat-value blue' }, fmtCurrency(currentBal, currency)), React.createElement('div', { className: 'stat-change' }, 'ROI: ' + (roi >= 0 ? '+' : '') + roi + '%')),
      React.createElement('div', { className: 'stat-card' }, React.createElement('div', { className: 'stat-label' }, 'Total P&L'), React.createElement('div', { className: 'stat-value ' + (totalPnl >= 0 ? 'green' : 'red') }, fmtCurrency(totalPnl, currency)), React.createElement('div', { className: 'stat-change' }, trades.length + ' trades')),
      React.createElement('div', { className: 'stat-card' }, React.createElement('div', { className: 'stat-label' }, 'Win Rate'), React.createElement('div', { className: 'stat-value blue' }, winRate + '%'), React.createElement('div', { className: 'stat-change' }, wins.length + ' wins / ' + losses.length + ' losses')),
      React.createElement('div', { className: 'stat-card' }, React.createElement('div', { className: 'stat-label' }, 'Avg Win'), React.createElement('div', { className: 'stat-value green' }, fmtCurrency(avgWin, currency)), React.createElement('div', { className: 'stat-change' }, 'Per winning trade')),
      React.createElement('div', { className: 'stat-card' }, React.createElement('div', { className: 'stat-label' }, 'Avg Loss'), React.createElement('div', { className: 'stat-value red' }, fmtCurrency(avgLoss, currency)), React.createElement('div', { className: 'stat-change' }, 'Per losing trade')),
      React.createElement('div', { className: 'stat-card' }, React.createElement('div', { className: 'stat-label' }, 'Profit Factor'), React.createElement('div', { className: 'stat-value amber' }, profitFactor), React.createElement('div', { className: 'stat-change' }, 'Avg Win / Avg Loss')),
      React.createElement('div', { className: 'stat-card' }, React.createElement('div', { className: 'stat-label' }, 'Best Trade'), React.createElement('div', { className: 'stat-value green', style: { fontSize: '1.1rem' } }, bestTrade ? bestTrade.symbol : '—'), React.createElement('div', { className: 'stat-change' }, bestTrade ? fmtCurrency(bestTrade.pnl, currency) : 'No trades yet')),
      React.createElement('div', { className: 'stat-card' }, React.createElement('div', { className: 'stat-label' }, 'Current Streak'), React.createElement('div', { className: 'stat-value ' + streakClass }, streakText), React.createElement('div', { className: 'stat-change' }, 'Consecutive outcomes')),
      React.createElement('div', { className: 'stat-card' }, React.createElement('div', { className: 'stat-label' }, 'Trades Today'), React.createElement('div', { className: 'stat-value ' + (tradesToday > safeTradeCount ? 'red' : 'green') }, tradesToday + ' / ' + safeTradeCount), React.createElement('div', { className: 'stat-change' }, tradesToday > safeTradeCount ? 'Over trading limit!' : 'Within safe limit')),
      React.createElement('div', { className: 'stat-card' }, React.createElement('div', { className: 'stat-label' }, 'Avg Trades / Day'), React.createElement('div', { className: 'stat-value ' + (avgTradesPerDay > safeTradeCount ? 'amber' : 'blue') }, avgTradesPerDay), React.createElement('div', { className: 'stat-change' }, 'Across ' + uniqueDays + ' active days'))
    ),
    !hasData ? React.createElement('div', { className: 'empty', style: { background: 'var(--bg2)', borderRadius: '12px', padding: '3rem' } }, React.createElement('div', { className: 'empty-icon' }, React.createElement('i', { className: 'ph ph-chart-bar' })), React.createElement('p', null, 'Log your first trade to see charts and analytics.')) :
    React.createElement('div', null,
      React.createElement('div', { className: 'charts-grid' },
        React.createElement('div', { className: 'chart-card' }, React.createElement('div', { className: 'chart-title' }, 'Equity Curve'), React.createElement(LineChartComponent, { trades, currency })),
        React.createElement('div', { className: 'chart-card' }, React.createElement('div', { className: 'chart-title' }, 'Win / Loss Ratio'), React.createElement(DonutChart, { trades }))
      ),
      React.createElement('div', { className: 'charts-grid' },
        React.createElement('div', { className: 'chart-card' }, React.createElement('div', { className: 'chart-title' }, 'P&L Per Trade (Last 15)'), React.createElement(PnLBarChart, { trades, currency })),
        React.createElement('div', { className: 'chart-card' }, React.createElement('div', { className: 'chart-title' }, 'P&L by Strategy'), React.createElement(StrategyChart, { trades, currency }))
      ),
      React.createElement('div', { className: 'chart-card', style: { marginBottom: '2rem' } }, React.createElement('div', { className: 'chart-title' }, 'P&L by Emotion'), React.createElement(EmotionChart, { trades, currency }))
    )
  );
}

// ---- CALENDAR PAGE ----
function CalendarPage({ trades, currency }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const days = Array.from({ length: firstDay }).map(() => null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const pnlByDate = {};
  trades.forEach(t => {
    pnlByDate[t.date] = (pnlByDate[t.date] || 0) + parseFloat(t.pnl || 0);
  });

  return React.createElement('div', null,
    React.createElement('div', { className: 'page-header' },
      React.createElement('div', { className: 'page-title' }, 'Calendar View'),
      React.createElement('div', { className: 'page-sub' }, 'Visualize your daily performance.')
    ),
    React.createElement('div', { className: 'cal-nav' },
      React.createElement('button', { className: 'cal-nav-btn', onClick: prevMonth }, '← Prev'),
      React.createElement('h3', { style: { fontFamily: 'Syne, sans-serif' } }, currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })),
      React.createElement('button', { className: 'cal-nav-btn', onClick: nextMonth }, 'Next →')
    ),
    React.createElement('div', { className: 'cal-grid' },
      ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => React.createElement('div', { key: d, className: 'cal-head' }, d)),
      days.map((d, i) => {
        if (!d) return React.createElement('div', { key: i, className: 'cal-day empty-day' });
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const pnl = pnlByDate[dateStr];
        const hasTrades = pnl !== undefined;
        let cName = 'cal-day';
        if (hasTrades) cName += pnl > 0 ? ' win' : (pnl < 0 ? ' loss' : '');
        return React.createElement('div', { key: i, className: cName },
          React.createElement('div', { className: 'cal-date' }, d),
          hasTrades && React.createElement('div', { className: 'cal-pnl', style: { color: pnl > 0 ? 'var(--accent)' : (pnl < 0 ? 'var(--red)' : 'var(--text)') } }, fmtCurrency(pnl, currency))
        );
      })
    )
  );
}

// ---- MAIN APP ----
function App() {
  const [user, setUser] = useState(loadSession);
  const [trades, setTrades] = useState([]);
  const [page, setPage] = useState('dashboard');
  const [editingTrade, setEditingTrade] = useState(null);

  useEffect(() => { 
    if (user) {
      setTrades(loadTrades(user.id)); 
      document.body.setAttribute('data-theme', user.theme === 'light' ? 'light' : 'dark');
    }
  }, [user]);

  const addTrade = (trade) => {
    const next = [trade, ...trades];
    setTrades(next);
    saveTrades(user.id, next);
  };

  const addTradesBatch = (newTrades) => {
    const next = [...newTrades, ...trades];
    setTrades(next);
    saveTrades(user.id, next);
  };

  const updateTrade = (trade) => {
    const next = trades.map(t => t.id === trade.id ? trade : t);
    setTrades(next);
    saveTrades(user.id, next);
    setEditingTrade(null);
    setPage('journal');
  };

  const deleteTrade = (id) => {
    const next = trades.filter(t => t.id !== id);
    setTrades(next);
    saveTrades(user.id, next);
  };

  const startEdit = (trade) => {
    setEditingTrade(trade);
    setPage('add');
  };

  const cancelEdit = () => {
    setEditingTrade(null);
    setPage('journal');
  };

  const updateUser = (updatedUser) => {
    const users = loadUsers();
    const nextUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    saveUsers(nextUsers);
    saveSession(updatedUser);
    setUser(updatedUser);
  };

  const logout = () => { saveSession(null); setUser(null); setTrades([]); };

  if (!user) return React.createElement(AuthPage, { onLogin: setUser });

  const userStrats = [...STRATEGIES, ...(user.customStrategies || [])];
  const userEms = [...EMOTIONS, ...(user.customEmotions || [])];

  const navItems = [
    { id: 'dashboard', icon: React.createElement('i', { className: 'ph ph-squares-four' }), label: 'Dashboard' },
    { id: 'add', icon: React.createElement('i', { className: 'ph ph-plus-circle' }), label: 'Log Trade' },
    { id: 'journal', icon: React.createElement('i', { className: 'ph ph-list-dashes' }), label: 'Journal' },
    { id: 'calendar', icon: React.createElement('i', { className: 'ph ph-calendar-blank' }), label: 'Calendar' },
    { id: 'settings', icon: React.createElement('i', { className: 'ph ph-gear' }), label: 'Settings' }
  ];

  return React.createElement('div', { className: 'app' },
    React.createElement('aside', { className: 'sidebar' },
      React.createElement('div', { className: 'sidebar-logo' }, 'Trade', React.createElement('span', null, 'Log')),
      React.createElement('nav', { className: 'nav' },
        navItems.map(n => React.createElement('div', { key: n.id, className: 'nav-item' + (page === n.id ? ' active' : ''), onClick: () => setPage(n.id) },
          React.createElement('span', { className: 'nav-icon mono' }, n.icon),
          React.createElement('span', { className: 'nav-label' }, n.label)
        ))
      ),
      React.createElement('div', { className: 'sidebar-user' },
        React.createElement('a', { href: 'https://discord.gg/FJqkYdtvEf', target: '_blank', rel: 'noopener noreferrer', className: 'discord-link', style: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(88,101,242,0.1)', color: '#5865F2', borderRadius: '8px', textDecoration: 'none', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: '600' } },
          React.createElement('i', { className: 'ph ph-discord-logo', style: { fontSize: '1.2rem' } }),
          React.createElement('span', { className: 'discord-text' }, 'Feedback & Support')
        ),
        React.createElement('div', { className: 'user-pill' },
          React.createElement('div', { className: 'user-avatar' }, typeof user.avatar === 'object' || user.avatar === 'guest' ? React.createElement('i', { className: 'ph ph-user' }) : (user.avatar || user.name[0])),
          React.createElement('div', { className: 'user-info' },
            React.createElement('div', { className: 'user-name' }, user.name),
            React.createElement('div', { className: 'user-email' }, user.email)
          )
        ),
        React.createElement('button', { className: 'logout-btn', onClick: logout, style: { marginTop: '0.5rem', fontSize: '0.75rem' } }, 'Sign out')
      )
    ),
    React.createElement('main', { className: 'main' },
      page === 'dashboard' && React.createElement(Dashboard, { trades, currency: user.currency || '$', startingBalance: parseFloat(user.balance) || 10000, safeTradeCount: user.safeTradeCount || 3 }),
      page === 'add' && React.createElement(AddTrade, { user, onAdd: addTrade, editingTrade, onUpdate: updateTrade, onCancelEdit: cancelEdit, userStrats, userEms }),
      page === 'journal' && React.createElement(JournalPage, { trades, onDelete: deleteTrade, onEdit: startEdit, currency: user.currency || '$', userStrats, onImport: addTradesBatch }),
      page === 'calendar' && React.createElement(CalendarPage, { trades, currency: user.currency || '$' }),
      page === 'settings' && React.createElement(SettingsPage, { user, onUpdateUser: updateUser })
    )
  );
}

ReactDOM.render(React.createElement(App), document.getElementById('root'));
