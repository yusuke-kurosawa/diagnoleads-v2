#!/usr/bin/env tsx

/**
 * i18n Translation Completeness Checker
 *
 * このスクリプトは日本語と英語のロケールファイルを比較し、
 * 翻訳の不一致や漏れを検出します。
 *
 * Usage: pnpm tsx scripts/check-i18n.ts
 */

import fs from 'node:fs';
import path from 'node:path';

const LOCALES_DIR = path.join(process.cwd(), 'locales');
const LOCALES = ['ja', 'en'];

type TranslationObject = Record<string, unknown>;

interface CheckResult {
  locale: string;
  file: string;
  missingKeys: string[];
  extraKeys: string[];
}

/**
 * オブジェクトのすべてのキーをドット記法で取得
 */
function getAllKeys(obj: TranslationObject, prefix = ''): string[] {
  const keys: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...getAllKeys(value as TranslationObject, fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys.sort();
}

/**
 * ロケールファイルを読み込み
 */
function loadLocaleFile(locale: string, filename: string): TranslationObject | null {
  const filePath = path.join(LOCALES_DIR, locale, filename);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * 2つのキーセットを比較
 */
function compareKeys(
  keys1: string[],
  keys2: string[]
): {
  missing: string[];
  extra: string[];
} {
  const set1 = new Set(keys1);
  const set2 = new Set(keys2);

  const missing = keys2.filter((key) => !set1.has(key));
  const extra = keys1.filter((key) => !set2.has(key));

  return { missing, extra };
}

/**
 * すべてのロケールファイルをチェック
 */
function checkTranslations(): CheckResult[] {
  const results: CheckResult[] = [];

  // locales/jaディレクトリからすべてのJSONファイルを取得
  const jaDir = path.join(LOCALES_DIR, 'ja');
  if (!fs.existsSync(jaDir)) {
    console.error('❌ locales/ja directory not found');
    process.exit(1);
  }

  const files = fs.readdirSync(jaDir).filter((file) => file.endsWith('.json'));

  console.log(`📁 Found ${files.length} translation files: ${files.join(', ')}\n`);

  for (const file of files) {
    const jaData = loadLocaleFile('ja', file);
    const enData = loadLocaleFile('en', file);

    if (!jaData) {
      console.error(`❌ Failed to load locales/ja/${file}`);
      continue;
    }

    if (!enData) {
      console.error(`❌ Missing English translation: locales/en/${file}`);
      results.push({
        locale: 'en',
        file,
        missingKeys: ['ENTIRE_FILE_MISSING'],
        extraKeys: [],
      });
      continue;
    }

    // 日本語と英語のキーを取得
    const jaKeys = getAllKeys(jaData);
    const enKeys = getAllKeys(enData);

    console.log(`📄 Checking ${file}:`);
    console.log(`   - Japanese keys: ${jaKeys.length}`);
    console.log(`   - English keys: ${enKeys.length}`);

    // 英語版で不足しているキー（日本語にはあるが英語にない）
    const { missing: missingInEn, extra: extraInEn } = compareKeys(enKeys, jaKeys);

    if (missingInEn.length > 0) {
      results.push({
        locale: 'en',
        file,
        missingKeys: missingInEn,
        extraKeys: [],
      });
    }

    if (extraInEn.length > 0) {
      results.push({
        locale: 'ja',
        file,
        missingKeys: [],
        extraKeys: extraInEn,
      });
    }

    if (missingInEn.length === 0 && extraInEn.length === 0) {
      console.log('   ✅ All keys match!\n');
    } else {
      console.log('');
    }
  }

  return results;
}

/**
 * 結果を表示
 */
function displayResults(results: CheckResult[]): boolean {
  if (results.length === 0) {
    console.log('\n🎉 All translations are complete and consistent!\n');
    return true;
  }

  console.log('\n⚠️  Translation Issues Found:\n');

  for (const result of results) {
    if (result.missingKeys.length > 0) {
      console.log(`❌ Missing keys in locales/${result.locale}/${result.file}:`);
      result.missingKeys.forEach((key) => {
        console.log(`   - ${key}`);
      });
      console.log('');
    }

    if (result.extraKeys.length > 0) {
      console.log(
        `⚠️  Extra keys in locales/${result.locale}/${result.file} (not in other locales):`
      );
      result.extraKeys.forEach((key) => {
        console.log(`   - ${key}`);
      });
      console.log('');
    }
  }

  const totalMissing = results.reduce((sum, r) => sum + r.missingKeys.length, 0);
  const totalExtra = results.reduce((sum, r) => sum + r.extraKeys.length, 0);

  console.log('\n📊 Summary:');
  console.log(`   - Missing translations: ${totalMissing}`);
  console.log(`   - Extra keys: ${totalExtra}`);
  console.log(`   - Total issues: ${totalMissing + totalExtra}\n`);

  return false;
}

/**
 * メイン処理
 */
function main() {
  console.log('🔍 Checking i18n translation completeness...\n');

  const results = checkTranslations();
  const allComplete = displayResults(results);

  process.exit(allComplete ? 0 : 1);
}

main();
