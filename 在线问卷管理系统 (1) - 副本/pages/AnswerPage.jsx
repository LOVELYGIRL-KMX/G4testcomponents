import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Form, Button, Radio, Checkbox, Input, Card, message, Result, Spin, Divider } from 'antd';
import api from '../services/api.js';
import { submitAnswer } from '../store/questionnaireSlice.js';

const { TextArea } = Input;

const AnswerPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  // 答题页通常不依赖 Redux 中的 list 状态，而是独立获取，以保证即使用户直接打开链接也能加载
  const [questionnaire, setQuestionnaire] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await api.get(`/questionnaires/${id}`);
        if (data.status !== 'published') {
          message.error('该问卷尚未发布或已暂停收集');
          // 实际场景可能需要显示特定错误页，这里简单处理
        }
        setQuestionnaire(data);
      } catch (error) {
        message.error('问卷不存在或加载失败');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const onFinish = async (values) => {
    // 构造答案数据结构
    // values 格式: { q1: "optionId", q2: ["o1", "o2"], q3: "text" }
    const answerData = {
      submitTime: Date.now(),
      answers: values
    };

    setSubmitting(true);
    try {
      await dispatch(submitAnswer({ id, answerData })).unwrap();
      setCompleted(true);
      message.success('提交成功！');
    } catch (error) {
      message.error('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-20 text-center"><Spin size="large" /></div>;

  if (completed) {
    return (
      <Result
        status="success"
        title="感谢您的参与！"
        subTitle="您的回答已成功提交。"
        extra={[
          <Button type="primary" key="close" onClick={() => window.close()}>
            关闭页面
          </Button>,
        ]}
      />
    );
  }

  if (!questionnaire || questionnaire.status !== 'published') {
    return (
      <Result
        status="404"
        title="问卷不可用"
        subTitle="该问卷可能已被删除、未发布或停止收集。"
      />
    );
  }

  return (
    <div className="p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{questionnaire.title}</h1>
        <p className="text-gray-500">{questionnaire.desc}</p>
      </div>
      
      <Divider />

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        size="large"
        scrollToFirstError
      >
        {questionnaire.questions.map((q, index) => (
          <Card key={q.id} className="mb-6 shadow-sm hover:shadow-md transition-shadow">
            <Form.Item
              name={q.id}
              label={<span className="text-lg font-medium text-gray-800">{index + 1}. {q.title}</span>}
              rules={[{ required: true, message: '此题为必答题' }]}
            >
              {q.type === 'radio' && (
                <Radio.Group className="flex flex-col gap-3 mt-2">
                  {q.options.map(opt => (
                    <Radio key={opt.id} value={opt.id}>{opt.text}</Radio>
                  ))}
                </Radio.Group>
              )}

              {q.type === 'checkbox' && (
                <Checkbox.Group className="flex flex-col gap-3 mt-2">
                  {q.options.map(opt => (
                    <Checkbox key={opt.id} value={opt.id}>{opt.text}</Checkbox>
                  ))}
                </Checkbox.Group>
              )}

              {q.type === 'text' && (
                <TextArea rows={4} placeholder="请输入您的回答..." />
              )}
            </Form.Item>
          </Card>
        ))}

        <div className="text-center mt-8 pb-8">
          <Button 
            type="primary" 
            htmlType="submit" 
            size="large" 
            className="w-full md:w-64 h-12 text-lg font-bold rounded-full shadow-lg hover:scale-105 transition-transform"
            loading={submitting}
          >
            提交问卷
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default AnswerPage;