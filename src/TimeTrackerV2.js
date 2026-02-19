import React, { useState, useEffect } from 'react';
import { Trash2, Plus, ChevronDown, Calendar, Play, Pause } from 'lucide-react';

const TimeTrackerV2 = () => {
  // Login state
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('ktt-logged-in') === 'true';
  });
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showWhoAreYouModal, setShowWhoAreYouModal] = useState(false);
  const [whoAreYouInput, setWhoAreYouInput] = useState('');

  // User state
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('tt-current-user');
    return saved || 'default';
  });

  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('tt-users');
      return saved ? JSON.parse(saved) : ['default'];
    } catch {
      return ['default'];
    }
  });

  const [newUsername, setNewUsername] = useState('');

  // Helper to get user-namespaced key
  const getUserKey = (key) => `tt-${currentUser}-${key}`;

  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem(getUserKey('categories'));
      return saved ? JSON.parse(saved) : [
        { id: '1', name: 'People Management', color: '#3b82f6' },
        { id: '2', name: 'Operational Oversight', color: '#8b5cf6' },
        { id: '3', name: 'Donor Relations', color: '#ec4899' },
        { id: '4', name: 'Strategic Work', color: '#10b981' },
        { id: '5', name: 'Crisis Management', color: '#f59e0b' },
      ];
    } catch {
      return [];
    }
  });

  const [savedEntries, setSavedEntries] = useState(() => {
    try {
      const saved = localStorage.getItem(getUserKey('saved-entries'));
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [draftEntries, setDraftEntries] = useState(() => {
    try {
      const saved = localStorage.getItem(getUserKey('draft-entries'));
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Timer state
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || '');
  const [timerStartTime, setTimerStartTime] = useState(null);

  // UI state
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6366f1');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [expandedDay, setExpandedDay] = useState(null);
  const [editingDraftId, setEditingDraftId] = useState(null);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [editingCategoryColor, setEditingCategoryColor] = useState('');
  const [hoveredTooltip, setHoveredTooltip] = useState(null);

  // Analytics state
  const [analyticsStartDate, setAnalyticsStartDate] = useState(() => {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return weekAgo.toISOString().split('T')[0];
  });
  const [analyticsEndDate, setAnalyticsEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Check if user is on default and needs to select a name
  useEffect(() => {
    if (isLoggedIn && currentUser === 'default') {
      setShowWhoAreYouModal(true);
    }
  }, [isLoggedIn, currentUser]);

  // Persist current user
  useEffect(() => {
    localStorage.setItem('tt-current-user', currentUser);
  }, [currentUser]);

  // Persist users list
  useEffect(() => {
    localStorage.setItem('tt-users', JSON.stringify(users));
  }, [users]);

  // Persist categories
  useEffect(() => {
    localStorage.setItem(getUserKey('categories'), JSON.stringify(categories));
  }, [categories, currentUser]);

  // Persist saved entries
  useEffect(() => {
    localStorage.setItem(getUserKey('saved-entries'), JSON.stringify(savedEntries));
  }, [savedEntries, currentUser]);

  // Persist draft entries
  useEffect(() => {
    localStorage.setItem(getUserKey('draft-entries'), JSON.stringify(draftEntries));
  }, [draftEntries, currentUser]);

  // Timer tick
  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: loginPassword }),
      });

      if (response.ok) {
        setIsLoggedIn(true);
        localStorage.setItem('ktt-logged-in', 'true');
        setLoginPassword('');
      } else {
        setLoginError('Invalid password');
      }
    } catch (err) {
      setLoginError('Connection error. Check server is running.');
    }
  };

  const handleWhoAreYou = () => {
    if (!whoAreYouInput.trim()) return;
    const newUsername = whoAreYouInput.trim().toLowerCase();
    
    if (!users.includes(newUsername)) {
      setUsers([...users, newUsername]);
    }
    
    setCurrentUser(newUsername);
    setWhoAreYouInput('');
    setShowWhoAreYouModal(false);
  };

  const startTimer = () => {
    if (!selectedCategory) return;
    setIsTimerRunning(true);
    setTimerStartTime(Date.now());
  };

  const stopTimer = () => {
    if (!isTimerRunning) return;
    
    const stopTime = new Date();
    const startTime = new Date(stopTime.getTime() - timerSeconds * 1000);
    const minutes = Math.round((timerSeconds / 60) * 100) / 100;
    
    // Get local date (not UTC)
    const year = stopTime.getFullYear();
    const month = String(stopTime.getMonth() + 1).padStart(2, '0');
    const day = String(stopTime.getDate()).padStart(2, '0');
    const localDate = `${year}-${month}-${day}`;
    
    const newDraft = {
      id: Date.now().toString(),
      categoryId: selectedCategory,
      minutes: minutes,
      notes: '',
      date: localDate,
      timestamp: new Date().toISOString(),
      startTime: startTime.toISOString(),
      stopTime: stopTime.toISOString(),
    };

    setDraftEntries([newDraft, ...draftEntries]);
    setIsTimerRunning(false);
    setTimerSeconds(0);
    setTimerStartTime(null);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const roundMinutes = (minutes) => {
    return Math.round(minutes * 100) / 100;
  };

  const formatTimeForInput = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const formatTimeForDisplay = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const downloadCSV = () => {
    if (savedEntries.length === 0) {
      alert('No saved entries to download');
      return;
    }

    const headers = ['Date', 'Category', 'Start Time', 'Stop Time', 'Minutes', 'Hours', 'Notes'];
    const rows = savedEntries.map((entry) => [
      entry.date,
      getCategoryName(entry.categoryId),
      new Date(entry.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      new Date(entry.stopTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      entry.minutes,
      (entry.minutes / 60).toFixed(2),
      entry.notes,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `time-tracker-${currentUser}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const addCategory = () => {
    if (!newCategoryName.trim()) return;

    const newCategory = {
      id: Date.now().toString(),
      name: newCategoryName.trim(),
      color: newCategoryColor,
    };

    setCategories([...categories, newCategory]);
    setNewCategoryName('');
    setNewCategoryColor('#6366f1');
    setShowNewCategory(false);
    setSelectedCategory(newCategory.id);
  };

  const startEditCategory = (cat) => {
    setEditingCategoryId(cat.id);
    setEditingCategoryName(cat.name);
    setEditingCategoryColor(cat.color);
  };

  const saveEditCategory = () => {
    if (!editingCategoryName.trim()) return;

    setCategories(
      categories.map((c) =>
        c.id === editingCategoryId
          ? { ...c, name: editingCategoryName.trim(), color: editingCategoryColor }
          : c
      )
    );
    setEditingCategoryId(null);
    setEditingCategoryName('');
    setEditingCategoryColor('');
  };

  const cancelEditCategory = () => {
    setEditingCategoryId(null);
    setEditingCategoryName('');
    setEditingCategoryColor('');
  };

  const deleteCategory = (id) => {
    if (categories.length <= 1) return;
    setCategories(categories.filter((c) => c.id !== id));
    if (selectedCategory === id) {
      setSelectedCategory(categories[0]?.id || '');
    }
  };

  const getCategoryName = (categoryId) => {
    return categories.find((c) => c.id === categoryId)?.name || 'Unknown';
  };

  const getCategoryColor = (categoryId) => {
    return categories.find((c) => c.id === categoryId)?.color || '#6366f1';
  };

  const updateDraftNotes = (draftId, newNotes) => {
    setDraftEntries(
      draftEntries.map((d) =>
        d.id === draftId ? { ...d, notes: newNotes } : d
      )
    );
  };

  const updateDraftMinutes = (draftId, newMinutes) => {
    setDraftEntries(
      draftEntries.map((d) =>
        d.id === draftId ? { ...d, minutes: parseFloat(newMinutes) || 0 } : d
      )
    );
  };

  const updateDraftCategory = (draftId, newCategoryId) => {
    setDraftEntries(
      draftEntries.map((d) =>
        d.id === draftId ? { ...d, categoryId: newCategoryId } : d
      )
    );
  };

  const updateDraftStartTime = (draftId, newStartTimeString) => {
    setDraftEntries(
      draftEntries.map((d) => {
        if (d.id === draftId) {
          const [datePart, timePart] = newStartTimeString.split('T');
          const [year, month, day] = datePart.split('-');
          const [hours, minutes] = timePart.split(':');
          const startDate = new Date(year, month - 1, day, hours, minutes, 0);
          
          const stopDate = new Date(d.stopTime);
          const newMinutes = Math.round(((stopDate - startDate) / 1000 / 60) * 100) / 100;
          return { ...d, startTime: startDate.toISOString(), minutes: newMinutes };
        }
        return d;
      })
    );
  };

  const updateDraftStopTime = (draftId, newStopTimeString) => {
    setDraftEntries(
      draftEntries.map((d) => {
        if (d.id === draftId) {
          const [datePart, timePart] = newStopTimeString.split('T');
          const [year, month, day] = datePart.split('-');
          const [hours, minutes] = timePart.split(':');
          const stopDate = new Date(year, month - 1, day, hours, minutes, 0);
          
          const startDate = new Date(d.startTime);
          const newMinutes = Math.round(((stopDate - startDate) / 1000 / 60) * 100) / 100;
          return { ...d, stopTime: stopDate.toISOString(), minutes: newMinutes };
        }
        return d;
      })
    );
  };

  const deleteDraft = (draftId) => {
    setDraftEntries(draftEntries.filter((d) => d.id !== draftId));
    setEditingDraftId(null);
  };

  const saveAllDrafts = () => {
    const updatedDrafts = draftEntries.map((draft) => {
      const startDate = new Date(draft.startTime);
      const year = startDate.getFullYear();
      const month = String(startDate.getMonth() + 1).padStart(2, '0');
      const day = String(startDate.getDate()).padStart(2, '0');
      const correctDate = `${year}-${month}-${day}`;
      return { ...draft, date: correctDate };
    });

    setSavedEntries([...savedEntries, ...updatedDrafts]);
    setDraftEntries([]);
  };

  const handleKeyPress = (e, callback) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      callback();
    }
  };

  const switchUser = (username) => {
    setCurrentUser(username);
  };

  const addUser = () => {
    if (!newUsername.trim() || users.includes(newUsername.trim())) return;
    const newUser = newUsername.trim();
    setUsers([...users, newUser]);
    setCurrentUser(newUser);
    setNewUsername('');
  };

  const moveDayBackToDrafts = (date) => {
    const dayEntries = groupedSavedEntries[date];
    if (!dayEntries) return;

    setDraftEntries([...dayEntries, ...draftEntries]);
    setSavedEntries(savedEntries.filter((e) => e.date !== date));
  };

  // Group entries by date
  const groupedSavedEntries = savedEntries.reduce((acc, entry) => {
    if (!acc[entry.date]) {
      acc[entry.date] = [];
    }
    acc[entry.date].push(entry);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedSavedEntries).sort().reverse();

  const totalMinutes = savedEntries.reduce((sum, e) => sum + e.minutes, 0);
  const draftTotalMinutes = draftEntries.reduce((sum, e) => sum + e.minutes, 0);

  // Analytics calculations
  const filterEntriesByDateRange = (entries) => {
    return entries.filter((e) => e.date >= analyticsStartDate && e.date <= analyticsEndDate);
  };

  const allEntries = [...savedEntries, ...draftEntries];
  const entriesInRange = filterEntriesByDateRange(allEntries);

  const categoryBreakdown = categories.map((cat) => ({
    name: cat.name,
    color: cat.color,
    minutes: entriesInRange
      .filter((e) => e.categoryId === cat.id)
      .reduce((sum, e) => sum + e.minutes, 0),
  })).filter((c) => c.minutes > 0);

  const dailyTotals = entriesInRange.reduce((acc, entry) => {
    if (!acc[entry.date]) {
      acc[entry.date] = {};
    }
    if (!acc[entry.date][entry.categoryId]) {
      acc[entry.date][entry.categoryId] = 0;
    }
    acc[entry.date][entry.categoryId] += entry.minutes;
    return acc;
  }, {});

  const timeSeriesData = Object.keys(dailyTotals)
    .sort()
    .map((date) => {
      const dayData = { date };
      categories.forEach((cat) => {
        dayData[cat.name] = (dailyTotals[date][cat.id] || 0) / 60;
      });
      return dayData;
    });

  // LOGIN SCREEN
  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', padding: '2rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '600', margin: '0 0 1.5rem 0', textAlign: 'center' }}>
              KTOO Time Tracker
            </h1>
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.875rem', color: '#cbd5e1', display: 'block', marginBottom: '0.5rem' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter password"
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '0.375rem',
                    color: '#e2e8f0',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box',
                  }}
                  autoFocus
                />
              </div>
              {loginError && (
                <div style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem' }}>
                  {loginError}
                </div>
              )}
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                }}
              >
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // WHO ARE YOU MODAL
  if (showWhoAreYouModal) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', padding: '2rem', maxWidth: '400px', width: '100%', margin: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: '0 0 1rem 0' }}>
            Who are you?
          </h2>
          <p style={{ color: '#94a3b8', marginBottom: '1rem', fontSize: '0.9rem' }}>
            Enter your name to get started
          </p>
          <input
            type="text"
            value={whoAreYouInput}
            onChange={(e) => setWhoAreYouInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleWhoAreYou()}
            placeholder="Your name"
            style={{
              width: '100%',
              padding: '0.625rem',
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '0.375rem',
              color: '#e2e8f0',
              fontSize: '0.95rem',
              marginBottom: '1rem',
              boxSizing: 'border-box',
            }}
            autoFocus
          />
          <button
            onClick={handleWhoAreYou}
            disabled={!whoAreYouInput.trim()}
            style={{
              width: '100%',
              padding: '0.625rem',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: whoAreYouInput.trim() ? 'pointer' : 'not-allowed',
              fontSize: '0.95rem',
              fontWeight: '500',
              opacity: whoAreYouInput.trim() ? 1 : 0.5,
            }}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // MAIN APP
  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #1e293b', padding: '2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '600', margin: '0 0 0.5rem 0' }}>
            Time Tracker
          </h1>
          <p style={{ margin: '0', color: '#94a3b8', fontSize: '0.95rem' }}>
            Track how you spend your time across roles and responsibilities
          </p>
        </div>
      </div>

      {/* User Selector */}
      <div style={{ borderBottom: '1px solid #1e293b', padding: '1rem 2rem', background: '#111827' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>User:</span>
          <select
            value={currentUser}
            onChange={(e) => switchUser(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '0.375rem',
              color: '#e2e8f0',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            {users.map((user) => (
              <option key={user} value={user}>
                {user}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, addUser)}
            placeholder="Add new user..."
            style={{
              padding: '0.5rem 0.75rem',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '0.375rem',
              color: '#e2e8f0',
              fontSize: '0.9rem',
              width: '150px',
            }}
          />
          <button
            onClick={addUser}
            disabled={!newUsername.trim() || users.includes(newUsername.trim())}
            style={{
              padding: '0.5rem 0.75rem',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: newUsername.trim() && !users.includes(newUsername.trim()) ? 'pointer' : 'not-allowed',
              fontSize: '0.9rem',
              opacity: newUsername.trim() && !users.includes(newUsername.trim()) ? 1 : 0.5,
              marginLeft: 'auto',
            }}
          >
            Add
          </button>
          <button
            onClick={() => {
              setIsLoggedIn(false);
              localStorage.removeItem('ktt-logged-in');
            }}
            style={{
              padding: '0.5rem 0.75rem',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        {/* Timer Form */}
        <div
          style={{
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', margin: '0 0 1.5rem 0' }}>Active Timer</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#cbd5e1' }}>
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                disabled={isTimerRunning}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '0.375rem',
                  color: '#e2e8f0',
                  fontSize: '0.95rem',
                  opacity: isTimerRunning ? 0.6 : 1,
                  cursor: isTimerRunning ? 'not-allowed' : 'pointer',
                }}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#cbd5e1' }}>
                Elapsed Time
              </label>
              <div
                style={{
                  padding: '0.625rem',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '0.375rem',
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  fontFamily: 'monospace',
                  textAlign: 'center',
                  color: isTimerRunning ? '#10b981' : '#e2e8f0',
                }}
              >
                {formatTime(timerSeconds)}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#cbd5e1' }}>
                &nbsp;
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={startTimer}
                  disabled={isTimerRunning || !selectedCategory}
                  style={{
                    flex: 1,
                    padding: '0.625rem',
                    background: isTimerRunning ? '#cbd5e1' : '#10b981',
                    color: isTimerRunning ? '#475569' : 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: isTimerRunning || !selectedCategory ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    opacity: isTimerRunning || !selectedCategory ? 0.6 : 1,
                  }}
                >
                  <Play size={16} /> Start
                </button>
                <button
                  onClick={stopTimer}
                  disabled={!isTimerRunning}
                  style={{
                    flex: 1,
                    padding: '0.625rem',
                    background: isTimerRunning ? '#ef4444' : '#cbd5e1',
                    color: isTimerRunning ? 'white' : '#475569',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: isTimerRunning ? 'pointer' : 'not-allowed',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    opacity: isTimerRunning ? 1 : 0.6,
                  }}
                >
                  <Pause size={16} /> Stop
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          {/* Categories Manager */}
          <div
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '0.5rem',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', margin: '0' }}>Categories</h2>
              <button
                onClick={() => setShowNewCategory(!showNewCategory)}
                style={{
                  padding: '0.5rem 0.75rem',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem',
                }}
              >
                <Plus size={16} /> Add
              </button>
            </div>

            {showNewCategory && (
              <div
                style={{
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '0.375rem',
                  padding: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, addCategory)}
                  placeholder="Category name"
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '0.375rem',
                    color: '#e2e8f0',
                    marginBottom: '0.75rem',
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <input
                    type="color"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    style={{
                      flex: 1,
                      height: '40px',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                    }}
                  />
                  <button
                    onClick={addCategory}
                    disabled={!newCategoryName.trim()}
                    style={{
                      flex: 1,
                      padding: '0.625rem',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: newCategoryName.trim() ? 'pointer' : 'not-allowed',
                      opacity: newCategoryName.trim() ? 1 : 0.5,
                      fontWeight: '500',
                    }}
                  >
                    Create
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {categories.map((cat) => {
                const catMinutes = savedEntries
                  .filter((e) => e.categoryId === cat.id)
                  .reduce((sum, e) => sum + e.minutes, 0);
                const catHours = (catMinutes / 60).toFixed(1);
                return (
                  <div key={cat.id}>
                    {editingCategoryId === cat.id ? (
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.5rem',
                          padding: '0.75rem',
                          background: '#0f172a',
                          borderRadius: '0.375rem',
                          border: '1px solid #334155',
                          alignItems: 'center',
                        }}
                      >
                        <input
                          type="text"
                          value={editingCategoryName}
                          onChange={(e) => setEditingCategoryName(e.target.value)}
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            background: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '0.375rem',
                            color: '#e2e8f0',
                            fontSize: '0.9rem',
                          }}
                        />
                        <input
                          type="color"
                          value={editingCategoryColor}
                          onChange={(e) => setEditingCategoryColor(e.target.value)}
                          style={{
                            width: '40px',
                            height: '40px',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                          }}
                        />
                        <button
                          onClick={saveEditCategory}
                          style={{
                            padding: '0.5rem 0.75rem',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '500',
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditCategory}
                          style={{
                            padding: '0.5rem 0.75rem',
                            background: '#6b7280',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0.75rem',
                          background: '#0f172a',
                          borderRadius: '0.375rem',
                          border: '1px solid #334155',
                        }}
                      >
                        <div
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: cat.color,
                            marginRight: '0.75rem',
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>{cat.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            {catMinutes.toFixed(2)} min ({catHours} hours)
                          </div>
                        </div>
                        <button
                          onClick={() => startEditCategory(cat)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#3b82f6',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '0.85rem',
                            fontWeight: '500',
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteCategory(cat.id)}
                          disabled={categories.length <= 1}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: categories.length <= 1 ? '#475569' : '#ef4444',
                            cursor: categories.length <= 1 ? 'not-allowed' : 'pointer',
                            padding: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title={categories.length <= 1 ? 'Cannot delete the last category' : 'Delete category'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary Stats */}
          <div
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '0.5rem',
              padding: '1.5rem',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', margin: '0 0 1.5rem 0' }}>Summary</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: '#0f172a', borderRadius: '0.375rem', borderLeft: `4px solid #3b82f6` }}>
                <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                  Saved Time
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '600' }}>{totalMinutes.toFixed(2)} min</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>({(totalMinutes / 60).toFixed(1)} hours)</div>
              </div>
              <div style={{ padding: '1rem', background: '#0f172a', borderRadius: '0.375rem', borderLeft: `4px solid #f59e0b` }}>
                <div style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                  Draft Time (Pending Save)
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '600' }}>{draftTotalMinutes.toFixed(2)} min</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>({(draftTotalMinutes / 60).toFixed(1)} hours)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Draft Entries */}
        {draftEntries.length > 0 && (
          <div
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', margin: '0' }}>
                Draft Entries ({draftEntries.length})
              </h2>
              <button
                onClick={saveAllDrafts}
                style={{
                  padding: '0.625rem 1rem',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                Save All Drafts
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {draftEntries.map((draft) => (
                <div
                  key={draft.id}
                  style={{
                    background: '#0f172a',
                    border: `1px solid ${getCategoryColor(draft.categoryId)}`,
                    borderRadius: '0.375rem',
                    padding: '1rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                      marginBottom: '1rem',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                        <select
                          value={draft.categoryId}
                          onChange={(e) => updateDraftCategory(draft.id, e.target.value)}
                          style={{
                            padding: '0.5rem',
                            background: '#0f172a',
                            border: `1px solid ${getCategoryColor(draft.categoryId)}`,
                            borderRadius: '0.375rem',
                            color: '#e2e8f0',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                          }}
                        >
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        {new Date(draft.date + 'T00:00:00').toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteDraft(draft.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>
                        Start Time
                      </label>
                      <input
                        type="datetime-local"
                        value={formatTimeForInput(draft.startTime)}
                        onChange={(e) => updateDraftStartTime(draft.id, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          background: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '0.375rem',
                          color: '#e2e8f0',
                          fontSize: '0.85rem',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>
                        Stop Time
                      </label>
                      <input
                        type="datetime-local"
                        value={formatTimeForInput(draft.stopTime)}
                        onChange={(e) => updateDraftStopTime(draft.id, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          background: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '0.375rem',
                          color: '#e2e8f0',
                          fontSize: '0.85rem',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>
                        Min
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={draft.minutes}
                        onChange={(e) => updateDraftMinutes(draft.id, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          background: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '0.375rem',
                          color: '#e2e8f0',
                          fontSize: '0.9rem',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '0.25rem' }}>
                      Notes
                    </label>
                    <input
                      type="text"
                      value={draft.notes}
                      onChange={(e) => updateDraftNotes(draft.id, e.target.value)}
                      placeholder="Add notes about this work..."
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '0.375rem',
                        color: '#e2e8f0',
                        fontSize: '0.9rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics */}
        {savedEntries.length > 0 && (
          <div
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', margin: '0 0 1.5rem 0' }}>Analytics</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.875rem', color: '#cbd5e1', display: 'block', marginBottom: '0.5rem' }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={analyticsStartDate}
                  onChange={(e) => setAnalyticsStartDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '0.375rem',
                    color: '#e2e8f0',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.875rem', color: '#cbd5e1', display: 'block', marginBottom: '0.5rem' }}>
                  End Date
                </label>
                <input
                  type="date"
                  value={analyticsEndDate}
                  onChange={(e) => setAnalyticsEndDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '0.375rem',
                    color: '#e2e8f0',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {entriesInRange.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem 0' }}>
                No entries in this date range
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Pie Chart */}
                <div style={{ background: '#0f172a', borderRadius: '0.375rem', padding: '1rem', position: 'relative' }}>
                  <h3 style={{ fontSize: '1rem', margin: '0 0 1rem 0' }}>Time by Category</h3>
                  <div style={{ position: 'relative', width: '100%', maxWidth: '300px', margin: '0 auto' }}>
                    <svg viewBox="0 0 200 200" style={{ width: '100%', display: 'block' }}>
                      {(() => {
                        let currentAngle = 0;
                        const totalMinutes = categoryBreakdown.reduce((sum, c) => sum + c.minutes, 0);
                        return categoryBreakdown.map((cat) => {
                          const percentage = cat.minutes / totalMinutes;
                          const sliceAngle = percentage * 360;
                          const startAngle = currentAngle;
                          const endAngle = currentAngle + sliceAngle;

                          const startRad = (startAngle * Math.PI) / 180;
                          const endRad = (endAngle * Math.PI) / 180;
                          const x1 = 100 + 80 * Math.cos(startRad);
                          const y1 = 100 + 80 * Math.sin(startRad);
                          const x2 = 100 + 80 * Math.cos(endRad);
                          const y2 = 100 + 80 * Math.sin(endRad);

                          const largeArc = sliceAngle > 180 ? 1 : 0;
                          const pathData = [
                            `M 100 100`,
                            `L ${x1} ${y1}`,
                            `A 80 80 0 ${largeArc} 1 ${x2} ${y2}`,
                            'Z',
                          ].join(' ');

                          currentAngle = endAngle;

                          return (
                            <g 
                              key={cat.name}
                              onMouseEnter={() => setHoveredTooltip(`pie-${cat.name}`)}
                              onMouseLeave={() => setHoveredTooltip(null)}
                              style={{ cursor: 'pointer' }}
                            >
                              <path 
                                d={pathData} 
                                fill={cat.color} 
                                stroke="#1e293b" 
                                strokeWidth="2"
                                opacity={hoveredTooltip === null || hoveredTooltip === `pie-${cat.name}` ? 1 : 0.5}
                                style={{ transition: 'opacity 0.2s' }}
                              />
                            </g>
                          );
                        });
                      })()}
                    </svg>
                    {hoveredTooltip && hoveredTooltip.startsWith('pie-') && (
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '0.375rem',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.85rem',
                        whiteSpace: 'nowrap',
                        zIndex: 10,
                        pointerEvents: 'none',
                      }}>
                        {categoryBreakdown.find(c => `pie-${c.name}` === hoveredTooltip) && (
                          <>
                            <div style={{ fontWeight: '500', color: '#e2e8f0' }}>
                              {categoryBreakdown.find(c => `pie-${c.name}` === hoveredTooltip).name}
                            </div>
                            <div style={{ color: '#94a3b8' }}>
                              {categoryBreakdown.find(c => `pie-${c.name}` === hoveredTooltip).minutes.toFixed(2)} min ({(categoryBreakdown.find(c => `pie-${c.name}` === hoveredTooltip).minutes / 60).toFixed(1)}h)
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {categoryBreakdown.map((cat) => (
                      <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <div
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: cat.color,
                          }}
                        />
                        <span>{cat.name}</span>
                        <span style={{ marginLeft: 'auto', color: '#94a3b8' }}>
                          {cat.minutes.toFixed(2)} min ({(cat.minutes / 60).toFixed(1)}h)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Time Series */}
                <div style={{ background: '#0f172a', borderRadius: '0.375rem', padding: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', margin: '0 0 1rem 0' }}>Daily Breakdown</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
                    {(() => {
                      const maxDailyHours = Math.max(
                        ...timeSeriesData.map((day) =>
                          Object.keys(day)
                            .filter((k) => k !== 'date')
                            .reduce((sum, k) => sum + (day[k] || 0), 0)
                        ),
                        1
                      );
                      return timeSeriesData.map((day) => {
                        const dayTotal = Object.keys(day)
                          .filter((k) => k !== 'date')
                          .reduce((sum, k) => sum + (day[k] || 0), 0);
                        const dayPercentage = (dayTotal / maxDailyHours) * 100;

                        return (
                          <div key={day.date}>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                              {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </div>
                            <div style={{ display: 'flex', gap: '0.25rem', height: '24px', position: 'relative' }}>
                              <div style={{ display: 'flex', gap: '0.25rem', height: '24px', width: `${dayPercentage}%` }}>
                                {categories.map((cat) => {
                                  const hours = day[cat.name] || 0;
                                  const catPercentage = dayTotal > 0 ? (hours / dayTotal) * 100 : 0;
                                  return (
                                    hours > 0 && (
                                      <div
                                        key={cat.id}
                                        style={{
                                          background: cat.color,
                                          width: `${catPercentage}%`,
                                          borderRadius: '2px',
                                          cursor: 'pointer',
                                          opacity: hoveredTooltip === null || hoveredTooltip === `bar-${day.date}-${cat.id}` ? 1 : 0.5,
                                          transition: 'opacity 0.2s',
                                          position: 'relative',
                                        }}
                                        onMouseEnter={() => setHoveredTooltip(`bar-${day.date}-${cat.id}`)}
                                        onMouseLeave={() => setHoveredTooltip(null)}
                                      >
                                        {hoveredTooltip === `bar-${day.date}-${cat.id}` && (
                                          <div style={{
                                            position: 'absolute',
                                            bottom: '100%',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            background: '#1e293b',
                                            border: '1px solid #334155',
                                            borderRadius: '0.375rem',
                                            padding: '0.5rem 0.75rem',
                                            fontSize: '0.8rem',
                                            whiteSpace: 'nowrap',
                                            zIndex: 10,
                                            marginBottom: '0.5rem',
                                            pointerEvents: 'none',
                                          }}>
                                            <div style={{ fontWeight: '500', color: '#e2e8f0' }}>
                                              {cat.name}
                                            </div>
                                            <div style={{ color: '#94a3b8' }}>
                                              {hours.toFixed(1)}h
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )
                                  );
                                })}
                              </div>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                              {dayTotal.toFixed(1)}h total
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Saved Entries */}
        <div
          style={{
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '0.5rem',
            padding: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', margin: '0' }}>Saved Entries</h2>
            <button
              onClick={downloadCSV}
              disabled={savedEntries.length === 0}
              style={{
                padding: '0.625rem 1rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: savedEntries.length > 0 ? 'pointer' : 'not-allowed',
                fontWeight: '500',
                opacity: savedEntries.length > 0 ? 1 : 0.5,
                fontSize: '0.9rem',
              }}
            >
              Download CSV
            </button>
          </div>

          {sortedDates.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center', paddingTop: '2rem' }}>
              No saved entries yet. Start the timer and log your time!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {sortedDates.map((date) => {
                const dayEntries = groupedSavedEntries[date];
                const dayTotalMinutes = dayEntries.reduce((sum, e) => sum + e.minutes, 0);
                const dayTotalHours = (dayTotalMinutes / 60).toFixed(1);
                const isExpanded = expandedDay === date;

                return (
                  <div key={date} style={{ background: '#0f172a', borderRadius: '0.375rem', overflow: 'hidden' }}>
                    <button
                      onClick={() => setExpandedDay(isExpanded ? null : date)}
                      style={{
                        width: '100%',
                        padding: '1rem',
                        background: 'none',
                        border: 'none',
                        color: '#e2e8f0',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.95rem',
                        borderBottom: isExpanded ? '1px solid #334155' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Calendar size={18} style={{ color: '#64748b' }} />
                        <div>
                          <div style={{ fontWeight: '500' }}>
                            {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                            {dayEntries.length} entry{dayEntries.length !== 1 ? 'ies' : ''} • {dayTotalMinutes.toFixed(2)} min ({dayTotalHours} hours)
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveDayBackToDrafts(date);
                          }}
                          style={{
                            padding: '0.5rem 0.75rem',
                            background: '#f59e0b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            fontWeight: '500',
                          }}
                        >
                          Edit Day
                        </button>
                        <ChevronDown
                          size={18}
                          style={{
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s',
                            color: '#64748b',
                          }}
                        />
                      </div>
                    </button>

                    {isExpanded && (
                      <div style={{ padding: '1rem', background: '#1e293b', borderTop: '1px solid #334155' }}>
                        {dayEntries.sort((a, b) => new Date(a.startTime) - new Date(b.startTime)).map((entry) => (
                          <div
                            key={entry.id}
                            style={{
                              marginBottom: '1rem',
                              paddingLeft: '1rem',
                              borderLeft: `3px solid ${getCategoryColor(entry.categoryId)}`,
                              paddingBottom: '1rem',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                              <div>
                                <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                                  {getCategoryName(entry.categoryId)}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                                  {formatTimeForDisplay(entry.startTime)} - {formatTimeForDisplay(entry.stopTime)} • {entry.minutes} min ({(entry.minutes / 60).toFixed(1)} hours)
                                </div>
                                {entry.notes && (
                                  <div style={{ fontSize: '0.85rem', color: '#cbd5e1', fontStyle: 'italic' }}>
                                    "{entry.notes}"
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimeTrackerV2;