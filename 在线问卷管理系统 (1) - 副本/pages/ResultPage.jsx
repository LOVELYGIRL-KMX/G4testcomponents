import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Card, Spin, message, Button, Statistic, Row, Col, Progress, Table } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import api from '../services/api.js';

// 预定义图表颜色
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

const ResultPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await api.get(`/questionnaires/${id}`);
      setData(result);
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (loading) return <div className="p-20 text-center"><Spin size="large" /></div>;
  if (!data) return <div className="p-20 text-center">无数据</div>;

  const totalAnswers = data.answerList ? data.answerList.length : 0;

  // 统计逻辑
  const getStatsForQuestion = (question) => {
    if (!data.answerList || data.answerList.length === 0) return [];

    // 初始化计数器
    const statsMap = {};
    if (question.type !== 'text') {
        question.options.forEach(opt => {
            statsMap[opt.id] = { name: opt.text, count: 0 };
        });
    }

    // 遍历所有答卷
    data.answerList.forEach(submission => {
      const answer = submission.answers[question.id];
      if (!answer) return;

      if (Array.isArray(answer)) {
        // 多选
        answer.forEach(optId => {
          if (statsMap[optId]) statsMap[optId].count++;
        });
      } else {
        // 单选
        if (statsMap[answer]) statsMap[answer].count++;
      }
    });

    // 转换为图表数据格式
    return Object.values(statsMap);
  };

  // 获取文本题的回答列表
  const getTextAnswers = (qId) => {
      if (!data.answerList) return [];
      return data.answerList
        .map(sub => sub.answers[qId])
        .filter(val => val && val.trim() !== '');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/list')}>返回列表</Button>
        <h2 className="text-2xl font-bold">{data.title} - 数据统计</h2>
        <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新数据</Button>
      </div>

      <Row gutter={16}>
        <Col span={24}>
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
            <Statistic title="总回收答卷数" value={totalAnswers} valueStyle={{ color: '#1677ff', fontSize: '32px' }} />
          </Card>
        </Col>
      </Row>

      {totalAnswers === 0 ? (
        <Card>
          <div className="text-center py-10 text-gray-400">暂无答卷数据，请先分享问卷收集回答。</div>
        </Card>
      ) : (
        <div className="space-y-6">
          {data.questions.map((q, index) => {
            const chartData = getStatsForQuestion(q);
            
            return (
              <Card key={q.id} title={`${index + 1}. ${q.title} [${q.type === 'radio' ? '单选' : q.type === 'checkbox' ? '多选' : '文本'}]`}>
                
                {/* 选择题：显示柱状图 */}
                {(q.type === 'radio' || q.type === 'checkbox') && (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        layout="vertical" // 横向柱状图更适合展示选项文字
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={150} />
                        <Tooltip cursor={{fill: 'transparent'}} />
                        <Legend />
                        <Bar dataKey="count" name="选择人数" fill="#1677ff" barSize={30} label={{ position: 'right' }}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* 文本题：显示列表 */}
                {q.type === 'text' && (
                   <div className="max-h-60 overflow-y-auto border rounded bg-gray-50 p-4">
                       <ul className="list-disc pl-5 space-y-2">
                           {getTextAnswers(q.id).map((ans, idx) => (
                               <li key={idx} className="text-gray-700">{ans}</li>
                           ))}
                           {getTextAnswers(q.id).length === 0 && <li className="text-gray-400 list-none">暂无文本回答</li>}
                       </ul>
                   </div>
                )}

                {/* 选择题额外数据表格展示 */}
                {(q.type === 'radio' || q.type === 'checkbox') && (
                    <div className="mt-4">
                         <Table 
                            dataSource={chartData} 
                            rowKey="name"
                            pagination={false}
                            size="small"
                            columns={[
                                { title: '选项', dataIndex: 'name', key: 'name' },
                                { title: '小计', dataIndex: 'count', key: 'count' },
                                { 
                                    title: '占比', 
                                    key: 'percent', 
                                    render: (_, record) => (
                                        <Progress percent={totalAnswers > 0 ? Math.round((record.count / totalAnswers) * 100) : 0} size="small" />
                                    ) 
                                }
                            ]}
                         />
                    </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ResultPage;