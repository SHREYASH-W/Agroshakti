VECTORSTORE = load_faiss_index(FAISS_INDEX_DIR)
import re
import torch

# =========================
# GLOBALS
# =========================
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
EOS_TOKEN = tokenizer.eos_token

# =========================
# PROMPTS
# =========================

LLM_CHECK_PROMPT = """You are a cautious domain expert.

Answer the question ONLY if you are certain and the information is common, general, and well-established.
If you are not fully confident, say exactly:
INSUFFICIENT_INFORMATION

Do NOT guess.
Do NOT add numbers unless you are certain.

Question:
{question}

Answer:
"""

RAG_REWRITE_PROMPT = """Below is an instruction that describes a task.

### Instruction:
You are a verification-focused agriculture expert.
You must NOT add, infer, or modify any facts or numbers.
You must NOT introduce new information.
If the answer says data is missing or unclear, preserve it exactly.

### Question:
{question}

### Grounded Answer (DO NOT CHANGE FACTS):
{rag_answer}

### Task:
Rewrite the answer clearly and concisely without adding information.

### Answer:
"""

FREE_LLM_PROMPT = """Below is an instruction that describes a task.

### Instruction:
You are an expert in agriculture. Answer the farmer's question clearly, practically, and in detail.

### Question:
{question}

### Answer:
"""

# =========================
# NUMERIC GUARD
# =========================
_num_re = re.compile(r"\d+\.?\d*\s*%?")

def numeric_guard(original: str, rewritten: str) -> bool:
    return set(_num_re.findall(original)) == set(_num_re.findall(rewritten))

# =========================
# OUTPUT VALIDATOR
# =========================
def is_valid_llm_answer(text: str) -> bool:
    if not text:
        return False
    text = text.strip()
    if len(text.split()) < 4:
        return False
    bad_patterns = [
        r"[A-Z]{5,}",
        r"\d+\.\d+\.\d+",
        r"\\",
        r"ELECT",
    ]
    return not any(re.search(p, text) for p in bad_patterns)

# =========================
# QUERY ROUTER
# =========================
def is_general_how_to_query(query: str) -> bool:
    q = query.lower()
    triggers = [
        "how to", "how do", "how can", "steps", "method",
        "procedure", "cultivation", "grow", "plant",
        "farming", "practice"
    ]
    return any(t in q for t in triggers)

# =========================
# FREE LLM MODE (UNCAGED)
# =========================
def llama_free_answer(question: str, max_new_tokens: int = 700) -> str:
    prompt = FREE_LLM_PROMPT.format(question=question) + EOS_TOKEN

    inputs = tokenizer([prompt], return_tensors="pt", truncation=True).to(DEVICE)

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            do_sample=True,          # 🔓 unlocked
            temperature=0.7,
            top_p=0.9,
            repetition_penalty=1.05,
            eos_token_id=tokenizer.eos_token_id,
        )

    return tokenizer.decode(
        outputs[0][inputs["input_ids"].shape[-1]:],
        skip_special_tokens=True
    ).strip()

# =========================
# LLM-FIRST CHECK
# =========================
def llama_llm_first_check(question: str, max_new_tokens: int = 120) -> str:
    prompt = LLM_CHECK_PROMPT.format(question=question) + EOS_TOKEN

    inputs = tokenizer([prompt], return_tensors="pt", truncation=True).to(DEVICE)

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            do_sample=False,
            temperature=0.0,
            top_p=1.0,
            repetition_penalty=1.05,
            no_repeat_ngram_size=3,
            eos_token_id=tokenizer.eos_token_id,
        )

    return tokenizer.decode(
        outputs[0][inputs["input_ids"].shape[-1]:],
        skip_special_tokens=True
    ).strip()

# =========================
# SAFE RAG REWRITE
# =========================
def llama_rag_rewrite(question: str, rag_answer: str, max_new_tokens: int = 250) -> str:
    prompt = RAG_REWRITE_PROMPT.format(
        question=question,
        rag_answer=rag_answer
    ) + EOS_TOKEN

    inputs = tokenizer([prompt], return_tensors="pt", truncation=True).to(DEVICE)

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            do_sample=False,
            temperature=0.0,
            top_p=1.0,
            repetition_penalty=1.05,
            no_repeat_ngram_size=3,
            eos_token_id=tokenizer.eos_token_id,
        )

    decoded = tokenizer.decode(
        outputs[0][inputs["input_ids"].shape[-1]:],
        skip_special_tokens=True
    ).strip()

    if not decoded:
        return rag_answer
    if not numeric_guard(rag_answer, decoded):
        return rag_answer
    if len(decoded.split()) < 5:
        return rag_answer

    return decoded

# =========================
# MAIN ORCHESTRATOR
# =========================
def answer_query(query: str, vectorstore):
    # 🟢 MODE 1: FREE LLM (how-to, farming)
    if is_general_how_to_query(query):
        return {
            "query": query,
            "answer": llama_free_answer(query),
            "source": "LLM (free expert mode)"
        }

    # 🟡 MODE 2: LLM knowledge check
    llm_answer = llama_llm_first_check(query)

    if llm_answer.strip().upper() != "INSUFFICIENT_INFORMATION" and is_valid_llm_answer(llm_answer):
        return {
            "query": query,
            "answer": llm_answer,
            "source": "LLM (general knowledge)"
        }

    # 🔴 MODE 3: RAG fallback
    rag_result = generate_answer(query, vectorstore)
    rag_answer = rag_result.get("answer", "")

    final_answer = llama_rag_rewrite(query, rag_answer)

    return {
        "query": query,
        "answer": final_answer,
        "source": "RAG (document-grounded)",
        "sources": rag_result.get("sources", [])
    }

# =========================
# TEST
# =========================
query = "how to grow tomatoes and potatoes in a single crop"

result = answer_query(query, VECTORSTORE)

print("SOURCE:", result["source"])
print("\nANSWER:\n", result["answer"])
