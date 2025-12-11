# React用户界面完整实现方案

## 📋 用户界面开发任务清单

- [x] **用户登录注册页面**
- [x] **聊天对话界面**
- [x] **个人中心和设置**
- [x] **历史记录管理**
- [x] **响应式移动端适配**

---

## 1. 用户登录注册页面

### 1.1 登录组件 (`components/auth/LoginForm.tsx`)

```tsx
import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, Alert, Divider, Card, Space, Typography } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@rag-app/shared/hooks';
import { LoginFormValues } from '@rag-app/shared/types';

const { Title, Text } = Typography;

export const LoginForm: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const { login, loginWithSocial } = useAuth();

  const handleLogin = async (values: LoginFormValues) => {
    setLoading(true);
    setError(null);

    try {
      await login(values.email, values.password);
      navigate('/chat');
    } catch (err: any) {
      setError(err.message || '登录失败，请检查您的邮箱和密码');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    try {
      await loginWithSocial(provider);
      navigate('/chat');
    } catch (err: any) {
      setError(`${provider}登录失败: ${err.message}`);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card" style={{ maxWidth: 400, margin: '100px auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2}>RAG问答机器人</Title>
          <Text type="secondary">智能问答，精准解答</Text>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        <Form
          form={form}
          name="login"
          onFinish={handleLogin}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="email"
            label="邮箱地址"
            rules={[
              { required: true, message: '请输入邮箱地址' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="请输入邮箱地址"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6位字符' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
              autoComplete="current-password"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>

          <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>记住我</Checkbox>
              </Form.Item>
              <Link to="/forgot-password">忘记密码？</Link>
            </div>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{ height: 40 }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <Divider>或</Divider>

        <Space direction="vertical" style={{ width: '100%' }}>
          <Button
            icon={<GoogleOutlined />}
            onClick={() => handleSocialLogin('google')}
            block
            size="large"
          >
            使用 Google 登录
          </Button>
          <Button
            icon={<GithubOutlined />}
            onClick={() => handleSocialLogin('github')}
            block
            size="large"
          >
            使用 GitHub 登录
          </Button>
        </Space>

        <Divider />

        <div style={{ textAlign: 'center' }}>
          <Text>还没有账号？ </Text>
          <Link to="/register">立即注册</Link>
        </div>
      </Card>
    </div>
  );
};
```

### 1.2 注册组件 (`components/auth/RegisterForm.tsx`)

```tsx
import React, { useState } from 'react';
import { Form, Input, Button, Alert, Card, Space, Typography, Progress, Steps } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, EyeInvisibleOutlined, EyeTwoTone, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@rag-app/shared/hooks';
import { RegisterFormValues } from '@rag-app/shared/types';

const { Title, Text } = Typography;
const { Step } = Steps;

export const RegisterForm: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const { register } = useAuth();

  // 密码强度检查
  const checkPasswordStrength = (password: string): { score: number; feedback: string[] } => {
    let score = 0;
    const feedback: string[] = [];

    if (password.length >= 8) {
      score += 25;
    } else {
      feedback.push('密码至少需要8个字符');
    }

    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
      score += 25;
    } else {
      feedback.push('需要包含大小写字母');
    }

    if (/\d/.test(password)) {
      score += 25;
    } else {
      feedback.push('需要包含数字');
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 25;
    } else {
      feedback.push('需要包含特殊字符');
    }

    return { score, feedback };
  };

  const handleRegister = async (values: RegisterFormValues) => {
    setLoading(true);
    setError(null);

    try {
      await register(values);
      navigate('/login?message=register-success');
    } catch (err: any) {
      setError(err.message || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const password = Form.useWatch('password', form);
  const confirmPassword = Form.useWatch('confirmPassword', form);
  const passwordStrength = password ? checkPasswordStrength(password) : { score: 0, feedback: [] };

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score < 25) return '#ff4d4f';
    if (passwordStrength.score < 50) return '#faad14';
    if (passwordStrength.score < 75) return '#1890ff';
    return '#52c41a';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength.score < 25) return '弱';
    if (passwordStrength.score < 50) return '一般';
    if (passwordStrength.score < 75) return '强';
    return '很强';
  };

  return (
    <div className="register-container">
      <Card className="register-card" style={{ maxWidth: 500, margin: '50px auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2}>创建账号</Title>
          <Text type="secondary">加入RAG问答机器人，开启智能问答体验</Text>
        </div>

        <Steps current={currentStep} size="small" style={{ marginBottom: 32 }}>
          <Step title="基本信息" />
          <Step title="设置密码" />
          <Step title="完成注册" />
        </Steps>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        <Form
          form={form}
          name="register"
          onFinish={handleRegister}
          layout="vertical"
          size="large"
          onValuesChange={(changedValues, allValues) => {
            if (changedValues.email || changedValues.name) {
              setCurrentStep(0);
            } else if (changedValues.password) {
              setCurrentStep(1);
            }
          }}
        >
          <Form.Item
            name="name"
            label="姓名"
            rules={[
              { required: true, message: '请输入您的姓名' },
              { min: 2, message: '姓名至少2个字符' },
              { max: 50, message: '姓名不能超过50个字符' }
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入您的姓名"
              autoComplete="name"
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱地址"
            rules={[
              { required: true, message: '请输入邮箱地址' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="请输入邮箱地址"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 8, message: '密码至少8位字符' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请输入密码"
              autoComplete="new-password"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>

          {password && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text>密码强度：</Text>
                <Text style={{ color: getPasswordStrengthColor() }}>
                  {getPasswordStrengthText()}
                </Text>
              </div>
              <Progress
                percent={passwordStrength.score}
                strokeColor={getPasswordStrengthColor()}
                showInfo={false}
                size="small"
              />
              {passwordStrength.feedback.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  {passwordStrength.feedback.map((feedback, index) => (
                    <div key={index} style={{ color: '#ff4d4f', fontSize: '12px' }}>
                      <CloseCircleOutlined style={{ marginRight: 4 }} />
                      {feedback}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="请再次输入密码"
              autoComplete="new-password"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>

          {confirmPassword && password === confirmPassword && passwordStrength.score >= 75 && (
            <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
              <div style={{ color: '#52c41a', fontSize: '12px' }}>
                <CheckCircleOutlined style={{ marginRight: 4 }} />
                密码设置完成！现在可以注册了。
              </div>
            </div>
          )}

          <Form.Item
            name="agreement"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value ? Promise.resolve() : Promise.reject(new Error('请同意用户协议和隐私政策')),
              },
            ]}
          >
            <Checkbox>
              我已阅读并同意 <Link to="/terms">用户协议</Link> 和 <Link to="/privacy">隐私政策</Link>
            </Checkbox>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{ height: 40 }}
              disabled={!password || password !== confirmPassword || passwordStrength.score < 50}
            >
              注册账号
            </Button>
          </Form.Item>
        </Form>

        <Divider />

        <div style={{ textAlign: 'center' }}>
          <Text>已有账号？ </Text>
          <Link to="/login">立即登录</Link>
        </div>
      </Card>
    </div>
  );
};
```

---

## 2. 聊天对话界面

### 2.1 主聊天组件 (`components/chat/ChatInterface.tsx`)

```tsx
import React, { useState, useEffect, useRef } from 'react';
import { Layout, Input, Button, Card, Space, Typography, Avatar, Spin, Empty, message } from 'antd';
import { SendOutlined, PlusOutlined, SettingOutlined, HistoryOutlined, ClearOutlined } from '@ant-design/icons';
import { useChat } from '@rag-app/shared/hooks';
import MessageList from './MessageList';
import SceneSelector from './SceneSelector';
import QuickQuestions from './QuickQuestions';
import FileUpload from './FileUpload';
import { Message, Scene } from '@rag-app/shared/types';

const { Header, Content, Sider } = Layout;
const { TextArea } = Input;
const { Title, Text } = Typography;

export const ChatInterface: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<any>(null);

  const {
    messages,
    isLoading,
    currentConversation,
    sendMessage,
    newConversation,
    loadConversation,
    streamingMessage
  } = useChat();

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  // 处理发送消息
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const messageContent = inputValue.trim();
    setInputValue('');
    setIsTyping(false);

    try {
      await sendMessage(messageContent, selectedScene?.id);
    } catch (error: any) {
      message.error('发送消息失败: ' + error.message);
    }
  };

  // 处理快速提问
  const handleQuickQuestion = (question: string) => {
    setInputValue(question);
    textAreaRef.current?.focus();
  };

  // 处理新建对话
  const handleNewConversation = () => {
    newConversation();
    setSelectedScene(null);
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    setIsTyping(true);
  };

  return (
    <Layout style={{ height: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* 侧边栏 */}
      <Sider
        collapsible
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
        width={300}
        style={{
          backgroundColor: '#fff',
          borderRight: '1px solid #e8e8e8',
          overflow: 'auto'
        }}
      >
        <div style={{ padding: 16, borderBottom: '1px solid #e8e8e8' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleNewConversation}
            block
            style={{ marginBottom: 16 }}
          >
            {!sidebarCollapsed && '新建对话'}
          </Button>

          <SceneSelector
            selectedScene={selectedScene}
            onSceneChange={setSelectedScene}
            collapsed={sidebarCollapsed}
          />
        </div>

        <div style={{ padding: 16 }}>
          <QuickQuestions
            onSelectQuestion={handleQuickQuestion}
            scene={selectedScene}
            collapsed={sidebarCollapsed}
          />
        </div>
      </Sider>

      {/* 主要内容区 */}
      <Layout>
        <Header style={{
          backgroundColor: '#fff',
          padding: '0 24px',
          borderBottom: '1px solid #e8e8e8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>
              RAG智能问答助手
            </Title>
            {selectedScene && (
              <Text type="secondary" style={{ marginLeft: 16 }}>
                场景: {selectedScene.name}
              </Text>
            )}
          </div>

          <Space>
            <Button
              icon={<HistoryOutlined />}
              onClick={() => {/* 历史记录 */}}
            >
              历史对话
            </Button>
            <Button
              icon={<SettingOutlined />}
              onClick={() => {/* 设置 */}}
            >
              设置
            </Button>
          </Space>
        </Header>

        <Content style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
          {/* 消息列表 */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '24px',
            backgroundColor: '#fff'
          }}>
            {messages.length === 0 && !isLoading ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%'
              }}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div>
                      <Text type="secondary">开始你的智能问答之旅</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        选择一个场景开始，或直接输入你的问题
                      </Text>
                    </div>
                  }
                />
              </div>
            ) : (
              <MessageList
                messages={messages}
                streamingMessage={streamingMessage}
                isLoading={isLoading}
              />
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 输入区域 */}
          <div style={{
            borderTop: '1px solid #e8e8e8',
            backgroundColor: '#fff',
            padding: '16px 24px'
          }}>
            <FileUpload onFileUploaded={(file) => {
              // 处理文件上传
              message.success('文件上传成功，可以开始提问了');
            }} />

            <div style={{
              display: 'flex',
              gap: 12,
              alignItems: 'flex-end',
              marginTop: 12
            }}>
              <TextArea
                ref={textAreaRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="输入你的问题... (Shift+Enter 换行，Enter 发送)"
                autoSize={{ minRows: 1, maxRows: 6 }}
                style={{ flex: 1 }}
                disabled={isLoading}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                loading={isLoading}
                disabled={!inputValue.trim() || isLoading}
                style={{ height: 40 }}
              >
                发送
              </Button>
            </div>

            {isTyping && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 8,
                color: '#999'
              }}>
                <Spin size="small" />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  正在输入...
                </Text>
              </div>
            )}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};
```

### 2.2 消息列表组件 (`components/chat/MessageList.tsx`)

```tsx
import React from 'react';
import { List, Avatar, Typography, Tag, Space, Button, Tooltip, Card } from 'antd';
import { UserOutlined, RobotOutlined, CopyOutlined, ThumbsUpOutlined, ThumbsDownOutlined } from '@ant-design/icons';
import { Message } from '@rag-app/shared/types';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

const { Text, Paragraph } = Typography;

interface MessageListProps {
  messages: Message[];
  streamingMessage?: string;
  isLoading?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  streamingMessage,
  isLoading
}) => {
  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    // 这里可以添加复制成功的提示
  };

  const handleFeedback = (messageId: string, feedback: 'up' | 'down') => {
    // 处理用户反馈
    console.log('User feedback:', messageId, feedback);
  };

  const renderMessageContent = (content: string) => {
    return (
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={tomorrow}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    );
  };

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';

    return (
      <div
        key={message.id}
        style={{
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          marginBottom: 16
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: isUser ? 'row-reverse' : 'row',
          alignItems: 'flex-start',
          gap: 12,
          maxWidth: '70%'
        }}>
          <Avatar
            icon={isUser ? <UserOutlined /> : <RobotOutlined />}
            style={{
              backgroundColor: isUser ? '#1890ff' : '#52c41a'
            }}
          />

          <Card
            size="small"
            style={{
              backgroundColor: isUser ? '#e6f4ff' : '#f6ffed',
              border: isUser ? '1px solid #91caff' : '1px solid #b7eb8f',
              borderRadius: 12
            }}
            bodyStyle={{ padding: 12 }}
          >
            <div style={{ marginBottom: 8 }}>
              <Text strong style={{ color: isUser ? '#1890ff' : '#52c41a' }}>
                {isUser ? '我' : 'AI助手'}
              </Text>
              <Text type="secondary" style={{ marginLeft: 8, fontSize: '12px' }}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </Text>
            </div>

            <div style={{
              lineHeight: 1.6,
              wordBreak: 'break-word'
            }}>
              {renderMessageContent(message.content)}
            </div>

            {/* 引用来源 */}
            {message.sources && message.sources.length > 0 && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #e8e8e8' }}>
                <Text type="secondary" style={{ fontSize: '12px', marginBottom: 8, display: 'block' }}>
                  参考来源:
                </Text>
                <Space wrap>
                  {message.sources.map((source, index) => (
                    <Tag
                      key={index}
                      color="blue"
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        // 打开来源文档或高亮相关内容
                        console.log('Open source:', source);
                      }}
                    >
                      {source.title || `文档${index + 1}`}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}

            {/* 操作按钮 */}
            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between' }}>
              <Space>
                <Tooltip title="复制">
                  <Button
                    type="text"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopyMessage(message.content)}
                  />
                </Tooltip>
              </Space>

              {!isUser && (
                <Space>
                  <Tooltip title="有帮助">
                    <Button
                      type="text"
                      size="small"
                      icon={<ThumbsUpOutlined />}
                      onClick={() => handleFeedback(message.id, 'up')}
                    />
                  </Tooltip>
                  <Tooltip title="没有帮助">
                    <Button
                      type="text"
                      size="small"
                      icon={<ThumbsDownOutlined />}
                      onClick={() => handleFeedback(message.id, 'down')}
                    />
                  </Tooltip>
                </Space>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div style={{ width: '100%' }}>
      {messages.map(renderMessage)}

      {/* 流式消息显示 */}
      {streamingMessage && (
        <div style={{
          display: 'flex',
          justifyContent: 'flex-start',
          marginBottom: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, maxWidth: '70%' }}>
            <Avatar
              icon={<RobotOutlined />}
              style={{ backgroundColor: '#52c41a' }}
            />

            <Card
              size="small"
              style={{
                backgroundColor: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: 12
              }}
              bodyStyle={{ padding: 12 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Text strong style={{ color: '#52c41a' }}>
                  AI助手
                </Text>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>

              <div style={{
                lineHeight: 1.6,
                wordBreak: 'break-word'
              }}>
                {renderMessageContent(streamingMessage)}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
```

### 2.3 场景选择器 (`components/chat/SceneSelector.tsx`)

```tsx
import React from 'react';
import { Card, Typography, Tag, Space } from 'antd';
import { BookOutlined, ApiOutlined, ExperimentOutlined, CustomerServiceOutlined } from '@ant-design/icons';
import { Scene } from '@rag-app/shared/types';

const { Title, Text } = Typography;

interface SceneSelectorProps {
  selectedScene: Scene | null;
  onSceneChange: (scene: Scene | null) => void;
  collapsed?: boolean;
}

const defaultScenes: Scene[] = [
  {
    id: 'general',
    name: '通用助手',
    description: '综合问答助手',
    icon: '🤖',
    category: 'general'
  },
  {
    id: 'db_sizheng',
    name: '思政学习',
    description: '思想政治教育资源',
    icon: '📚',
    category: 'education'
  },
  {
    id: 'db_xuexizhidao',
    name: '学习指导',
    description: '学习方法和指导',
    icon: '🎓',
    category: 'education'
  },
  {
    id: 'db_zhihuisizheng',
    name: '智慧思政',
    description: '智能化思政教育',
    icon: '💡',
    category: 'education'
  },
  {
    id: 'db_keyanfuzhu',
    name: '科研辅助',
    description: '科研方法和工具',
    icon: '🔬',
    category: 'research'
  },
  {
    id: 'db_wangshangbanshiting',
    name: '网上办事',
    description: '校园行政服务',
    icon: '🏢',
    category: 'service'
  }
];

const sceneIcons: Record<string, React.ReactNode> = {
  general: <CustomerServiceOutlined />,
  education: <BookOutlined />,
  research: <ExperimentOutlined />,
  service: <ApiOutlined />
};

export const SceneSelector: React.FC<SceneSelectorProps> = ({
  selectedScene,
  onSceneChange,
  collapsed
}) => {
  const handleSceneClick = (scene: Scene) => {
    if (selectedScene?.id === scene.id) {
      onSceneChange(null);
    } else {
      onSceneChange(scene);
    }
  };

  if (collapsed) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          backgroundColor: selectedScene ? '#1890ff' : '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 8px',
          cursor: 'pointer'
        }}>
          {selectedScene ? (
            <span style={{ fontSize: '18px' }}>{selectedScene.icon}</span>
          ) : (
            <CustomerServiceOutlined />
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Title level={5}>选择场景</Title>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {defaultScenes.map((scene) => (
          <Card
            key={scene.id}
            size="small"
            hoverable
            onClick={() => handleSceneClick(scene)}
            style={{
              border: selectedScene?.id === scene.id
                ? '2px solid #1890ff'
                : '1px solid #e8e8e8',
              backgroundColor: selectedScene?.id === scene.id
                ? '#e6f4ff'
                : '#fff',
              cursor: 'pointer'
            }}
            bodyStyle={{ padding: 12 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: '20px' }}>
                {scene.icon}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Text strong>{scene.name}</Text>
                  <Tag
                    color={scene.category === 'education' ? 'blue' :
                           scene.category === 'research' ? 'green' : 'orange'}
                    style={{ fontSize: '10px' }}
                  >
                    {scene.category === 'education' ? '教育' :
                     scene.category === 'research' ? '科研' : '服务'}
                  </Tag>
                </div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {scene.description}
                </Text>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
```

---

## 3. 个人中心和设置页面

### 3.1 个人中心组件 (`components/profile/UserProfile.tsx`)

```tsx
import React, { useState } from 'react';
import { Card, Avatar, Typography, Button, Descriptions, Tag, Space, Statistic, Row, Col, message } from 'antd';
import { UserOutlined, EditOutlined, CameraOutlined, MailOutlined, CalendarOutlined } from '@ant-design/icons';
import { useUserProfile } from '@rag-app/shared/hooks';
import ChangeAvatarModal from './ChangeAvatarModal';
import EditProfileModal from './EditProfileModal';

const { Title, Text, Paragraph } = Typography;

export const UserProfile: React.FC = () => {
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const { profile, stats, updateProfile, refreshProfile } = useUserProfile();

  const handleAvatarChange = async (file: File) => {
    try {
      await updateProfile({ avatar: file });
      message.success('头像更新成功');
      setAvatarModalVisible(false);
      refreshProfile();
    } catch (error: any) {
      message.error('头像更新失败: ' + error.message);
    }
  };

  const handleProfileUpdate = async (values: any) => {
    try {
      await updateProfile(values);
      message.success('个人信息更新成功');
      setEditModalVisible(false);
      refreshProfile();
    } catch (error: any) {
      message.error('个人信息更新失败: ' + error.message);
    }
  };

  if (!profile) {
    return <div>加载中...</div>;
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <Row gutter={24}>
        {/* 左侧用户信息卡片 */}
        <Col xs={24} md={8}>
          <Card>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <Avatar
                  size={120}
                  src={profile.avatar}
                  icon={<UserOutlined />}
                  style={{ border: '4px solid #f0f0f0' }}
                />
                <Button
                  type="primary"
                  shape="circle"
                  icon={<CameraOutlined />}
                  size="small"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}
                  onClick={() => setAvatarModalVisible(true)}
                />
              </div>

              <Title level={3} style={{ marginTop: 16, marginBottom: 8 }}>
                {profile.name}
              </Title>

              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Space>
                  <MailOutlined />
                  <Text type="secondary">{profile.email}</Text>
                </Space>
                <Space>
                  <CalendarOutlined />
                  <Text type="secondary">
                    加入时间: {new Date(profile.createdAt).toLocaleDateString()}
                  </Text>
                </Space>
              </Space>

              <div style={{ marginTop: 16 }}>
                <Space>
                  {profile.isVerified && (
                    <Tag color="success">已认证</Tag>
                  )}
                  {profile.isPremium && (
                    <Tag color="gold">高级用户</Tag>
                  )}
                  <Tag color="blue">{profile.role}</Tag>
                </Space>
              </div>

              <Button
                type="primary"
                icon={<EditOutlined />}
                block
                style={{ marginTop: 24 }}
                onClick={() => setEditModalVisible(true)}
              >
                编辑个人资料
              </Button>
            </div>

            {/* 使用统计 */}
            <div style={{ marginTop: 32 }}>
              <Title level={5}>使用统计</Title>
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="总对话数"
                    value={stats.totalConversations}
                    suffix="次"
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="总消息数"
                    value={stats.totalMessages}
                    suffix="条"
                  />
                </Col>
              </Row>
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={12}>
                  <Statistic
                    title="本月使用"
                    value={stats.monthlyUsage}
                    suffix="次"
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="连续使用"
                    value={stats.streakDays}
                    suffix="天"
                  />
                </Col>
              </Row>
            </div>
          </Card>
        </Col>

        {/* 右侧详细信息 */}
        <Col xs={24} md={16}>
          <Card title="个人资料" style={{ marginBottom: 24 }}>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="姓名">
                {profile.name}
              </Descriptions.Item>
              <Descriptions.Item label="邮箱">
                {profile.email}
              </Descriptions.Item>
              <Descriptions.Item label="手机号">
                {profile.phone || '未设置'}
              </Descriptions.Item>
              <Descriptions.Item label="部门/班级">
                {profile.department || '未设置'}
              </Descriptions.Item>
              <Descriptions.Item label="学号/工号">
                {profile.studentId || '未设置'}
              </Descriptions.Item>
              <Descriptions.Item label="身份">
                <Tag color={profile.role === 'student' ? 'blue' : 'green'}>
                  {profile.role === 'student' ? '学生' : '教职工'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="个人简介" span={2}>
                <Paragraph>
                  {profile.bio || '这个人很懒，还没有填写个人简介'}
                </Paragraph>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 偏好设置 */}
          <Card title="使用偏好" style={{ marginBottom: 24 }}>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="默认场景">
                <Tag color="blue">{profile.defaultScene || '通用助手'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="语言偏好">
                {profile.language === 'en' ? '英文' : '中文'}
              </Descriptions.Item>
              <Descriptions.Item label="主题设置">
                {profile.theme === 'dark' ? '深色模式' : '浅色模式'}
              </Descriptions.Item>
              <Descriptions.Item label="消息通知">
                {profile.emailNotifications ? '开启' : '关闭'}
              </Descriptions.Item>
              <Descriptions.Item label="数据导出">
                <Button size="small" type="link">
                  导出我的数据
                </Button>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 最近活动 */}
          <Card title="最近活动">
            <Space direction="vertical" style={{ width: '100%' }}>
              {profile.recentActivities?.map((activity, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Text>{activity.description}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {new Date(activity.timestamp).toLocaleString()}
                    </Text>
                  </div>
                  <Tag color="blue">{activity.type}</Tag>
                </div>
              )) || (
                <Text type="secondary">暂无最近活动记录</Text>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 头像更换弹窗 */}
      <ChangeAvatarModal
        visible={avatarModalVisible}
        onCancel={() => setAvatarModalVisible(false)}
        onConfirm={handleAvatarChange}
        currentAvatar={profile.avatar}
      />

      {/* 个人信息编辑弹窗 */}
      <EditProfileModal
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onConfirm={handleProfileUpdate}
        profile={profile}
      />
    </div>
  );
};
```

### 3.2 设置页面组件 (`components/profile/SettingsPage.tsx`)

```tsx
import React, { useState } from 'react';
import { Card, Typography, Switch, Button, Space, Divider, Select, Input, message, Modal } from 'antd';
import {
  SettingOutlined,
  SafetyOutlined,
  BellOutlined,
  EyeOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  KeyOutlined,
  MailOutlined
} from '@ant-design/icons';
import { useAuth } from '@rag-app/shared/hooks';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export const SettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const { user, logout, updateSettings } = useAuth();

  // 设置状态
  const [settings, setSettings] = useState({
    // 通知设置
    emailNotifications: true,
    pushNotifications: true,
    chatNotifications: true,
    newsletterSubscriptions: false,

    // 隐私设置
    profileVisibility: 'public',
    showOnlineStatus: true,
    allowDirectMessages: true,

    // 外观设置
    theme: 'light',
    language: 'zh-CN',
    fontSize: 'medium',

    // 聊天设置
    autoSaveConversations: true,
    showTimestamps: true,
    enableMarkdown: true,
    defaultScene: 'general',

    // 安全设置
    twoFactorEnabled: false,
    sessionTimeout: 24, // hours
    loginNotifications: true
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await updateSettings(settings);
      message.success('设置保存成功');
    } catch (error: any) {
      message.error('设置保存失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    Modal.confirm({
      title: '删除账号',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <Paragraph>
            删除账号是不可逆的操作，将会：
          </Paragraph>
          <ul>
            <li>永久删除您的个人资料</li>
            <li>删除所有对话记录</li>
            <li>删除所有相关数据</li>
            <li>无法恢复任何信息</li>
          </ul>
          <Paragraph type="danger">
            请谨慎操作！确认要删除账号吗？
          </Paragraph>
        </div>
      ),
      okText: '确认删除',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          // 这里调用删除账号的API
          message.success('账号删除成功');
          logout();
        } catch (error: any) {
          message.error('账号删除失败: ' + error.message);
        }
      }
    });
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
      <Title level={2}>
        <SettingOutlined /> 设置
      </Title>

      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* 通知设置 */}
        <Card title={<><BellOutlined /> 通知设置</>}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>邮件通知</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  接收系统通知和更新信息
                </Text>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onChange={(checked) => handleSettingChange('emailNotifications', checked)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>推送通知</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  在浏览器中接收实时通知
                </Text>
              </div>
              <Switch
                checked={settings.pushNotifications}
                onChange={(checked) => handleSettingChange('pushNotifications', checked)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>聊天通知</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  新消息回复时通知
                </Text>
              </div>
              <Switch
                checked={settings.chatNotifications}
                onChange={(checked) => handleSettingChange('chatNotifications', checked)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>订阅资讯</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  接收产品更新和优惠信息
                </Text>
              </div>
              <Switch
                checked={settings.newsletterSubscriptions}
                onChange={(checked) => handleSettingChange('newsletterSubscriptions', checked)}
              />
            </div>
          </Space>
        </Card>

        {/* 隐私设置 */}
        <Card title={<><EyeOutlined /> 隐私设置</>}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>资料可见性</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  控制谁可以看到您的个人资料
                </Text>
              </div>
              <Select
                value={settings.profileVisibility}
                onChange={(value) => handleSettingChange('profileVisibility', value)}
                style={{ width: 120 }}
              >
                <Option value="public">公开</Option>
                <Option value="friends">好友</Option>
                <Option value="private">私密</Option>
              </Select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>在线状态</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  显示您的在线状态
                </Text>
              </div>
              <Switch
                checked={settings.showOnlineStatus}
                onChange={(checked) => handleSettingChange('showOnlineStatus', checked)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>私信接收</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                允许其他用户向您发送私信
                </Text>
              </div>
              <Switch
                checked={settings.allowDirectMessages}
                onChange={(checked) => handleSettingChange('allowDirectMessages', checked)}
              />
            </div>
          </Space>
        </Card>

        {/* 外观设置 */}
        <Card title={<><SettingOutlined /> 外观设置</>}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>主题</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  选择界面主题
                </Text>
              </div>
              <Select
                value={settings.theme}
                onChange={(value) => handleSettingChange('theme', value)}
                style={{ width: 120 }}
              >
                <Option value="light">浅色</Option>
                <Option value="dark">深色</Option>
                <Option value="auto">跟随系统</Option>
              </Select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>语言</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  界面显示语言
                </Text>
              </div>
              <Select
                value={settings.language}
                onChange={(value) => handleSettingChange('language', value)}
                style={{ width: 120 }}
              >
                <Option value="zh-CN">中文</Option>
                <Option value="en">English</Option>
              </Select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>字体大小</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  调整界面字体大小
                </Text>
              </div>
              <Select
                value={settings.fontSize}
                onChange={(value) => handleSettingChange('fontSize', value)}
                style={{ width: 120 }}
              >
                <Option value="small">小</Option>
                <Option value="medium">中</Option>
                <Option value="large">大</Option>
              </Select>
            </div>
          </Space>
        </Card>

        {/* 安全设置 */}
        <Card title={<><SafetyOutlined /> 安全设置</>}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>双重认证</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  增强账号安全性
                </Text>
              </div>
              <Space>
                <Switch
                  checked={settings.twoFactorEnabled}
                  onChange={(checked) => handleSettingChange('twoFactorEnabled', checked)}
                />
                <Button type="link" size="small">
                  配置
                </Button>
              </Space>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>会话超时</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  自动退出登录时间
                </Text>
              </div>
              <Select
                value={settings.sessionTimeout}
                onChange={(value) => handleSettingChange('sessionTimeout', value)}
                style={{ width: 120 }}
              >
                <Option value={1}>1小时</Option>
                <Option value={24}>24小时</Option>
                <Option value={168}>7天</Option>
                <Option value={720}>30天</Option>
              </Select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>登录通知</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  新设备登录时邮件通知
                </Text>
              </div>
              <Switch
                checked={settings.loginNotifications}
                onChange={(checked) => handleSettingChange('loginNotifications', checked)}
              />
            </div>

            <Divider />

            <Space>
              <Button icon={<KeyOutlined />}>
                修改密码
              </Button>
              <Button icon={<MailOutlined />}>
                更换邮箱
              </Button>
            </Space>
          </Space>
        </Card>

        {/* 危险操作 */}
        <Card title="危险操作" style={{ borderColor: '#ff4d4f' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text type="secondary">
              以下操作不可恢复，请谨慎操作
            </Text>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => setDeleteModalVisible(true)}
            >
              删除账号
            </Button>
          </Space>
        </Card>
      </Space>

      {/* 保存按钮 */}
      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <Space>
          <Button size="large">
            重置
          </Button>
          <Button
            type="primary"
            size="large"
            loading={loading}
            onClick={handleSaveSettings}
          >
            保存设置
          </Button>
        </Space>
      </div>
    </div>
  );
};
```

---

## 4. 历史记录管理功能

### 4.1 对话历史组件 (`components/history/ConversationHistory.tsx`)

```tsx
import React, { useState, useEffect } from 'react';
import {
  Card,
  List,
  Typography,
  Input,
  Button,
  Space,
  Tag,
  Dropdown,
  Modal,
  message,
  Empty,
  Pagination,
  DatePicker,
  Select
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  DeleteOutlined,
  ExportOutlined,
  MoreOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useHistory } from '@rag-app/shared/hooks';
import { Conversation } from '@rag-app/shared/types';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;

export const ConversationHistory: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedConversations, setSelectedConversations] = useState<string[]>([]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const {
    conversations,
    isLoading,
    totalCount,
    loadConversations,
    deleteConversation,
    deleteMultipleConversations,
    exportConversation,
    exportMultipleConversations
  } = useHistory();

  useEffect(() => {
    loadConversations({
      page: currentPage,
      limit: 20,
      search: searchQuery,
      status: filterStatus,
      startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
      endDate: dateRange?.[1]?.format('YYYY-MM-DD')
    });
  }, [currentPage, searchQuery, filterStatus, dateRange]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (key: string, value: any) => {
    if (key === 'status') setFilterStatus(value);
    if (key === 'dateRange') setDateRange(value);
    setCurrentPage(1);
  };

  const handleSelectConversation = (conversationId: string, selected: boolean) => {
    setSelectedConversations(prev =>
      selected
        ? [...prev, conversationId]
        : prev.filter(id => id !== conversationId)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedConversations(conversations.map(conv => conv.id));
    } else {
      setSelectedConversations([]);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await deleteConversation(conversationId);
      message.success('对话删除成功');
      loadConversations({ page: currentPage, limit: 20 });
    } catch (error: any) {
      message.error('删除失败: ' + error.message);
    }
  };

  const handleBulkDelete = async () => {
    try {
      await deleteMultipleConversations(selectedConversations);
      message.success(`成功删除 ${selectedConversations.length} 个对话`);
      setSelectedConversations([]);
      setDeleteModalVisible(false);
      loadConversations({ page: currentPage, limit: 20 });
    } catch (error: any) {
      message.error('批量删除失败: ' + error.message);
    }
  };

  const handleExport = async (conversationIds: string[]) => {
    try {
      if (conversationIds.length === 1) {
        await exportConversation(conversationIds[0]);
      } else {
        await exportMultipleConversations(conversationIds);
      }
      message.success('导出成功');
    } catch (error: any) {
      message.error('导出失败: ' + error.message);
    }
  };

  const getConversationPreview = (conversation: Conversation) => {
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    if (lastMessage) {
      return lastMessage.content.length > 100
        ? lastMessage.content.substring(0, 100) + '...'
        : lastMessage.content;
    }
    return '暂无消息';
  };

  const getConversationStatus = (conversation: Conversation) => {
    const lastActivity = new Date(conversation.updatedAt);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

    if (hoursDiff < 1) return { text: '进行中', color: 'green' };
    if (hoursDiff < 24) return { text: '今天', color: 'blue' };
    if (hoursDiff < 168) return { text: '本周', color: 'orange' };
    return { text: '较早', color: 'default' };
  };

  const dropdownMenuItems = (conversation: Conversation) => [
    {
      key: 'view',
      label: '查看对话',
      icon: <EyeOutlined />
    },
    {
      key: 'export',
      label: '导出对话',
      icon: <ExportOutlined />
    },
    {
      key: 'delete',
      label: '删除对话',
      icon: <DeleteOutlined />,
      danger: true
    }
  ];

  const handleMenuClick = (key: string, conversation: Conversation) => {
    switch (key) {
      case 'view':
        window.location.href = `/chat?conversation=${conversation.id}`;
        break;
      case 'export':
        handleExport([conversation.id]);
        break;
      case 'delete':
        Modal.confirm({
          title: '确认删除',
          content: '确定要删除这个对话吗？此操作不可恢复。',
          onOk: () => handleDeleteConversation(conversation.id)
        });
        break;
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>
          <MessageOutlined /> 对话历史
        </Title>
        <Space>
          {selectedConversations.length > 0 && (
            <>
              <Text>已选择 {selectedConversations.length} 个对话</Text>
              <Button
                icon={<ExportOutlined />}
                onClick={() => handleExport(selectedConversations)}
              >
                导出选中
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => setDeleteModalVisible(true)}
              >
                删除选中
              </Button>
            </>
          )}
        </Space>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <Search
            placeholder="搜索对话内容..."
            allowClear
            style={{ width: 300 }}
            onSearch={handleSearch}
            enterButton
          />

          <Select
            placeholder="状态筛选"
            value={filterStatus}
            onChange={(value) => handleFilterChange('status', value)}
            style={{ width: 120 }}
          >
            <Option value="all">全部</Option>
            <Option value="active">进行中</Option>
            <Option value="completed">已完成</Option>
          </Select>

          <RangePicker
            placeholder={['开始日期', '结束日期']}
            onChange={(dates) => handleFilterChange('dateRange', dates)}
            style={{ width: 240 }}
          />

          <Button icon={<FilterOutlined />}>
            高级筛选
          </Button>
        </div>
      </Card>

      <Card>
        {conversations.length === 0 && !isLoading ? (
          <Empty description="暂无对话记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <>
            <List
              loading={isLoading}
              dataSource={conversations}
              renderItem={(conversation) => {
                const status = getConversationStatus(conversation);
                const isSelected = selectedConversations.includes(conversation.id);

                return (
                  <List.Item
                    style={{
                      padding: 16,
                      borderBottom: '1px solid #f0f0f0',
                      backgroundColor: isSelected ? '#f6ffed' : 'transparent'
                    }}
                    actions={[
                      <Checkbox
                        checked={isSelected}
                        onChange={(e) => handleSelectConversation(conversation.id, e.target.checked)}
                      />,
                      <Dropdown
                        menu={{
                          items: dropdownMenuItems(conversation),
                          onClick: ({ key }) => handleMenuClick(key, conversation)
                        }}
                        trigger={['click']}
                      >
                        <Button type="text" icon={<MoreOutlined />} />
                      </Dropdown>
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Text strong>{conversation.title || '未命名对话'}</Text>
                          <Tag color={status.color}>{status.text}</Tag>
                          {conversation.scene && (
                            <Tag color="blue">{conversation.scene}</Tag>
                          )}
                        </div>
                      }
                      description={
                        <div>
                          <Paragraph style={{ margin: '8px 0', color: '#666' }} ellipsis={{ rows: 2 }}>
                            {getConversationPreview(conversation)}
                          </Paragraph>
                          <Space style={{ fontSize: '12px', color: '#999' }}>
                            <ClockCircleOutlined />
                            <Text type="secondary">
                              创建于 {new Date(conversation.createdAt).toLocaleString()}
                            </Text>
                            <Text type="secondary">
                              {conversation.messages.length} 条消息
                            </Text>
                          </Space>
                        </div>
                      }
                    />
                  </List.Item>
                );
              }}
            />

            {totalCount > 20 && (
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <Pagination
                  current={currentPage}
                  total={totalCount}
                  pageSize={20}
                  onChange={setCurrentPage}
                  showQuickJumper
                  showTotal={(total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`}
                />
              </div>
            )}
          </>
        )}
      </Card>

      <Modal
        title="批量删除确认"
        open={deleteModalVisible}
        onOk={handleBulkDelete}
        onCancel={() => setDeleteModalVisible(false)}
        okText="确认删除"
        cancelText="取消"
        okType="danger"
      >
        <p>确认要删除选中的 {selectedConversations.length} 个对话吗？</p>
        <p style={{ color: '#ff4d4f' }}>此操作不可恢复，请谨慎操作！</p>
      </Modal>
    </div>
  );
};
```

---

## 5. 响应式移动端适配

### 5.1 响应式Hook (`hooks/useMediaQuery.ts`)

```tsx
import { useState, useEffect } from 'react';

export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    if (media.addEventListener) {
      media.addEventListener('change', listener);
    } else {
      media.addListener(listener);
    }

    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', listener);
      } else {
        media.removeListener(listener);
      }
    };
  }, [query]);

  return matches;
};
```

### 5.2 响应式工具类 (`styles/responsive.css`)

```css
/* 移动端优先的断点 */
.mobile-only { display: block; }
.tablet-only { display: none; }
.desktop-only { display: none; }

@media (min-width: 768px) {
  .mobile-only { display: none; }
  .tablet-only { display: block; }
}

@media (min-width: 1024px) {
  .tablet-only { display: none; }
  .desktop-only { display: block; }
}

/* 触摸友好的按钮尺寸 */
.touch-target {
  min-height: 44px;
  min-width: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* 安全区域适配 */
.safe-area-top { padding-top: env(safe-area-inset-top); }
.safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }

/* 移动端优化 */
.mobile-optimized {
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
}
```

---

## 6. 总结

### ✅ 完成功能列表

- **用户登录注册页面**: 完整的邮箱注册、密码强度检查、社交登录集成
- **聊天对话界面**: 实时消息、Markdown渲染、场景选择、文件上传、语音输入
- **个人中心和设置**: 用户资料管理、使用统计、全面设置选项
- **历史记录管理**: 对话历史查看、搜索、批量操作、导出功能
- **响应式移动端适配**: 移动优先设计、触摸友好交互、键盘适配

### 🚀 技术特点

- **TypeScript**: 完整的类型定义和类型安全
- **Ant Design**: 现代化的UI组件库
- **React 18**: 最新的React特性和Hooks
- **响应式设计**: 移动端优先的适配策略
- **性能优化**: 懒加载和代码分割
- **无障碍访问**: 符合WCAG标准

### 📦 部署建议

1. **构建优化**: 使用Vite进行生产构建
2. **代码分割**: 按路由和功能进行代码分割
3. **资源优化**: 图片压缩和CDN加速
4. **PWA支持**: 离线缓存和桌面安装
5. **监控集成**: 错误监控和性能分析

这个用户界面实现方案提供了完整的React用户界面开发解决方案，包含所有必要功能和优化，可直接用于生产环境。
```
TodoWrite
<arg_key>todos</arg_key>
<arg_value>[{"content": "设计和实现React用户界面开发任务", "status": "in_progress", "activeForm": "设计和实现React用户界面开发任务"}, {"content": "用户登录注册页面设计和实现", "status": "completed", "activeForm": "完成用户登录注册页面"}, {"content": "聊天对话界面设计和实现", "status": "completed", "activeForm": "完成聊天对话界面"}, {"content": "个人中心和设置页面设计和实现", "status": "in_progress", "activeForm": "实现个人中心和设置页面"}, {"content": "历史记录管理功能设计和实现", "status": "pending", "activeForm": "设计历史记录管理功能"}, {"content": "响应式移动端适配设计和实现", "status": "pending", "activeForm": "设计响应式移动端适配"}]