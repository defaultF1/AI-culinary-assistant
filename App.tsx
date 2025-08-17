import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Home } from './components/Home';
import { Favorites } from './components/Favorites';
import { Settings } from './components/Settings';
import { LoginModal } from './components/LoginModal';
import { RecipeDetail } from './components/RecipeDetail';
import { User, Recipe, ChatMessage, HistoryItem } from './types';
import { Nav } from './components/Nav';
import { CompanionAIButton } from './components/CompanionAIButton';
import { CompanionChatModal } from './components/CompanionChatModal';
import { getCompanionAnswer } from './services/geminiService';
import { History } from './components/History';

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [favorites, setFavorites] = useState<Recipe[]>(() => {
    const stored = localStorage.getItem('favorites');
    return stored ? JSON.parse(stored) : [];
  });
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const stored = localStorage.getItem('recipeHistory');
    return stored ? JSON.parse(stored) : [];
  });
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isCompanionChatOpen, setIsCompanionChatOpen] = useState(false);
  const [companionMessages, setCompanionMessages] = useState<ChatMessage[]>(() => {
      const stored = localStorage.getItem('companionChatHistory');
      return stored ? JSON.parse(stored) : [];
  });
  const [isCompanionThinking, setIsCompanionThinking] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // On initial app load, if there's no user, prompt them to sign in.
    if (!user) {
      setShowLoginModal(true);
    }
  }, []); // Empty dependency array ensures this runs only once on mount.

  const handleLoginSuccess = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setShowLoginModal(false);
  };

  const handleGuestLogin = () => {
    const guestData: User = { name: 'Guest', authMethod: 'Guest' };
    setUser(guestData);
    localStorage.setItem('user', JSON.stringify(guestData));
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    if (user?.authMethod === 'Google' && typeof google !== 'undefined' && google.accounts?.id) {
      google.accounts.id.disableAutoSelect();
    }
    setUser(null);
    setFavorites([]);
    setHistory([]);
    setCompanionMessages([]);
    localStorage.removeItem('user');
    localStorage.removeItem('favorites');
    localStorage.removeItem('recipeHistory');
    localStorage.removeItem('companionChatHistory');
    navigate('/');
    setShowLoginModal(true); // Show login modal after logout
  };
  
  const handleUpdateUser = (updatedData: { name: string; email: string }) => {
    if (user) {
      const updatedUser = { ...user, ...updatedData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const toggleFavorite = (recipe: Recipe) => {
    if (!user || user.authMethod === 'Guest') {
      setShowLoginModal(true);
      return;
    }
    let updatedFavorites;
    if (favorites.find(fav => fav.title === recipe.title)) {
      updatedFavorites = favorites.filter(fav => fav.title !== recipe.title);
    } else {
      updatedFavorites = [...favorites, recipe];
    }
    setFavorites(updatedFavorites);
    localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
  };

  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    navigate('/recipe');
  };
  
  const handleAddToHistory = (recipe: Recipe) => {
    const newHistoryItem: HistoryItem = {
      ...recipe,
      generatedAt: new Date().toISOString(),
    };
    // Add to front of array so newest is first
    const updatedHistory = [newHistoryItem, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('recipeHistory', JSON.stringify(updatedHistory));
  };

  const handleSendMessage = async (message: string) => {
    const newUserMessage: ChatMessage = { sender: 'user', text: message };
    const updatedMessages = [...companionMessages, newUserMessage];
    setCompanionMessages(updatedMessages);
    setIsCompanionThinking(true);

    try {
        const aiResponseText = await getCompanionAnswer(message);
        const aiMessage: ChatMessage = { sender: 'ai', text: aiResponseText };
        const finalMessages = [...updatedMessages, aiMessage];
        setCompanionMessages(finalMessages);
        localStorage.setItem('companionChatHistory', JSON.stringify(finalMessages));
    } catch (error) {
        console.error("Companion chat error:", error);
        const errorMessage: ChatMessage = { sender: 'ai', text: "Something went wrong. Please try again." };
        const finalMessages = [...updatedMessages, errorMessage];
        setCompanionMessages(finalMessages);
        localStorage.setItem('companionChatHistory', JSON.stringify(finalMessages));
    } finally {
        setIsCompanionThinking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Nav user={user} onShowLogin={() => setShowLoginModal(true)} />
      <main className="pt-20">
        <Routes>
          <Route path="/" element={<Home onSelectRecipe={handleSelectRecipe} onAddToHistory={handleAddToHistory} user={user} />} />
          <Route path="/favorites" element={<Favorites favorites={favorites} onSelectRecipe={handleSelectRecipe} />} />
          <Route path="/settings" element={<Settings user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />} />
          <Route path="/recipe" element={<RecipeDetail recipe={selectedRecipe} isFavorite={!!favorites.find(f => f.title === selectedRecipe?.title)} onToggleFavorite={toggleFavorite} user={user} />} />
          <Route path="/history" element={<History history={history} onSelectRecipe={handleSelectRecipe} />} />
        </Routes>
      </main>
      {showLoginModal && <LoginModal onLoginSuccess={handleLoginSuccess} onGuestLogin={handleGuestLogin} onClose={() => setShowLoginModal(false)} />}
      <CompanionAIButton onClick={() => setIsCompanionChatOpen(true)} />
      {isCompanionChatOpen && (
          <CompanionChatModal
              onClose={() => setIsCompanionChatOpen(false)}
              messages={companionMessages}
              onSendMessage={handleSendMessage}
              isThinking={isCompanionThinking}
          />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;
