import React, { useState, useEffect, useMemo } from 'react';
import InterestSelector from './components/InterestSelector';
import MatchResults from './components/MatchResults';
import { MatchingEngine } from './utils/matchingEngine';
import SessionManager from './utils/sessionManager';
import { Interest, MatchResult, SessionData } from './types';

type AppStage = 'welcome' | 'enterName' | 'user1' | 'user2' | 'results' | 'share';

const App: React.FC = () => {
  const [stage, setStage] = useState<AppStage>('welcome');
  const [user1Interests, setUser1Interests] = useState<Interest[]>([]);
  const [user2Interests, setUser2Interests] = useState<Interest[]>([]);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [user1Name, setUser1Name] = useState('');
  const [user2Name, setUser2Name] = useState('');
  const [sessionId, setSessionId] = useState<string>('');
  const [sessionData, setSessionData] = useState<SessionData | null>(null);

  const engine = useMemo(() => new MatchingEngine(), []);

  useEffect(() => {
    // 优先检查URL数据参数
    const sessionDataFromUrl = SessionManager.getSessionDataFromUrl();
    if (sessionDataFromUrl) {
      setSessionData(sessionDataFromUrl);
      setSessionId(sessionDataFromUrl.sessionId);
      
      if (sessionDataFromUrl.user1 && sessionDataFromUrl.user2) {
        // 两个用户都完成了，显示结果
        const result = engine.calculateMatch(sessionDataFromUrl.user1.interests, sessionDataFromUrl.user2.interests);
        setMatchResult(result);
        setUser1Name(sessionDataFromUrl.user1.name);
        setUser2Name(sessionDataFromUrl.user2.name);
        setStage('results');
      } else if (sessionDataFromUrl.user1) {
        // 用户1完成了，用户2需要输入名字并完成
        setUser1Name(sessionDataFromUrl.user1.name);
        setUser1Interests(sessionDataFromUrl.user1.interests);
        setStage('enterName');
      }
      return;
    }
    
    // 检查报告链接
    const reportId = SessionManager.getReportIdFromUrl();
    if (reportId) {
      const savedSession = SessionManager.loadSession();
      if (savedSession && savedSession.sessionId === reportId && savedSession.user1 && savedSession.user2) {
        const result = engine.calculateMatch(savedSession.user1.interests, savedSession.user2.interests);
        setMatchResult(result);
        setUser1Name(savedSession.user1.name);
        setUser2Name(savedSession.user2.name);
        setStage('results');
        return;
      }
    }
    
    // 检查现有的session从URL或localStorage
    const urlSessionId = SessionManager.getSessionIdFromUrl();
    const savedSession = SessionManager.loadSession();
    
    if (urlSessionId && savedSession && savedSession.sessionId === urlSessionId) {
      setSessionId(urlSessionId);
      setSessionData(savedSession);
      
      if (savedSession.user1 && savedSession.user2) {
        // 两个用户都完成了，显示结果
        const result = engine.calculateMatch(savedSession.user1.interests, savedSession.user2.interests);
        setMatchResult(result);
        setUser1Name(savedSession.user1.name);
        setUser2Name(savedSession.user2.name);
        setStage('results');
      } else if (savedSession.user1) {
        // 用户1完成了，用户2需要输入名字并完成
        setUser1Name(savedSession.user1.name);
        setUser1Interests(savedSession.user1.interests);
        setStage('enterName');
      }
    }
  }, [engine]);

  const handleUser1Complete = (interests: Interest[]) => {
    const newSessionId = sessionId || SessionManager.generateSessionId();
    const user1Selection = SessionManager.createUserSelection('user1', user1Name, interests);
    
    const newSessionData: SessionData = {
      sessionId: newSessionId,
      user1: user1Selection,
      user2: null,
      user2Name: user2Name, // 保存用户B的名字
      createdAt: Date.now()
    };
    
    setSessionId(newSessionId);
    setSessionData(newSessionData);
    setUser1Interests(interests);
    SessionManager.saveSession(newSessionData);
    setStage('share');
  };

  const handleUser2Complete = (interests: Interest[]) => {
    if (!sessionData) return;
    
    const user2Selection = SessionManager.createUserSelection('user2', user2Name, interests);
    const updatedSession = SessionManager.updateSessionWithUser(sessionData, 2, user2Selection);
    
    setSessionData(updatedSession);
    setUser2Interests(interests);
    SessionManager.saveSession(updatedSession);
    
    const result = engine.calculateMatch(sessionData.user1!.interests, interests);
    setMatchResult(result);
    setStage('results');
  };

  const resetApp = () => {
    setStage('welcome');
    setUser1Interests([]);
    setUser2Interests([]);
    setMatchResult(null);
    setUser1Name('');
    setUser2Name('');
    setSessionId('');
    setSessionData(null);
    SessionManager.clearSession();
  };

  const copyShareLink = async () => {
    if (!sessionData) {
      alert('没有可分享的数据');
      return;
    }
    
    try {
      const shareLink = SessionManager.getShareableLinkWithData(sessionData);
      console.log('Generated share link:', shareLink);
      await navigator.clipboard.writeText(shareLink);
      alert('分享链接已复制到剪贴板！');
    } catch (err) {
      console.error('Failed to copy share link: ', err);
      alert('复制分享链接失败，请手动复制链接');
    }
  };

  const copyResultsLink = async () => {
    if (!sessionData) return;
    
    const reportLink = SessionManager.getReportLink(sessionData.sessionId);
    try {
      await navigator.clipboard.writeText(reportLink);
      alert('结果链接已复制到剪贴板！可以分享给对方查看匹配结果。');
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const renderWelcome = () => (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 sm:p-8 shadow-xl max-w-md w-full text-center">
        <div className="text-4xl sm:text-6xl mb-4 sm:mb-6">💕</div>
        <h1 className="text-2xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">七夕匹配</h1>
        <p className="text-sm sm:text-base text-white/80 mb-4 sm:mb-6">
          发现你们之间的兴趣匹配，找到最适合的约会活动
        </p>
        
        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
          <input
            type="text"
            placeholder="请输入你的名字"
            value={user1Name}
            onChange={(e) => setUser1Name(e.target.value)}
            className="w-full p-2.5 sm:p-3 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30 text-sm sm:text-base"
          />
          <input
            type="text"
            placeholder="请输入对方的名字"
            value={user2Name}
            onChange={(e) => setUser2Name(e.target.value)}
            className="w-full p-2.5 sm:p-3 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30 text-sm sm:text-base"
          />
        </div>
        
        <button
          onClick={() => sessionData ? setStage('user2') : setStage('user1')}
          disabled={!user1Name || !user2Name}
          className="w-full bg-gradient-to-r from-qixi-pink to-qixi-purple text-white py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:from-qixi-pink/80 hover:to-qixi-purple/80 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sessionData ? '开始填写' : '开始匹配'}
        </button>
      </div>
    </div>
  );

  const renderUserSelection = (userNumber: number) => (
    <div className="pt-8 sm:pt-12">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">
          {userNumber === 1 ? user1Name : user2Name} 的选择
        </h1>
        <p className="text-sm sm:text-base text-white/80">
          选择你感兴趣的活动，不感兴趣的不用选择。选择后可以设置重要程度（1-5星），
          越喜欢越重要就给越高分。
        </p>
      </div>
      
        
      <InterestSelector
        selectedInterests={userNumber === 1 ? user1Interests : user2Interests}
        onSelectionChange={(interests) => {
          if (userNumber === 1) {
            setUser1Interests(interests);
          } else {
            setUser2Interests(interests);
          }
        }}
      />
      
      <div className="text-center mt-6 sm:mt-8">
        <button
          onClick={() => userNumber === 1 ? handleUser1Complete(user1Interests) : handleUser2Complete(user2Interests)}
          disabled={(userNumber === 1 ? user1Interests : user2Interests).length === 0}
          className="bg-gradient-to-r from-qixi-pink to-qixi-purple text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:from-qixi-pink/80 hover:to-qixi-purple/80 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {userNumber === 1 ? '完成选择，分享给另一个人' : '查看匹配结果'}
        </button>
        
        {userNumber === 2 && sessionData && (
          <button
            onClick={() => setStage('share')}
            className="ml-2 sm:ml-4 bg-white/20 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:bg-white/30 transition-all duration-300"
          >
            重新分享
          </button>
        )}
      </div>
    </div>
  );

  const renderEnterName = () => (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 sm:p-8 shadow-xl max-w-md w-full text-center">
        <div className="text-4xl sm:text-6xl mb-4 sm:mb-6">👤</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">请输入你的名字</h1>
        <p className="text-sm sm:text-base text-white/80 mb-4 sm:mb-6">
          {user1Name} 已经完成了选择，现在轮到你了！
        </p>
        
        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
          <input
            type="text"
            placeholder="请输入你的名字"
            value={user2Name}
            onChange={(e) => setUser2Name(e.target.value)}
            className="w-full p-2.5 sm:p-3 rounded-lg bg-white/20 text-white placeholder-white/60 border border-white/30 text-sm sm:text-base"
          />
        </div>
        
        <div className="space-y-2 sm:space-y-3">
          <button
            onClick={() => setStage('user2')}
            disabled={!user2Name}
            className="w-full bg-gradient-to-r from-qixi-pink to-qixi-purple text-white py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:from-qixi-pink/80 hover:to-qixi-purple/80 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            开始填写
          </button>
        </div>
      </div>
    </div>
  );

  const renderShare = () => {
    if (!sessionData || !user1Name) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 sm:p-8 shadow-xl max-w-md w-full text-center">
            <div className="text-4xl sm:text-6xl mb-4 sm:mb-6">❌</div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">数据丢失</h1>
            <p className="text-sm sm:text-base text-white/80 mb-4 sm:mb-6">
              分享数据丢失，请重新开始。
            </p>
            <button
              onClick={resetApp}
              className="w-full bg-gradient-to-r from-qixi-pink to-qixi-purple text-white py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:from-qixi-pink/80 hover:to-qixi-purple/80 transition-all duration-300"
            >
              重新开始
            </button>
          </div>
        </div>
      );
    }

    let shareLink = '';
    try {
      shareLink = SessionManager.getShareableLinkWithData(sessionData);
    } catch (error) {
      console.error('Failed to generate share link:', error);
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 sm:p-8 shadow-xl max-w-md w-full text-center">
          <div className="text-4xl sm:text-6xl mb-4 sm:mb-6">📱</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">分享给 {sessionData?.user2Name || user2Name}</h1>
          <p className="text-sm sm:text-base text-white/80 mb-4 sm:mb-6">
            {user1Name} 已经完成了选择，请分享下面的链接给 {sessionData?.user2Name || user2Name} 填写。
          </p>
          
          <div className="bg-white/20 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <p className="text-white/60 text-xs sm:text-sm mb-2">分享链接</p>
            <p className="text-white text-xs sm:text-sm break-all">
              {shareLink || '链接生成失败'}
            </p>
          </div>
          
          <div className="space-y-2 sm:space-y-3">
            <button
              onClick={copyShareLink}
              disabled={!shareLink}
              className="w-full bg-gradient-to-r from-qixi-pink to-qixi-purple text-white py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:from-qixi-pink/80 hover:to-qixi-purple/80 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              复制分享链接
            </button>
            
            <button
              onClick={() => setStage('enterName')}
              className="w-full bg-white/20 text-white py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:bg-white/30 transition-all duration-300"
            >
              我就是 {sessionData?.user2Name || user2Name}，开始填写
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      {stage === 'welcome' && renderWelcome()}
      {stage === 'enterName' && renderEnterName()}
      {stage === 'user1' && renderUserSelection(1)}
      {stage === 'share' && renderShare()}
      {stage === 'user2' && renderUserSelection(2)}
      {stage === 'results' && matchResult && (
        <div className="pt-8 sm:pt-12">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">匹配结果</h1>
            <p className="text-sm sm:text-base text-white/80">
              查看你们的兴趣匹配和推荐的约会活动
            </p>
          </div>
          
          <MatchResults
            matchResult={matchResult}
            user1Name={user1Name}
            user2Name={user2Name}
          />
          
          <div className="text-center mt-6 sm:mt-8">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <button
                onClick={copyResultsLink}
                className="w-full sm:w-auto bg-gradient-to-r from-qixi-blue to-qixi-purple text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:from-qixi-blue/80 hover:to-qixi-purple/80 transition-all duration-300"
              >
                分享结果
              </button>
              
              <button
                onClick={resetApp}
                className="w-full sm:w-auto bg-gradient-to-r from-qixi-pink to-qixi-purple text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:from-qixi-pink/80 hover:to-qixi-purple/80 transition-all duration-300"
              >
                重新开始
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
