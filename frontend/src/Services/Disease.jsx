import api from './Api';

export const diseaseService = {
  async detectDisease(imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await api.post('/disease/detect', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getDiseaseInfo(diseaseName, language = 'en') {
    const response = await api.post('/chatbot/query', {
      query: `Tell me about ${diseaseName} plant disease, its symptoms, causes, and treatment methods.`,
      language,
      context: 'disease_info'
    });
    return response.data;
  }
};