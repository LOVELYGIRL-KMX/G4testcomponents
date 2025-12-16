import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api.js';

// 异步 Action：获取问卷列表
export const fetchQuestionnaires = createAsyncThunk(
  'questionnaire/fetchAll',
  async () => {
    const response = await api.get('/questionnaires');
    // json-server 返回的是数组，如果有分页则可能结构不同，这里假设直接返回数组
    return response.sort((a, b) => b.createTime - a.createTime); // 按时间倒序
  }
);

// 异步 Action：获取单个问卷详情
export const fetchQuestionnaireById = createAsyncThunk(
  'questionnaire/fetchOne',
  async (id) => {
    const response = await api.get(`/questionnaires/${id}`);
    return response;
  }
);

// 异步 Action：创建问卷
export const createQuestionnaire = createAsyncThunk(
  'questionnaire/create',
  async (data) => {
    const response = await api.post('/questionnaires', data);
    return response;
  }
);

// 异步 Action：更新问卷 (保存/发布)
export const updateQuestionnaire = createAsyncThunk(
  'questionnaire/update',
  async ({ id, data }) => {
    const response = await api.put(`/questionnaires/${id}`, data);
    return response;
  }
);

// 异步 Action：删除问卷
export const deleteQuestionnaire = createAsyncThunk(
  'questionnaire/delete',
  async (id) => {
    await api.delete(`/questionnaires/${id}`);
    return id;
  }
);

// 异步 Action：提交答卷 (实际上是更新问卷的 answerList 字段)
export const submitAnswer = createAsyncThunk(
  'questionnaire/submitAnswer',
  async ({ id, answerData }) => {
    // 1. 先获取当前问卷最新数据
    const currentQ = await api.get(`/questionnaires/${id}`);
    // 2. 将新答案追加到 answerList
    const updatedAnswerList = [...(currentQ.answerList || []), answerData];
    // 3. 更新问卷
    const response = await api.patch(`/questionnaires/${id}`, {
      answerList: updatedAnswerList
    });
    return response;
  }
);

const questionnaireSlice = createSlice({
  name: 'questionnaire',
  initialState: {
    list: [],
    currentDetails: null, // 当前正在编辑或查看的问卷详情
    loading: false,
    error: null,
  },
  reducers: {
    // 清空当前详情，用于新建或退出编辑时
    clearCurrentDetails: (state) => {
      state.currentDetails = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // 获取列表
      .addCase(fetchQuestionnaires.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchQuestionnaires.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchQuestionnaires.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // 获取详情
      .addCase(fetchQuestionnaireById.fulfilled, (state, action) => {
        state.currentDetails = action.payload;
      })
      // 创建
      .addCase(createQuestionnaire.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      // 删除
      .addCase(deleteQuestionnaire.fulfilled, (state, action) => {
        state.list = state.list.filter(q => q.id !== action.payload);
      })
      // 更新
      .addCase(updateQuestionnaire.fulfilled, (state, action) => {
        const index = state.list.findIndex(q => q.id === action.payload.id);
        if (index !== -1) {
          state.list[index] = action.payload;
        }
        state.currentDetails = action.payload;
      });
  },
});

export const { clearCurrentDetails } = questionnaireSlice.actions;
export default questionnaireSlice.reducer;