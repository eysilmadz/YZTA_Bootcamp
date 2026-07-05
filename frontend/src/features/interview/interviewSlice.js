import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  interviewHistory: [],
  transcript: [],
  agentResponses: [],
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null
};

export const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    addTranscriptMessage: (state, action) => {
      state.transcript.push(action.payload);
    },
    addAgentResponse: (state, action) => {
      state.agentResponses.push(action.payload);
    },
    setInterviewHistory: (state, action) => {
      state.interviewHistory = action.payload;
    },
    clearSession: (state) => {
      state.transcript = [];
      state.agentResponses = [];
      state.status = 'idle';
      state.error = null;
    }
  },
});

export const { 
  addTranscriptMessage, 
  addAgentResponse, 
  setInterviewHistory, 
  clearSession 
} = interviewSlice.actions;

export default interviewSlice.reducer;
