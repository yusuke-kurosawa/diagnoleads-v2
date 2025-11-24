import { Text } from '@react-email/components';
import * as React from 'react';
import { Button } from './components/Button';
import { Layout } from './components/Layout';

interface WelcomeEmailProps {
  userName: string;
  dashboardLink: string;
}

export function WelcomeEmail({
  userName,
  dashboardLink,
}: WelcomeEmailProps) {
  return (
    <Layout
      preview="DiagnoLeadsへようこそ！"
      heading="ようこそ、DiagnoLeadsへ！"
    >
      <Text style={text}>
        {userName}様
      </Text>

      <Text style={text}>
        DiagnoLeads
        へのご登録ありがとうございます！アカウントが正常に作成されました。
      </Text>

      <Text style={text}>
        DiagnoLeads
        は、AI
        を活用したB2B診断プラットフォームです。以下の機能をご利用いただけます：
      </Text>

      <ul style={list}>
        <li style={listItem}>
          <strong>診断ツール:</strong>{' '}
          見込み客のニーズを把握し、最適なソリューションを提案
        </li>
        <li style={listItem}>
          <strong>リード管理:</strong>{' '}
          診断結果から得られたリードを効率的に管理
        </li>
        <li style={listItem}>
          <strong>AI分析:</strong>{' '}
          Claude 3.5 Sonnet
          による高度な診断結果分析と提案
        </li>
        <li style={listItem}>
          <strong>チーム連携:</strong>{' '}
          組織機能で複数メンバーと協力してリードを管理
        </li>
      </ul>

      <Button href={dashboardLink}>ダッシュボードを開く</Button>

      <Text style={text}>
        ご不明な点やサポートが必要な場合は、いつでもお気軽にお問い合わせください。
      </Text>

      <Text style={text}>
        DiagnoLeadsチーム一同、あなたのビジネスの成功をお手伝いできることを楽しみにしています。
      </Text>
    </Layout>
  );
}

export default WelcomeEmail;

const text = {
  color: '#404040',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const list = {
  margin: '16px 0',
  paddingLeft: '20px',
};

const listItem = {
  margin: '8px 0',
  color: '#404040',
  fontSize: '16px',
  lineHeight: '24px',
};
