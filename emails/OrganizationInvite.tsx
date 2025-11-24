import { Text } from '@react-email/components';
import * as React from 'react';
import { Button } from './components/Button';
import { Layout } from './components/Layout';

interface OrganizationInviteEmailProps {
  inviterName: string;
  organizationName: string;
  inviteLink: string;
  role?: string;
  expiresIn?: string;
}

export function OrganizationInviteEmail({
  inviterName,
  organizationName,
  inviteLink,
  role = 'メンバー',
  expiresIn = '7日間',
}: OrganizationInviteEmailProps) {
  return (
    <Layout
      preview={`${organizationName}への招待`}
      heading="組織への招待"
    >
      <Text style={text}>
        {inviterName}さんから、DiagnoLeads
        の組織「{organizationName}」への招待が届いています。
      </Text>

      <Text style={text}>
        あなたは<strong>{role}</strong>として招待されました。
      </Text>

      <Button href={inviteLink}>招待を承諾</Button>

      <Text style={text}>
        この招待リンクは{expiresIn}有効です。
      </Text>

      <Text style={text}>
        DiagnoLeads
        では、チームでリード管理や診断ツールを活用できます。組織に参加して、効率的なB2Bマーケティングを始めましょう。
      </Text>

      <Text style={text}>
        この招待に心当たりがない場合は、このメールを無視してください。
      </Text>
    </Layout>
  );
}

export default OrganizationInviteEmail;

const text = {
  color: '#404040',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};
