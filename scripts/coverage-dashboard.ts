#!/usr/bin/env tsx
/**
 * Coverage Dashboard - カバレッジ状況を素早く確認
 * 
 * Usage:
 *   bun run coverage:dashboard        # キャッシュから表示（高速）
 *   bun run coverage:dashboard --fresh # 新規計測して表示
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const COVERAGE_JSON = 'coverage/coverage-final.json';
const TARGET = 80;

interface FileCoverage {
  path: string;
  s: Record<string, number>;
  f: Record<string, number>;
  b: Record<string, number[]>;
  statementMap: Record<string, unknown>;
  fnMap: Record<string, unknown>;
  branchMap: Record<string, unknown>;
}

interface RawCoverageData {
  [filePath: string]: FileCoverage;
}

interface ProcessedCoverage {
  lines: number;
  statements: number;
  functions: number;
  branches: number;
}

function calculateCoverage(file: FileCoverage): ProcessedCoverage {
  const statements = Object.values(file.s);
  const functions = Object.values(file.f);
  const branches = Object.values(file.b).flat();

  const coveredStatements = statements.filter(v => v > 0).length;
  const coveredFunctions = functions.filter(v => v > 0).length;
  const coveredBranches = branches.filter(v => v > 0).length;

  return {
    lines: statements.length > 0 ? (coveredStatements / statements.length) * 100 : 100,
    statements: statements.length > 0 ? (coveredStatements / statements.length) * 100 : 100,
    functions: functions.length > 0 ? (coveredFunctions / functions.length) * 100 : 100,
    branches: branches.length > 0 ? (coveredBranches / branches.length) * 100 : 100,
  };
}

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

function getColor(pct: number): string {
  if (pct >= TARGET) return colors.green;
  if (pct >= 60) return colors.yellow;
  return colors.red;
}

function formatPct(pct: number): string {
  const color = getColor(pct);
  const icon = pct >= TARGET ? '✅' : pct >= 60 ? '🔄' : '❌';
  return `${color}${pct.toFixed(1).padStart(6)}%${colors.reset} ${icon}`;
}

function printDashboard(rawData: RawCoverageData) {
  console.log('\n' + colors.bold + colors.cyan + '═══════════════════════════════════════════════════════════════' + colors.reset);
  console.log(colors.bold + '                    📊 COVERAGE DASHBOARD                        ' + colors.reset);
  console.log(colors.cyan + '═══════════════════════════════════════════════════════════════' + colors.reset + '\n');

  // 全体カバレッジを計算
  let totalStatements = 0;
  let coveredStatements = 0;
  let totalFunctions = 0;
  let coveredFunctions = 0;
  let totalBranches = 0;
  let coveredBranches = 0;

  for (const file of Object.values(rawData)) {
    const statements = Object.values(file.s);
    const functions = Object.values(file.f);
    const branches = Object.values(file.b).flat();

    totalStatements += statements.length;
    coveredStatements += statements.filter(v => v > 0).length;
    totalFunctions += functions.length;
    coveredFunctions += functions.filter(v => v > 0).length;
    totalBranches += branches.length;
    coveredBranches += branches.filter(v => v > 0).length;
  }

  const overallLines = totalStatements > 0 ? (coveredStatements / totalStatements) * 100 : 0;
  const overallFunctions = totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0;
  const overallBranches = totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0;

  console.log(colors.bold + '📈 Overall Coverage' + colors.reset);
  console.log(`   Lines:      ${formatPct(overallLines)}`);
  console.log(`   Statements: ${formatPct(overallLines)}`);
  console.log(`   Functions:  ${formatPct(overallFunctions)}`);
  console.log(`   Branches:   ${formatPct(overallBranches)}`);
  console.log();

  // モジュール別集計
  const moduleStats = new Map<string, { 
    totalStatements: number; 
    coveredStatements: number;
    fileCount: number;
  }>();
  
  for (const [filePath, file] of Object.entries(rawData)) {
    const match = filePath.match(/lib\/([^/]+)/);
    if (match) {
      const moduleName = match[1];
      const statements = Object.values(file.s);
      const covered = statements.filter(v => v > 0).length;

      const stat = moduleStats.get(moduleName) || { 
        totalStatements: 0, 
        coveredStatements: 0, 
        fileCount: 0 
      };
      stat.totalStatements += statements.length;
      stat.coveredStatements += covered;
      stat.fileCount += 1;
      moduleStats.set(moduleName, stat);
    }
  }

  // ソートして表示
  const sortedModules = Array.from(moduleStats.entries())
    .map(([name, stat]) => ({
      name,
      pct: stat.totalStatements > 0 ? (stat.coveredStatements / stat.totalStatements) * 100 : 0,
      files: stat.fileCount,
    }))
    .sort((a, b) => b.pct - a.pct);

  // 80%達成
  const achieved = sortedModules.filter(m => m.pct >= TARGET);
  const inProgress = sortedModules.filter(m => m.pct < TARGET);

  console.log(colors.bold + colors.green + `✅ 80%+ Achieved (${achieved.length} modules)` + colors.reset);
  console.log('─'.repeat(50));
  for (const mod of achieved) {
    console.log(`   ${mod.name.padEnd(20)} ${formatPct(mod.pct)}`);
  }
  console.log();

  console.log(colors.bold + colors.yellow + `🔄 In Progress (${inProgress.length} modules)` + colors.reset);
  console.log('─'.repeat(50));
  for (const mod of inProgress) {
    const gap = TARGET - mod.pct;
    console.log(`   ${mod.name.padEnd(20)} ${formatPct(mod.pct)} ${colors.dim}(need +${gap.toFixed(1)}%)${colors.reset}`);
  }
  console.log();

  // サマリー
  const totalModules = sortedModules.length;
  const achievedCount = achieved.length;
  const progressPct = (achievedCount / totalModules * 100).toFixed(0);

  console.log(colors.cyan + '═══════════════════════════════════════════════════════════════' + colors.reset);
  console.log(`${colors.bold}Summary:${colors.reset} ${achievedCount}/${totalModules} modules at 80%+ (${progressPct}% complete)`);
  console.log(colors.cyan + '═══════════════════════════════════════════════════════════════' + colors.reset + '\n');
}

async function main() {
  const args = process.argv.slice(2);
  const fresh = args.includes('--fresh') || args.includes('-f');

  // キャッシュがない、または--freshが指定された場合は計測
  if (fresh || !fs.existsSync(COVERAGE_JSON)) {
    console.log(colors.dim + '⏳ Running coverage (this may take a moment)...' + colors.reset);
    try {
      execSync('bun run test:coverage --reporter=json --run', { 
        stdio: 'inherit',
        timeout: 300000,
      });
    } catch {
      // テストが失敗しても続行
    }
  }

  // JSONを読み込み
  if (!fs.existsSync(COVERAGE_JSON)) {
    console.error(colors.red + '❌ Coverage data not found. Run with --fresh flag.' + colors.reset);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(COVERAGE_JSON, 'utf-8')) as RawCoverageData;
  printDashboard(data);

  // 最終更新時刻
  const stat = fs.statSync(COVERAGE_JSON);
  console.log(colors.dim + `Last updated: ${stat.mtime.toLocaleString('ja-JP')}` + colors.reset);
  console.log(colors.dim + 'Run with --fresh to recalculate coverage.' + colors.reset + '\n');
}

main().catch(console.error);
