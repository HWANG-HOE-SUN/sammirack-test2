import React, { useState, useEffect } from 'react';
import { ProductProvider } from './contexts/ProductContext';
import Login from './components/Login';
import EstimateForm from './components/EstimateForm';
import MaterialPriceManager from './components/MaterialPriceManager';
import InventoryManager from './components/InventoryManager';
import HistoryPage from './components/HistoryPage';
import PasswordChange from './components/PasswordChange';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('estimate');
  const [cart, setCart] = useState([]);

  // 로그인 상태 확인
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  // 로그인 핸들러
  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  // 로그아웃 핸들러
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setActiveTab('estimate');
  };

  // 탭 변경 핸들러
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <ProductProvider>
      <div className="App">
        <header className="app-header">
          <div className="header-content">
            <h1 className="app-title">삼미랙 견적 시스템</h1>
            
            <nav className="main-navigation">
              <button
                className={`nav-tab ${activeTab === 'inventory' ? 'active' : ''}`}
                onClick={() => handleTabChange('inventory')}
              >
                재고관리
              </button>
              <button
                className={`nav-tab ${activeTab === 'estimate' ? 'active' : ''}`}
                onClick={() => handleTabChange('estimate')}
              >
                견적서 작성
              </button>
              <button
                className={`nav-tab ${activeTab === 'materials' ? 'active' : ''}`}
                onClick={() => handleTabChange('materials')}
              >
                원자재 단가 관리
              </button>
              <button
                className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => handleTabChange('history')}
              >
                견적 이력
              </button>
              {currentUser && (
                <button
                  className={`nav-tab ${activeTab === 'password' ? 'active' : ''}`}
                  onClick={() => handleTabChange('password')}
                >
                  비밀번호 변경
                </button>
              )}
            </nav>

            <div className="user-section">
              {currentUser ? (
                <div className="user-info">
                  <span className="user-name">{currentUser.username}님</span>
                  <button onClick={handleLogout} className="logout-button">
                    로그아웃
                  </button>
                </div>
              ) : (
                <Login onLogin={handleLogin} />
              )}
            </div>
          </div>
        </header>

        <main className="app-main">
          <div className="main-content">
            {activeTab === 'inventory' && (
              <InventoryManager 
                currentUser={currentUser}
              />
            )}
            
            {activeTab === 'estimate' && (
              <EstimateForm 
                currentUser={currentUser}
                cart={cart}
                setCart={setCart}
              />
            )}
            
            {activeTab === 'materials' && (
              <MaterialPriceManager 
                currentUser={currentUser}
                cart={cart}
              />
            )}
            
            {activeTab === 'history' && (
              <HistoryPage 
                currentUser={currentUser}
              />
            )}
            
            {activeTab === 'password' && currentUser && (
              <PasswordChange 
                currentUser={currentUser}
                onPasswordChanged={() => setActiveTab('estimate')}
              />
            )}
          </div>
        </main>

        <footer className="app-footer">
          <div className="footer-content">
            <p>&copy; 2024 삼미랙 견적 시스템. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </ProductProvider>
  );
}

export default App;

