import React, { useState } from 'react';
import MainLayout from '../components/layout/mainlayout';
import ChatInterface from '../components/chat/chatinterface';
import DiseaseDetection from '../components/Disease/DiseaseDetection';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <MainLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'chat' ? (
        <ChatInterface />
      ) : (
        <DiseaseDetection />
      )}
    </MainLayout>
  );
};

export default Dashboard;