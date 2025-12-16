import api from './Api';

export const chatbotService = {
  async sendQuery(query, language = 'en') {
    const response = await api.post('/chatbot/query', {
      query,
      language
    });
    return response.data;
  },

  async getChatHistory() {
    const response = await api.get('/chatbot/history');
    return response.data;
  },

  async clearHistory() {
    const response = await api.delete('/chatbot/history');
    return response.data;
  }
};