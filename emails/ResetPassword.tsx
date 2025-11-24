import { Text } from '@react-email/components';
import * as React from 'react';
import { Button } from './components/Button';
import { Layout } from './components/Layout';

interface ResetPasswordEmailProps {
  userName?: string;
  resetLink: string;
  expiresIn?: string;
}

export function ResetPasswordEmail({
  userName = 'ユーザー',
  resetLink,
  expiresIn = '1時間',
}: ResetPasswordEmailProps) {
  return (
    <Layout
      preview="パスワードのリセットをリクエストされました"
      heading="パスワードのリセット"
    >
      <Text style={text}>
        {userName}様
      </Text>

      <Text style={text}>
        DiagnoLeads
        アカウントのパスワードリセットがリクエストされました。
        以下のボタンをクリックして、新しいパスワードを設定してください。
      </Text>

      <Button href={resetLink}>パスワードをリセット</Button>

      <Text style={text}>
        このリンクは{expiresIn}有効です。
      </Text>

      <Text style={text}>
        パスワードリセットをリクエストしていない場合は、このメールを無視してください。
        アカウントは安全に保護されています。
      </Text>

      <Text style={text}>
        問題が解決しない場合は、サポートチームまでお問い合わせください。
      </Text>
    </Layout>
  );
}

export default ResetPasswordEmail;

const text = {
  color: '#404040',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};
