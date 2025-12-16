import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button, Table, Tag, Space, Input, Modal, message, Card } from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  EditOutlined, 
  BarChartOutlined, 
  DeleteOutlined, 
  SendOutlined,
  CopyOutlined
} from '@ant-design/icons';
import { fetchQuestionnaires, deleteQuestionnaire, createQuestionnaire } from '../store/questionnaireSlice.js';
import { v4 as uuidv4 } from 'uuid'; // 如果没有uuid库，可以用 Date.now() 模拟

const { Search } = Input;
 
const ListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, loading } = useSelector((state) => state.questionnaire);
  const [searchText, setSearchText] = useState('');

  // 初始化加载数据
  useEffect(() => {
    dispatch(fetchQuestionnaires());
  }, [dispatch]);

  // 处理新建问卷
  const handleCreate = async () => {
    const newId = `q-${Date.now()}`;
    const newQuestionnaire = {
      id: newId,
      title: '未命名问卷',
      desc: '请输入问卷描述...',
      status: 'draft',
      createTime: Date.now(),
      updateTime: Date.now(),
      questions: [],
      answerList: []
    };
    
    try {
      await dispatch(createQuestionnaire(newQuestionnaire)).unwrap();
      message.success('创建成功');
      navigate(`/edit/${newId}`);
    } catch (error) {
      message.error('创建失败');
    }
  };

  // 处理删除
  const handleDelete = (id) => {
    Modal.confirm({
      title: '确认删除该问卷吗？',
      content: '删除后无法恢复，且已收集的答卷数据也会丢失。',
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await dispatch(deleteQuestionnaire(id)).unwrap();
          message.success('删除成功');
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  // 复制链接
  const handleCopyLink = (id) => {
    const url = `${window.location.origin}/#/answer/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      message.success('答题链接已复制到剪贴板');
    });
  };

  // 表格列定义
  const columns = [
    {
      title: '问卷标题',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <div className="font-bold text-lg text-gray-800">{text}</div>
          <div className="text-gray-400 text-sm truncate max-w-xs">{record.desc}</div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 'published' ? 'green' : 'orange'}>
          {status === 'published' ? '已发布' : '草稿'}
        </Tag>
      ),
    },
    {
      title: '答卷数',
      dataIndex: 'answerList',
      key: 'count',
      width: 100,
      render: (list) => <span className="text-blue-600 font-semibold">{list ? list.length : 0}</span>,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
      render: (time) => new Date(time).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 350,
      render: (_, record) => (
        <Space size="middle">
          <Button 
            icon={<EditOutlined />} 
            onClick={() => navigate(`/edit/${record.id}`)}
          >
            编辑
          </Button>
          <Button 
            icon={<SendOutlined />} 
            disabled={record.status !== 'published'}
            onClick={() => handleCopyLink(record.id)}
          >
            分享
          </Button>
          <Button 
            icon={<BarChartOutlined />} 
            onClick={() => navigate(`/result/${record.id}`)}
            disabled={!record.answerList || record.answerList.length === 0}
          >
            统计
          </Button>
          <Button 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
          {/* 方便测试用的按钮：直接跳转填写页 */}
          {record.status === 'published' && (
             <Button type="link" size="small" onClick={() => window.open(`/#/answer/${record.id}`, '_blank')}>
               去填写
             </Button>
          )}
        </Space>
      ),
    },
  ];

  // 筛选逻辑
  const filteredList = list.filter(item => 
    item.title.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-700">我的问卷</h2>
        <Button 
          type="primary" 
          size="large" 
          icon={<PlusOutlined />} 
          onClick={handleCreate}
        >
          新建问卷
        </Button>
      </div>

      <Card>
        <div className="mb-4 flex items-center gap-4">
          <Search 
            placeholder="搜索问卷标题..." 
            allowClear 
            onSearch={setSearchText} 
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 300 }} 
          />
        </div>
        
        <Table 
          columns={columns} 
          dataSource={filteredList} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 8 }}
        />
      </Card>
    </div>
  );
};

export default ListPage;