# Phase 3：RAG 知识问答

本阶段在 Phase 2 基础上，添加检索增强生成（RAG）功能——让 AI 能够基于本地文档回答问题，并在回复中标注引用来源。

## 新增功能

- 文档加载：支持 .txt / .md / .pdf / .docx
- 嵌入向量：调用硅基流动 bge-m3 嵌入 API
- 向量存储：numpy 余弦相似度检索，JSON 持久化
- 引用来源展示：st.expander 显示片段内容与相似度
- [进阶] 重排序：bge-reranker-v2-m3 精排

## 目录结构

```
phase-3/
├── starter/
│   ├── app.py              # Phase 2 代码 + RAG TODO 注释
│   └── rag/                # 空目录，学员创建 loader/embeddings/vectorstore
└── completed/
    ├── app.py
    ├── requirements.txt
    ├── .streamlit/secrets.toml.example
    └── rag/
        ├── loader.py
        ├── embeddings.py
        ├── vectorstore.py
        └── reranker.py     # 进阶：重排序
```

## 快速开始

```bash
pip install -r requirements.txt

# 准备知识库（软链接或复制）
# Windows:
mklink /D oneflower ..\..\..\OneFlower\OneFlower
# Mac/Linux:
ln -s ../../../OneFlower/OneFlower oneflower

cp .streamlit/secrets.toml.example .streamlit/secrets.toml
# 填入 API Key 和 EMBEDDING_MODEL

streamlit run app.py
```

## 给 OpenCode 的提示词（分步）

**步骤 1 — 文档加载器**：
```
创建 rag/loader.py，导出 load_and_chunk(directory: str) 函数：
- 读取目录下所有 .txt、.md 文件（pathlib），以及 .pdf（pypdf）和 .docx（python-docx）
- 将内容按约 500 字切分，相邻片段保留 100 字重叠
- 返回列表，每项格式：{"content": str, "source": 文件名, "index": 序号}
- 空文件或解析失败时打印警告并跳过
```

**步骤 2 — 嵌入与存储**：
```
创建 rag/embeddings.py，导出 get_embeddings(texts, client) 函数，
调用硅基流动嵌入 API（模型从 st.secrets["EMBEDDING_MODEL"] 读取），每批最多 100 条。

创建 rag/vectorstore.py，导出：
- build_index(chunks, embeddings) 保存为 rag/vectorstore.json
- search(query_embedding, top_k=3) 用 numpy 余弦相似度返回 top_k 片段
```

**步骤 3 — 集成到 app.py**：
```
修改 app.py，在侧边栏添加"知识库设置"分区：
- st.toggle "开启知识库模式"
- st.button "构建索引"（加载文档、获取嵌入、保存索引，用 st.spinner 提示）
对话时若知识库开启，检索 top-3 片段拼入 system prompt，
AI 回复后用 st.expander 显示引用来源（文件名、相似度分数、片段前 200 字）
```

## 验证清单

- [ ] 点击「构建索引」成功，显示索引片段数
- [ ] 开启 RAG，问「易速鲜花退换货政策」可以引用文档回答
- [ ] 关闭 RAG，同样提问，AI 无法给出具体信息
- [ ] 展开「引用来源」能看到文件名和相似度分数
- [ ] [进阶] 添加重排序开关，对比开启/关闭时结果顺序变化
