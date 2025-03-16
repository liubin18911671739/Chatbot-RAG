// This file contains functions to interact with the backend API for the RAG QA system.

import axios from 'axios';

const API_BASE_URL = process.env.VUE_APP_API_BASE_URL || 'http://localhost:5000/api';

// Function to get available agents
export const getAgents = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/agents`);
        return response.data;
    } catch (error) {
        console.error('Error fetching agents:', error);
        throw error;
    }
};

// Function to send a question to the selected agent
export const sendQuestion = async (agentId, question) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/chat`, {
            agentId,
            question
        });
        return response.data;
    } catch (error) {
        console.error('Error sending question:', error);
        throw error;
    }
};

// Function to get user chat history
export const getChatHistory = async (userId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/history/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching chat history:', error);
        throw error;
    }
};

// Function to upload documents for the agent
export const uploadDocument = async (formData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error uploading document:', error);
        throw error;
    }
};