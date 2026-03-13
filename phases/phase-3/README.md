# Phase 3 — RAG 知识问答

## 本阶段你将构建

- 文档加载与切分（`rag/loader.js`）
- 向量嵌入生成（`rag/embeddings.js`，使用 bge-m3 免费模型）
- 向量存储与余弦相似度检索（`rag/vectorstore.js`）
- 可选重排序（`rag/reranker.js`）
- `/api/rag/build-index` 索引构建接口
- 前端 RAG 开关与来源引用展示

**关键技术**: Embedding · 向量检索 · Cosine Similarity · RAG

---

## 目录说明

| 目录 | 说明 |
|------|------|
| `starter/server.js` | Phase 2 完成状态 — 含参数面板，无 RAG |
| `completed/server.js` | Phase 3 完成后的参考实现（需配合根目录 `rag/` 模块） |

---

## 从这里开始

```bash
# 将本阶段起点复制到项目根目录
cp phases/phase-3/starter/server.js server.js

# rag/ 模块已在根目录，直接启动
npm run dev
```

📖 [学员教材 → Phase 3 章节](../../docs/teaching/student-textbook.md)

---

## 完成验证

- [ ] 调用 `/api/rag/build-index` 返回 `{"success": true, "count": N}`
- [ ] 开启 RAG 开关后，提问「花语」相关问题能看到知识库来源引用
- [ ] 关闭 RAG 时，AI 回退为通用回答
