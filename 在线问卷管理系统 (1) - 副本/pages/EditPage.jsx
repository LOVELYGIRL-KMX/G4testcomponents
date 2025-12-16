import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Layout, Button, Input, Form, Space, Radio, Checkbox, Card, Empty, message, Popconfirm, Tag } from 'antd';
import { 
  SaveOutlined, 
  CloudUploadOutlined, 
  ArrowLeftOutlined,
  HolderOutlined,
  DeleteOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { fetchQuestionnaireById, updateQuestionnaire, clearCurrentDetails } from '../store/questionnaireSlice.js';

const { Sider, Content } = Layout;
const { TextArea } = Input;

// 组件：题目类型图标
const TypeIcon = ({ type }) => {
  const map = {
    radio: <Tag color="blue">单选</Tag>,
    checkbox: <Tag color="green">多选</Tag>,
    text: <Tag color="orange">文本</Tag>
  };
  return map[type] || <Tag>未知</Tag>;
};

const EditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentDetails } = useSelector((state) => state.questionnaire);

  // 本地状态：为了编辑性能，先在本地 state 操作，保存时再提交 Redux
  const [questionnaire, setQuestionnaire] = useState(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState(null);

  // 初始化加载
  useEffect(() => {
    if (id) {
      dispatch(fetchQuestionnaireById(id)).unwrap()
        .then(data => {
          setQuestionnaire(data);
          if (data.questions.length > 0) {
            setSelectedQuestionId(data.questions[0].id);
          }
        })
        .catch(() => message.error('加载问卷失败'));
    }
    return () => {
      dispatch(clearCurrentDetails());
    };
  }, [dispatch, id]);

  // 保存问卷
  const handleSave = async (isPublish = false) => {
    if (!questionnaire.title.trim()) {
      return message.error('问卷标题不能为空');
    }
    
    // 校验题目
    if (questionnaire.questions.length === 0) {
      return message.warning('请至少添加一个问题');
    }

    const dataToSave = {
      ...questionnaire,
      status: isPublish ? 'published' : 'draft',
      updateTime: Date.now()
    };

    try {
      await dispatch(updateQuestionnaire({ id: questionnaire.id, data: dataToSave })).unwrap();
      message.success(isPublish ? '问卷已发布' : '草稿已保存');
      if (isPublish) {
        navigate('/list');
      }
    } catch (error) {
      message.error('保存失败');
    }
  };

  // 拖拽结束处理
  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(questionnaire.questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setQuestionnaire({ ...questionnaire, questions: items });
  };

  // 添加问题
  const addQuestion = (type) => {
    const newId = `q-${Date.now()}`;
    const newQuestion = {
      id: newId,
      type,
      title: type === 'text' ? '请输入问题标题' : `新的${type === 'radio' ? '单选' : '多选'}问题`,
      options: type === 'text' ? [] : [
        { id: `o-${Date.now()}-1`, text: '选项 1' },
        { id: `o-${Date.now()}-2`, text: '选项 2' }
      ]
    };
    
    setQuestionnaire(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
    setSelectedQuestionId(newId);
  };

  // 删除问题
  const deleteQuestion = (e, qId) => {
    e.stopPropagation();
    const newQuestions = questionnaire.questions.filter(q => q.id !== qId);
    setQuestionnaire({ ...questionnaire, questions: newQuestions });
    if (selectedQuestionId === qId) {
      setSelectedQuestionId(null);
    }
  };

  // 更新当前选中的问题属性
  const updateCurrentQuestion = (key, value) => {
    const newQuestions = questionnaire.questions.map(q => {
      if (q.id === selectedQuestionId) {
        return { ...q, [key]: value };
      }
      return q;
    });
    setQuestionnaire({ ...questionnaire, questions: newQuestions });
  };

  // 更新选项
  const updateOption = (oIndex, text) => {
    const newQuestions = questionnaire.questions.map(q => {
      if (q.id === selectedQuestionId) {
        const newOptions = [...q.options];
        newOptions[oIndex].text = text;
        return { ...q, options: newOptions };
      }
      return q;
    });
    setQuestionnaire({ ...questionnaire, questions: newQuestions });
  };

  // 添加选项
  const addOption = () => {
    const newQuestions = questionnaire.questions.map(q => {
      if (q.id === selectedQuestionId) {
        return {
          ...q,
          options: [...q.options, { id: `o-${Date.now()}`, text: `新选项` }]
        };
      }
      return q;
    });
    setQuestionnaire({ ...questionnaire, questions: newQuestions });
  };

  // 删除选项
  const deleteOption = (oIndex) => {
     const newQuestions = questionnaire.questions.map(q => {
      if (q.id === selectedQuestionId) {
        const newOptions = [...q.options];
        newOptions.splice(oIndex, 1);
        return { ...q, options: newOptions };
      }
      return q;
    });
    setQuestionnaire({ ...questionnaire, questions: newQuestions });
  };

  if (!questionnaire) return <div className="p-10 text-center">加载中...</div>;

  const currentQuestion = questionnaire.questions.find(q => q.id === selectedQuestionId);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* 顶部工具栏 */}
      <div className="mb-4 bg-white p-4 rounded-lg shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/list')}>返回列表</Button>
          <div className="w-[1px] h-6 bg-gray-200"></div>
          <Input 
            value={questionnaire.title} 
            onChange={e => setQuestionnaire({...questionnaire, title: e.target.value})}
            className="text-lg font-bold border-transparent hover:border-gray-300 focus:border-blue-500 w-96"
            placeholder="请输入问卷标题"
          />
        </div>
        <Space>
          <Button icon={<SaveOutlined />} onClick={() => handleSave(false)}>保存草稿</Button>
          <Button type="primary" icon={<CloudUploadOutlined />} onClick={() => handleSave(true)}>发布问卷</Button>
        </Space>
      </div>

      <Layout className="flex-1 bg-transparent gap-4">
        {/* 左侧：题目列表 (拖拽区域) */}
        <Sider width={320} className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b bg-gray-50 font-bold text-gray-600">题目大纲</div>
          <div className="flex-1 overflow-y-auto p-2">
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="questions-list">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {questionnaire.questions.map((q, index) => (
                      <Draggable key={q.id} draggableId={q.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            onClick={() => setSelectedQuestionId(q.id)}
                            className={`
                              p-3 rounded border cursor-pointer flex items-center gap-2 group transition-all
                              ${selectedQuestionId === q.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'}
                              ${snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-500 z-50' : ''}
                            `}
                          >
                            <div {...provided.dragHandleProps} className="text-gray-400 cursor-grab active:cursor-grabbing px-1">
                              <HolderOutlined />
                            </div>
                            <div className="flex-1 truncate text-sm">
                              <span className="font-bold mr-2">{index + 1}.</span>
                              {q.title}
                            </div>
                            <TypeIcon type={q.type} />
                            <Button 
                              type="text" 
                              size="small" 
                              danger 
                              className="opacity-0 group-hover:opacity-100"
                              icon={<DeleteOutlined />}
                              onClick={(e) => deleteQuestion(e, q.id)}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            
            {questionnaire.questions.length === 0 && (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无题目" />
            )}

            <div className="mt-4 grid grid-cols-3 gap-2">
              <Button dashed onClick={() => addQuestion('radio')}>+ 单选</Button>
              <Button dashed onClick={() => addQuestion('checkbox')}>+ 多选</Button>
              <Button dashed onClick={() => addQuestion('text')}>+ 文本</Button>
            </div>
          </div>
        </Sider>

        {/* 右侧：编辑区域 */}
        <Content className="bg-white rounded-lg shadow-sm p-8 overflow-y-auto">
          {currentQuestion ? (
            <div className="max-w-[600px] mx-auto animate-fadeIn">
              <div className="mb-6 pb-4 border-b">
                 <h3 className="text-lg font-bold mb-4 text-gray-700">编辑题目</h3>
                 <div className="space-y-4">
                   <div>
                     <label className="block text-gray-500 mb-1 text-sm">题目名称</label>
                     <TextArea 
                       rows={2}
                       value={currentQuestion.title} 
                       onChange={e => updateCurrentQuestion('title', e.target.value)}
                       placeholder="请输入问题描述"
                     />
                   </div>
                 </div>
              </div>

              {/* 选项编辑区 (仅单选/多选) */}
              {(currentQuestion.type === 'radio' || currentQuestion.type === 'checkbox') && (
                <div>
                  <label className="block text-gray-500 mb-2 text-sm">选项配置</label>
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, idx) => (
                      <div key={option.id} className="flex items-center gap-2">
                        {currentQuestion.type === 'radio' ? <Radio disabled /> : <Checkbox disabled />}
                        <Input 
                          value={option.text} 
                          onChange={e => updateOption(idx, e.target.value)}
                          placeholder={`选项 ${idx + 1}`}
                        />
                        <Button 
                          type="text" 
                          danger 
                          icon={<DeleteOutlined />} 
                          onClick={() => deleteOption(idx)}
                          disabled={currentQuestion.options.length <= 1}
                        />
                      </div>
                    ))}
                    <Button type="dashed" block icon={<PlusOutlined />} onClick={addOption}>
                      添加选项
                    </Button>
                  </div>
                </div>
              )}

              {currentQuestion.type === 'text' && (
                <div className="p-8 bg-gray-50 text-center text-gray-400 rounded border border-dashed">
                  文本题无需配置选项，用户将输入文字回答。
                </div>
              )}

            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 flex-col gap-4">
              <div className="text-4xl">👈</div>
              <div>请在左侧选择或添加题目进行编辑</div>
            </div>
          )}
        </Content>
      </Layout>
    </div>
  );
};

export default EditPage;