import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface LayoutProps {
  preview: string;
  heading: string;
  children: React.ReactNode;
}

export function Layout({ preview, heading, children }: LayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>DiagnoLeads</Heading>
          </Section>

          <Section style={content}>
            <Heading as="h2" style={h2}>
              {heading}
            </Heading>
            {children}
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              © 2024 DiagnoLeads. All rights reserved.
            </Text>
            <Text style={footerText}>
              このメールに心当たりがない場合は、無視してください。
            </Text>
            <Link
              href="https://diagnoleads.com"
              style={footerLink}
            >
              DiagnoLeads ホームページ
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 20px',
  backgroundColor: '#0070f3',
};

const h1 = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
  textAlign: 'center' as const,
};

const content = {
  padding: '0 48px',
};

const h2 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.4',
  margin: '32px 0 16px',
};

const footer = {
  padding: '32px 48px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '4px 0',
};

const footerLink = {
  color: '#0070f3',
  fontSize: '12px',
  textDecoration: 'underline',
};
