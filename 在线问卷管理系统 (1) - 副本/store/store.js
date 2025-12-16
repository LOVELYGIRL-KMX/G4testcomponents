import { configureStore } from '@reduxjs/toolkit';
import questionnaireReducer from './questionnaireSlice.js';

export const store = configureStore({
  reducer: {
    questionnaire: questionnaireReducer,
  },
});