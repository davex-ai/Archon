def generate_mock_questions(chunks, num_questions=5):
    questions = []

    context_text = " ".join([c["chunk"].lower() for c in chunks])

    # Heuristic signals (lightweight, no LLM)
    signals = {
        "api": "fetch" in context_text or "axios" in context_text,
        "auth": "auth" in context_text or "login" in context_text,
        "database": "db" in context_text or "firebase" in context_text,
        "state": "useState" in context_text or "state" in context_text,
        "async": "async" in context_text or "await" in context_text,
    }

    if signals["api"]:
        questions.append({
            "question": "How would you design this API layer for scalability and fault tolerance?",
            "answer": "Introduce caching, retries, rate limiting, and abstraction layers to decouple API logic."
        })

    if signals["database"]:
        questions.append({
            "question": "What are the tradeoffs of using a NoSQL database like Firebase in this system?",
            "answer": "It offers flexibility and scalability but may lack strong consistency and complex querying."
        })

    if signals["state"]:
        questions.append({
            "question": "How would you manage global state in a growing frontend application?",
            "answer": "Use centralized state management (Context, Redux) and avoid excessive prop drilling."
        })

    if signals["auth"]:
        questions.append({
            "question": "What security concerns exist in this authentication flow?",
            "answer": "Token leakage, improper session handling, and lack of validation are key risks."
        })

    if signals["async"]:
        questions.append({
            "question": "How would you handle concurrency and async operations safely in this system?",
            "answer": "Use proper error handling, cancellation, and avoid race conditions with controlled state updates."
        })

    # fallback generic
    while len(questions) < num_questions:
        questions.append({
            "question": "What architectural improvements would you suggest for this system?",
            "answer": "Improve modularity, scalability, and separation of concerns across components."
        })

    return questions[:num_questions]