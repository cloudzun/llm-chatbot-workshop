/**
 * check-env.js — 学员环境检查脚本
 * 运行方式: node check-env.js
 *
 * 检查以下内容:
 *  1. Node.js 版本
 *  2. .env 文件是否存在
 *  3. API Key 是否已填写
 *  4. 依赖是否已安装
 *  5. API 连通性测试（可选）
 */

import { readFileSync, existsSync } from 'fs';

const OK  = '✅';
const ERR = '❌';
const WARN = '⚠️ ';

let hasError = false;

function pass(msg)  { console.log(`  ${OK}  ${msg}`); }
function fail(msg)  { console.error(`  ${ERR}  ${msg}`); hasError = true; }
function warn(msg)  { console.warn(`  ${WARN} ${msg}`); }
function section(title) { console.log(`\n── ${title} ────────────────────────`); }

// ─── 1. Node.js 版本 ──────────────────────────────────────────
section('Node.js 版本');
const nodeMajor = parseInt(process.versions.node.split('.')[0], 10);
if (nodeMajor >= 18) {
  pass(`Node.js ${process.version}（满足要求 ≥18）`);
} else {
  fail(`Node.js ${process.version} 版本过低，请安装 Node.js 18 或更高版本`);
  fail(`下载地址: https://nodejs.org/`);
}

// ─── 2. .env 文件 ─────────────────────────────────────────────
section('.env 配置文件');
if (!existsSync('.env')) {
  fail('.env 文件不存在。请在项目根目录创建 .env 文件，参考 .env.example');
} else {
  pass('.env 文件存在');

  const envContent = readFileSync('.env', 'utf-8');

  // 检查 API Key
  const keyMatch = envContent.match(/^LLM_API_KEY=(.+)$/m);
  if (!keyMatch || !keyMatch[1].trim() || keyMatch[1].trim() === 'sk-your-api-key-here') {
    fail('LLM_API_KEY 未设置，请填入你的硅基流动 API Key');
    fail('获取地址: https://cloud.siliconflow.cn → API 密钥');
  } else {
    const key = keyMatch[1].trim();
    pass(`LLM_API_KEY 已设置（${key.slice(0, 8)}...${key.slice(-4)}）`);
  }

  // 检查 BASE_URL
  const urlMatch = envContent.match(/^LLM_BASE_URL=(.+)$/m);
  if (!urlMatch || !urlMatch[1].trim()) {
    fail('LLM_BASE_URL 未设置，应填 https://api.siliconflow.cn/v1');
  } else {
    pass(`LLM_BASE_URL = ${urlMatch[1].trim()}`);
  }

  // 检查 MODEL
  const modelMatch = envContent.match(/^LLM_DEFAULT_MODEL=(.+)$/m);
  if (!modelMatch || !modelMatch[1].trim()) {
    warn('LLM_DEFAULT_MODEL 未设置，将使用默认值');
  } else {
    pass(`LLM_DEFAULT_MODEL = ${modelMatch[1].trim()}`);
  }
}

// ─── 3. 依赖安装 ──────────────────────────────────────────────
section('npm 依赖');
if (!existsSync('node_modules')) {
  fail('node_modules 目录不存在，请运行: npm install');
} else if (!existsSync('node_modules/express')) {
  fail('express 未安装，请运行: npm install');
} else {
  pass('node_modules 存在');
  pass('express 已安装');

  if (existsSync('node_modules/@modelcontextprotocol')) {
    pass('@modelcontextprotocol/sdk 已安装（Phase 5 MCP 功能可用）');
  } else {
    warn('@modelcontextprotocol/sdk 未安装（Phase 5 MCP 功能不可用）');
    warn('需要时运行: npm install @modelcontextprotocol/sdk');
  }
}

// ─── 4. 知识库文档 ────────────────────────────────────────────
section('知识库文档（Phase 3 RAG）');
const possibleDirs = ['oneflower', 'OneFlower', 'OneFlower/OneFlower'];
const docsDir = possibleDirs.find(d => existsSync(d));
if (docsDir) {
  pass(`知识库目录存在: ${docsDir}/`);
} else {
  warn('未找到 oneflower/ 知识库目录（Phase 3 RAG 阶段需要）');
  warn('请确保 .env 中 KNOWLEDGE_DIR 指向正确的文档目录');
}

// ─── 5. API 连通性测试 ────────────────────────────────────────
section('API 连通性测试');
if (!existsSync('.env')) {
  warn('跳过（.env 不存在）');
} else {
  const envContent = readFileSync('.env', 'utf-8');
  const keyMatch = envContent.match(/^LLM_API_KEY=(.+)$/m);
  const urlMatch = envContent.match(/^LLM_BASE_URL=(.+)$/m);

  if (
    keyMatch && keyMatch[1].trim() && keyMatch[1].trim() !== 'sk-your-api-key-here' &&
    urlMatch && urlMatch[1].trim()
  ) {
    const apiKey  = keyMatch[1].trim();
    const baseUrl = urlMatch[1].trim();

    console.log('  正在测试 API 连接，请稍候...');

    fetch(`${baseUrl}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(8000)
    })
      .then(r => {
        if (r.ok) {
          pass('API 连接成功！');
          printSummary();
        } else {
          fail(`API 返回错误 (${r.status})，请检查 API Key 是否正确`);
          printSummary();
        }
      })
      .catch(e => {
        fail(`API 连接失败: ${e.message}`);
        warn('可能是网络问题，请检查网络连接后重试');
        printSummary();
      });
  } else {
    warn('跳过（API Key 未设置）');
    printSummary();
  }
}

function printSummary() {
  console.log('\n══════════════════════════════════════════');
  if (hasError) {
    console.error('❌ 环境检查未通过，请修复以上问题后再开始演练');
  } else {
    console.log('✅ 环境检查通过！可以开始演练了');
    console.log('   启动命令: npm start');
    console.log('   访问地址: http://localhost:3000');
  }
  console.log('══════════════════════════════════════════\n');
}
