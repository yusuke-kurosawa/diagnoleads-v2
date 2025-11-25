#!/usr/bin/env tsx

/**
 * Hardcoded String Detector
 *
 * このスクリプトはコンポーネント内のハードコーディングされた
 * テキスト（日本語・英語）を検出します。
 *
 * Usage: pnpm tsx scripts/check-hardcoded-strings.ts
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const COMPONENT_DIRS = [
  'app/**/*.tsx',
  'components/**/*.tsx',
];

const EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/.next/**',
  '**/dist/**',
  '**/*.test.tsx',
  '**/*.spec.tsx',
];

interface HardcodedString {
  file: string;
  line: number;
  text: string;
  context: string;
}

/**
 * 日本語を含むかチェック
 */
function containsJapanese(text: string): boolean {
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(text);
}

/**
 * 除外すべき文字列かチェック
 */
function shouldExclude(text: string): boolean {
  // 空白のみ
  if (/^\s*$/.test(text)) return true;

  // 変数名、キー名（キャメルケース、スネークケース）
  if (/^[a-z][a-zA-Z0-9_]*$/.test(text)) return true;

  // パス、URL
  if (/^[\/\.]|https?:\/\//.test(text)) return true;

  // HTMLタグ
  if (/^<[^>]+>$/.test(text)) return true;

  // CSS classes
  if (/^[\w-]+$/.test(text) && text.length < 30) return true;

  // 数字のみ
  if (/^\d+$/.test(text)) return true;

  // 単一文字
  if (text.length <= 1) return true;

  // 一般的な技術用語（除外リスト）
  const technicalTerms = [
    'email', 'password', 'username', 'id', 'uuid', 'url', 'api',
    'status', 'error', 'success', 'warning', 'info', 'debug',
    'true', 'false', 'null', 'undefined',
  ];
  if (technicalTerms.includes(text.toLowerCase())) return true;

  return false;
}

/**
 * JSX内の文字列リテラルを検出
 */
function findHardcodedStrings(filePath: string): HardcodedString[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const results: HardcodedString[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // JSX内のテキスト（>{text}<）を検出
    const jsxTextMatches = line.matchAll(/>([^<>{}]+)</g);
    for (const match of jsxTextMatches) {
      const text = match[1].trim();
      if (text && !shouldExclude(text) && (containsJapanese(text) || /[a-zA-Z]{3,}/.test(text))) {
        // 英語は3文字以上の単語がある場合のみ
        if (!containsJapanese(text) && !/[A-Z][a-z]+\s/.test(text)) {
          continue; // 単一の英単語は除外
        }

        results.push({
          file: filePath,
          line: lineNumber,
          text,
          context: line.trim(),
        });
      }
    }

    // 文字列リテラル内の日本語を検出（ただし、translationキー名は除外）
    const stringMatches = line.matchAll(/["']([^"']+)["']/g);
    for (const match of stringMatches) {
      const text = match[1].trim();

      // useTranslations()やt()の引数は除外
      if (line.includes('useTranslations(') || line.includes('t(')) {
        continue;
      }

      // キー名（ドット記法）は除外
      if (/^[a-z][a-zA-Z0-9._-]+$/.test(text)) {
        continue;
      }

      if (text && !shouldExclude(text) && containsJapanese(text)) {
        results.push({
          file: filePath,
          line: lineNumber,
          text,
          context: line.trim(),
        });
      }
    }
  }

  return results;
}

/**
 * useTranslationsを使用しているかチェック
 */
function hasTranslationHook(filePath: string): boolean {
  const content = fs.readFileSync(filePath, 'utf-8');
  return (
    content.includes('useTranslations') ||
    content.includes('getTranslations') ||
    content.includes('useLocale')
  );
}

/**
 * メイン処理
 */
async function main() {
  console.log('🔍 Checking for hardcoded strings in components...\n');

  const allFiles: string[] = [];

  for (const pattern of COMPONENT_DIRS) {
    const files = await glob(pattern, {
      ignore: EXCLUDE_PATTERNS,
      absolute: true,
    });
    allFiles.push(...files);
  }

  console.log(`📁 Found ${allFiles.length} component files\n`);

  const filesWithHardcodedStrings: Array<{
    file: string;
    strings: HardcodedString[];
    hasTranslationHook: boolean;
  }> = [];

  for (const file of allFiles) {
    const strings = findHardcodedStrings(file);
    if (strings.length > 0) {
      filesWithHardcodedStrings.push({
        file: path.relative(process.cwd(), file),
        strings,
        hasTranslationHook: hasTranslationHook(file),
      });
    }
  }

  if (filesWithHardcodedStrings.length === 0) {
    console.log('🎉 No hardcoded strings found! All text is properly internationalized.\n');
    return;
  }

  console.log(`⚠️  Found ${filesWithHardcodedStrings.length} files with potential hardcoded strings:\n`);

  for (const { file, strings, hasTranslationHook } of filesWithHardcodedStrings) {
    console.log(`📄 ${file}`);
    console.log(`   Translation hook: ${hasTranslationHook ? '✅ Yes' : '❌ No'}`);
    console.log(`   Hardcoded strings: ${strings.length}`);

    for (const str of strings.slice(0, 5)) {
      // 最初の5件のみ表示
      console.log(`   - Line ${str.line}: "${str.text}"`);
      console.log(`     Context: ${str.context.substring(0, 80)}...`);
    }

    if (strings.length > 5) {
      console.log(`   ... and ${strings.length - 5} more`);
    }

    console.log('');
  }

  const totalStrings = filesWithHardcodedStrings.reduce(
    (sum, f) => sum + f.strings.length,
    0
  );

  console.log(`\n📊 Summary:`);
  console.log(`   - Files with hardcoded strings: ${filesWithHardcodedStrings.length}`);
  console.log(`   - Total hardcoded strings: ${totalStrings}\n`);

  console.log('💡 Note: Some false positives may be included. Please review manually.\n');
}

main().catch(console.error);
