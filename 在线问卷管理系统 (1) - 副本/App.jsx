import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import ListPage from './pages/ListPage.jsx';
import EditPage from './pages/EditPage.jsx';
import AnswerPage from './pages/AnswerPage.jsx';
import ResultPage from './pages/ResultPage.jsx';

const { Header, Content, Footer } = Layout;

// 布局组件
const MainLayout = ({ children }) => (
  <Layout className="min-h-screen">
    <Header className="bg-white border-b px-8 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      <div className="text-xl font-bold text-primary flex items-center gap-2">
        <span className="text-2xl">📝</span> 在线问卷管理系统
      </div>
      <div className="text-gray-500 text-sm">React + Redux + Ant Design</div>
    </Header>
    <Content className="p-6 bg-gray-50 flex justify-center">
      <div className="w-full max-w-[1200px]">
        {children}
      </div>
    </Content>
    <Footer className="text-center text-gray-400 bg-gray-50">
      Online Questionnaire System ©2025 Created by Frontend Engineer
    </Footer>
  </Layout>
);

// 答题页不需要通用头部，使用独立布局
const AnswerLayout = ({ children }) => (
  <div className="min-h-screen bg-blue-50 py-10 px-4">
    <div className="max-w-[800px] mx-auto bg-white shadow-xl rounded-xl overflow-hidden">
      {children}
    </div>
  </div>
);

const App = () => {
  return (
    <HashRouter>
      <Routes>
        {/* 管理端路由 */}
        <Route path="/list" element={<MainLayout><ListPage /></MainLayout>} />
        <Route path="/edit/:id" element={<MainLayout><EditPage /></MainLayout>} />
        <Route path="/result/:id" element={<MainLayout><ResultPage /></MainLayout>} />
        
        {/* 用户端答题路由 */}
        <Route path="/answer/:id" element={<AnswerLayout><AnswerPage /></AnswerLayout>} />

        {/* 默认跳转 */}
        <Route path="/" element={<Navigate to="/list" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;