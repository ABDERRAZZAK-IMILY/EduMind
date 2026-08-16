import React, { useState, useEffect } from 'react';
import api from './api';
import Navbar from './components/Navbar';
import LeftSidebar from './components/LeftSidebar';
import CenterChat from './components/CenterChat';
import RightPanel from './components/RightPanel';
import LoginModal from './components/LoginModal';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem('access_token')
  );
  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [level, setLevel] = useState('INTERMEDIAIRE');
  const [activePdfPage, setActivePdfPage] = useState(1);
  const [autoStartQuizDocId, setAutoStartQuizDocId] = useState(null);

  const fetchUserProfile = async () => {
    try {
      const res = await api.get('/accounts/me/');
      setUser(res.data);
    } catch (err) {
      console.error('Erreur chargement profil:', err);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/documents/');
      setDocuments(res.data);
      if (res.data.length > 0 && !selectedDoc) {
        // Autoselect first ready or uploaded document
        setSelectedDoc(res.data[0]);
      }
    } catch (err) {
      console.error('Erreur chargement documents:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserProfile();
      fetchDocuments();
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsAuthenticated(false);
    setUser(null);
    setSelectedDoc(null);
  };

  const handleCitationClick = (page) => {
    setActivePdfPage(page);
  };

  const handleTriggerQuiz = (docId) => {
    setAutoStartQuizDocId(docId);
  };

  if (!isAuthenticated) {
    return <LoginModal onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      {/* Top Navbar */}
      <Navbar
        user={user}
        selectedDoc={selectedDoc}
        level={level}
        setLevel={setLevel}
        onLogout={handleLogout}
      />

      {/* Main 3-Column Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Documents */}
        <LeftSidebar
          documents={documents}
          selectedDoc={selectedDoc}
          onSelectDoc={setSelectedDoc}
          onRefreshDocs={fetchDocuments}
        />

        {/* Center Column: Interactive Chat & SSE Streaming */}
        <CenterChat
          selectedDoc={selectedDoc}
          level={level}
          onCitationClick={handleCitationClick}
          onTriggerQuiz={handleTriggerQuiz}
        />

        {/* Right Column: Output Panel & PDF Viewer */}
        <RightPanel
          selectedDoc={selectedDoc}
          activePdfPage={activePdfPage}
          autoStartQuizDocId={autoStartQuizDocId}
          onResetAutoStartQuiz={() => setAutoStartQuizDocId(null)}
        />
      </div>
    </div>
  );
}
