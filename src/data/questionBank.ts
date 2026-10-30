import type { InterviewQuestion } from '../types'

// ==========================================
// ADAPTIVE INTERVIEW QUESTION BANK
// ==========================================
//
// Each question declares:
//   id               – unique identifier
//   type             – Technical | Behavioral | HR | Mixed
//   difficulty       – Easy | Medium | Hard
//   category         – maps to focus areas and skills
//   role             – target roles (empty = applies to all roles)
//   prompt           – the interviewer's question
//   hint             – guidance for the candidate
//   expectedConcepts – key ideas a strong answer should cover
//   expected concepts – alias for property compatibility
// ==========================================

const ALL_ROLES: string[] = []

export const fullQuestionBank: InterviewQuestion[] = [

  // ─────────────────────────────────────────
  // TECHNICAL — Data structures
  // ─────────────────────────────────────────
  {
    id: 'tech-ds-01',
    type: 'Technical',
    difficulty: 'Easy',
    category: 'Data structures',
    role: ALL_ROLES,
    prompt:
      'What is the difference between an array and a linked list? When would you choose one over the other?',
    hint:
      'Compare memory layout, access time, and insertion/deletion costs.',
    expectedConcepts: ['contiguous memory', 'O(1) indexing', 'O(n) insertion', 'node pointers', 'cache locality'],
    'expected concepts': ['contiguous memory', 'O(1) indexing', 'O(n) insertion', 'node pointers', 'cache locality'],
  },
  {
    id: 'tech-ds-02',
    type: 'Technical',
    difficulty: 'Medium',
    category: 'Data structures',
    role: ALL_ROLES,
    prompt:
      'Explain how a hash map works internally. What happens when two keys hash to the same bucket?',
    hint:
      'Discuss hashing, bucket arrays, collision resolution (chaining vs. open addressing), and load factor.',
    expectedConcepts: ['hash function', 'buckets', 'collision', 'chaining', 'load factor', 'rehashing'],
    'expected concepts': ['hash function', 'buckets', 'collision', 'chaining', 'load factor', 'rehashing'],
  },
  {
    id: 'tech-ds-03',
    type: 'Technical',
    difficulty: 'Hard',
    category: 'Data structures',
    role: ALL_ROLES,
    prompt:
      'Design a data structure that supports insert, delete, and getRandom in O(1) average time.',
    hint:
      'Think about combining a hash map with a dynamic array.',
    expectedConcepts: ['hash map', 'dynamic array', 'swap-with-last deletion', 'O(1) average complexity'],
    'expected concepts': ['hash map', 'dynamic array', 'swap-with-last deletion', 'O(1) average complexity'],
  },
  {
    id: 'tech-ds-04',
    type: 'Technical',
    difficulty: 'Medium',
    category: 'Data structures',
    role: ALL_ROLES,
    prompt:
      'What is a binary search tree? How does a self-balancing BST (like an AVL or Red-Black tree) improve on a basic BST?',
    hint:
      'Explain how unbalanced trees degrade to O(n) and how rotations maintain O(log n).',
    expectedConcepts: ['BST property', 'O(log n) average', 'worst case O(n)', 'rotations', 'balance factor'],
    'expected concepts': ['BST property', 'O(log n) average', 'worst case O(n)', 'rotations', 'balance factor'],
  },

  // ─────────────────────────────────────────
  // TECHNICAL — Algorithms
  // ─────────────────────────────────────────
  {
    id: 'tech-algo-01',
    type: 'Technical',
    difficulty: 'Easy',
    category: 'Algorithms',
    role: ALL_ROLES,
    prompt:
      'Describe the difference between linear search and binary search. What are their time complexities?',
    hint:
      'Mention sorted input requirement for binary search and the halving strategy.',
    expectedConcepts: ['O(n) linear', 'O(log n) binary', 'sorted input', 'divide and conquer'],
    'expected concepts': ['O(n) linear', 'O(log n) binary', 'sorted input', 'divide and conquer'],
  },
  {
    id: 'tech-algo-02',
    type: 'Technical',
    difficulty: 'Medium',
    category: 'Algorithms',
    role: ALL_ROLES,
    prompt:
      'Explain the merge sort algorithm. What is its time complexity and why is it considered stable?',
    hint:
      'Walk through the divide, recursive sort, and merge phases.',
    expectedConcepts: ['divide and conquer', 'O(n log n)', 'stability', 'merge phase', 'auxiliary space O(n)'],
    'expected concepts': ['divide and conquer', 'O(n log n)', 'stability', 'merge phase', 'auxiliary space O(n)'],
  },
  {
    id: 'tech-algo-03',
    type: 'Technical',
    difficulty: 'Hard',
    category: 'Algorithms',
    role: ALL_ROLES,
    prompt:
      'Given a graph of cities and road distances, how would you find the shortest path between two cities? Discuss trade-offs between different algorithms.',
    hint:
      'Compare Dijkstra, Bellman-Ford, and A*. Discuss when negative weights matter.',
    expectedConcepts: ['Dijkstra', 'priority queue', 'Bellman-Ford', 'negative edges', 'A* heuristic', 'time complexity'],
    'expected concepts': ['Dijkstra', 'priority queue', 'Bellman-Ford', 'negative edges', 'A* heuristic', 'time complexity'],
  },
  {
    id: 'tech-algo-04',
    type: 'Technical',
    difficulty: 'Medium',
    category: 'Algorithms',
    role: ALL_ROLES,
    prompt:
      'What is dynamic programming? Give an example of a problem that can be solved with it and explain the approach.',
    hint:
      'Describe overlapping subproblems, optimal substructure, and memoization vs. tabulation.',
    expectedConcepts: ['overlapping subproblems', 'optimal substructure', 'memoization', 'tabulation', 'Fibonacci or knapsack'],
    'expected concepts': ['overlapping subproblems', 'optimal substructure', 'memoization', 'tabulation', 'Fibonacci or knapsack'],
  },

  // ─────────────────────────────────────────
  // TECHNICAL — SQL
  // ─────────────────────────────────────────
  {
    id: 'tech-sql-01',
    type: 'Technical',
    difficulty: 'Easy',
    category: 'SQL',
    role: ['Full Stack Developer', 'Backend Developer', 'Java Developer', 'Python Developer', 'Software Engineer', 'Data Analyst'],
    prompt:
      'What is the difference between INNER JOIN and LEFT JOIN? Give an example of when you would use each.',
    hint:
      'INNER JOIN returns only matching rows; LEFT JOIN keeps all rows from the left table.',
    expectedConcepts: ['INNER JOIN', 'LEFT JOIN', 'NULL rows', 'matching condition', 'use cases'],
    'expected concepts': ['INNER JOIN', 'LEFT JOIN', 'NULL rows', 'matching condition', 'use cases'],
  },
  {
    id: 'tech-sql-02',
    type: 'Technical',
    difficulty: 'Medium',
    category: 'SQL',
    role: ['Full Stack Developer', 'Backend Developer', 'Java Developer', 'Python Developer', 'Software Engineer', 'Data Analyst'],
    prompt:
      'Write a SQL query to find the second-highest salary from an employees table. Explain your approach.',
    hint:
      'Consider using LIMIT with OFFSET, a subquery, or DENSE_RANK window function.',
    expectedConcepts: ['subquery', 'LIMIT OFFSET', 'DENSE_RANK', 'handling ties', 'NULL edge case'],
    'expected concepts': ['subquery', 'LIMIT OFFSET', 'DENSE_RANK', 'handling ties', 'NULL edge case'],
  },
  {
    id: 'tech-sql-03',
    type: 'Technical',
    difficulty: 'Hard',
    category: 'SQL',
    role: ['Backend Developer', 'Java Developer', 'Python Developer', 'Software Engineer', 'Data Analyst'],
    prompt:
      'Explain database indexing. How does a B-tree index work, and what are the trade-offs of adding too many indexes?',
    hint:
      'Discuss read vs. write performance, index structure, selectivity, and composite indexes.',
    expectedConcepts: ['B-tree', 'balanced tree', 'read performance', 'write overhead', 'selectivity', 'composite index'],
    'expected concepts': ['B-tree', 'balanced tree', 'read performance', 'write overhead', 'selectivity', 'composite index'],
  },
  {
    id: 'tech-sql-04',
    type: 'Technical',
    difficulty: 'Easy',
    category: 'SQL',
    role: ['Full Stack Developer', 'Backend Developer', 'Java Developer', 'Python Developer', 'Software Engineer', 'Data Analyst'],
    prompt:
      'What is the difference between WHERE and HAVING in SQL?',
    hint:
      'WHERE filters individual rows before grouping; HAVING filters groups after aggregation.',
    expectedConcepts: ['WHERE clause', 'HAVING clause', 'GROUP BY', 'aggregate functions', 'order of execution'],
    'expected concepts': ['WHERE clause', 'HAVING clause', 'GROUP BY', 'aggregate functions', 'order of execution'],
  },
  {
    id: 'tech-sql-05',
    type: 'Technical',
    difficulty: 'Hard',
    category: 'SQL',
    role: ['Backend Developer', 'Full Stack Developer', 'Software Engineer', 'Data Analyst'],
    prompt:
      'Explain ACID properties in relational databases and how isolation levels prevent dirty reads, non-repeatable reads, and phantom reads.',
    hint:
      'Walk through Atomicity, Consistency, Isolation, and Durability, followed by Read Committed, Repeatable Read, and Serializable.',
    expectedConcepts: ['ACID', 'isolation levels', 'dirty read', 'non-repeatable read', 'phantom read', 'Serializable'],
    'expected concepts': ['ACID', 'isolation levels', 'dirty read', 'non-repeatable read', 'phantom read', 'Serializable'],
  },

  // ─────────────────────────────────────────
  // TECHNICAL — React & Frontend
  // ─────────────────────────────────────────
  {
    id: 'tech-react-01',
    type: 'Technical',
    difficulty: 'Easy',
    category: 'React',
    role: ['Full Stack Developer', 'Frontend Developer', 'Software Engineer'],
    prompt:
      'Explain the difference between state and props in React. When would you use each?',
    hint:
      'Define both terms, explain who owns the data, and give a short example.',
    expectedConcepts: ['state is mutable', 'props are read-only', 'parent-to-child', 'useState hook', 'reactivity'],
    'expected concepts': ['state is mutable', 'props are read-only', 'parent-to-child', 'useState hook', 'reactivity'],
  },
  {
    id: 'tech-react-02',
    type: 'Technical',
    difficulty: 'Medium',
    category: 'React',
    role: ['Full Stack Developer', 'Frontend Developer', 'Software Engineer'],
    prompt:
      'What is the useEffect hook? Explain its dependency array and cleanup function.',
    hint:
      'Discuss side effects, mount/update/unmount lifecycle, and common pitfalls.',
    expectedConcepts: ['side effects', 'dependency array', 'cleanup function', 'infinite loop risk', 'mount vs. update'],
    'expected concepts': ['side effects', 'dependency array', 'cleanup function', 'infinite loop risk', 'mount vs. update'],
  },
  {
    id: 'tech-react-03',
    type: 'Technical',
    difficulty: 'Hard',
    category: 'React',
    role: ['Full Stack Developer', 'Frontend Developer', 'Software Engineer'],
    prompt:
      'A React application with a deeply nested component tree is re-rendering too often. How would you diagnose and fix the performance issue?',
    hint:
      'Discuss React DevTools profiler, React.memo, useMemo, useCallback, and state colocation.',
    expectedConcepts: ['React.memo', 'useMemo', 'useCallback', 'profiler', 'state colocation', 'virtual DOM diffing'],
    'expected concepts': ['React.memo', 'useMemo', 'useCallback', 'profiler', 'state colocation', 'virtual DOM diffing'],
  },
  {
    id: 'tech-react-04',
    type: 'Technical',
    difficulty: 'Medium',
    category: 'React',
    role: ['Full Stack Developer', 'Frontend Developer', 'Software Engineer'],
    prompt:
      'Compare Context API and Redux for state management. When would you choose each?',
    hint:
      'Discuss scale, boilerplate, devtools support, and re-render performance.',
    expectedConcepts: ['Context API', 'Redux', 'prop drilling', 'boilerplate', 'middleware', 're-render scope'],
    'expected concepts': ['Context API', 'Redux', 'prop drilling', 'boilerplate', 'middleware', 're-render scope'],
  },
  {
    id: 'tech-react-05',
    type: 'Technical',
    difficulty: 'Easy',
    category: 'React',
    role: ['Frontend Developer', 'Full Stack Developer', 'Software Engineer'],
    prompt:
      'How does the Virtual DOM work in React, and why does it make UI updates faster than directly updating the real DOM?',
    hint:
      'Explain reconciliation, diffing algorithm, and batching DOM updates.',
    expectedConcepts: ['Virtual DOM', 'reconciliation', 'diffing algorithm', 'DOM manipulation cost', 'batch updates'],
    'expected concepts': ['Virtual DOM', 'reconciliation', 'diffing algorithm', 'DOM manipulation cost', 'batch updates'],
  },
  {
    id: 'tech-react-06',
    type: 'Technical',
    difficulty: 'Hard',
    category: 'React',
    role: ['Frontend Developer', 'Full Stack Developer', 'Software Engineer'],
    prompt:
      'Compare Client-Side Rendering (CSR), Server-Side Rendering (SSR), and Static Site Generation (SSG). What are the trade-offs for SEO, TTFB, and interactivity?',
    hint:
      'Discuss initial page load, SEO indexing, Time to First Byte, hydration, and caching.',
    expectedConcepts: ['CSR vs SSR vs SSG', 'hydration', 'SEO', 'TTFB', 'First Contentful Paint', 'server caching'],
    'expected concepts': ['CSR vs SSR vs SSG', 'hydration', 'SEO', 'TTFB', 'First Contentful Paint', 'server caching'],
  },

  // ─────────────────────────────────────────
  // TECHNICAL — Java
  // ─────────────────────────────────────────
  {
    id: 'tech-java-01',
    type: 'Technical',
    difficulty: 'Easy',
    category: 'Java',
    role: ['Java Developer', 'Backend Developer', 'Full Stack Developer', 'Software Engineer'],
    prompt:
      'What is the difference between an abstract class and an interface in Java? When would you use each?',
    hint:
      'Discuss single vs. multiple inheritance, default methods (Java 8+), and constructor support.',
    expectedConcepts: ['abstract class', 'interface', 'multiple inheritance', 'default methods', 'constructors'],
    'expected concepts': ['abstract class', 'interface', 'multiple inheritance', 'default methods', 'constructors'],
  },
  {
    id: 'tech-java-02',
    type: 'Technical',
    difficulty: 'Medium',
    category: 'Java',
    role: ['Java Developer', 'Backend Developer', 'Software Engineer'],
    prompt:
      'Explain Java garbage collection. What are the different generations and how does the GC decide what to collect?',
    hint:
      'Discuss Young Generation, Old Generation, GC roots, and mark-and-sweep.',
    expectedConcepts: ['Young Generation', 'Old Generation', 'GC roots', 'mark-and-sweep', 'stop-the-world', 'tuning'],
    'expected concepts': ['Young Generation', 'Old Generation', 'GC roots', 'mark-and-sweep', 'stop-the-world', 'tuning'],
  },
  {
    id: 'tech-java-03',
    type: 'Technical',
    difficulty: 'Hard',
    category: 'Java',
    role: ['Java Developer', 'Backend Developer', 'Software Engineer'],
    prompt:
      'How does the Java Memory Model handle multithreading? Explain the volatile keyword and the happens-before relationship.',
    hint:
      'Discuss thread visibility, instruction reordering, volatile guarantees, and synchronized blocks.',
    expectedConcepts: ['Java Memory Model', 'volatile', 'happens-before', 'visibility', 'reordering', 'synchronized'],
    'expected concepts': ['Java Memory Model', 'volatile', 'happens-before', 'visibility', 'reordering', 'synchronized'],
  },
  {
    id: 'tech-java-04',
    type: 'Technical',
    difficulty: 'Easy',
    category: 'Java',
    role: ['Java Developer', 'Backend Developer', 'Software Engineer'],
    prompt:
      'Explain the difference between HashMap and ConcurrentHashMap in Java. What does fail-fast vs fail-safe mean?',
    hint:
      'Discuss thread safety, synchronized buckets vs segment locking, and ConcurrentModificationException.',
    expectedConcepts: ['thread safety', 'ConcurrentHashMap', 'bucket locking', 'fail-fast iterator', 'ConcurrentModificationException'],
    'expected concepts': ['thread safety', 'ConcurrentHashMap', 'bucket locking', 'fail-fast iterator', 'ConcurrentModificationException'],
  },

  // ─────────────────────────────────────────
  // TECHNICAL — Python
  // ─────────────────────────────────────────
  {
    id: 'tech-python-01',
    type: 'Technical',
    difficulty: 'Easy',
    category: 'Python',
    role: ['Python Developer', 'Full Stack Developer', 'Backend Developer', 'Software Engineer', 'Data Analyst'],
    prompt:
      'What are Python decorators and how do they work? Give a simple example.',
    hint:
      'Explain that decorators are functions that wrap other functions and use the @ syntax.',
    expectedConcepts: ['higher-order function', 'wrapper function', '@ syntax', 'functools.wraps', 'closure'],
    'expected concepts': ['higher-order function', 'wrapper function', '@ syntax', 'functools.wraps', 'closure'],
  },
  {
    id: 'tech-python-02',
    type: 'Technical',
    difficulty: 'Medium',
    category: 'Python',
    role: ['Python Developer', 'Backend Developer', 'Software Engineer', 'Data Analyst'],
    prompt:
      'Explain the Global Interpreter Lock (GIL) in Python. How does it affect multithreading, and what are the alternatives?',
    hint:
      'Discuss CPython, thread safety, multiprocessing, and asyncio.',
    expectedConcepts: ['GIL', 'CPython', 'thread safety', 'multiprocessing', 'asyncio', 'I/O-bound vs. CPU-bound'],
    'expected concepts': ['GIL', 'CPython', 'thread safety', 'multiprocessing', 'asyncio', 'I/O-bound vs. CPU-bound'],
  },
  {
    id: 'tech-python-03',
    type: 'Technical',
    difficulty: 'Hard',
    category: 'Python',
    role: ['Python Developer', 'Backend Developer', 'Software Engineer'],
    prompt:
      'What are Python metaclasses? Explain how and why you would use one.',
    hint:
      'Discuss type as the default metaclass, __new__ vs. __init__, and real-world use cases like ORMs.',
    expectedConcepts: ['metaclass', 'type()', '__new__', '__init__', 'class creation', 'ORM example'],
    'expected concepts': ['metaclass', 'type()', '__new__', '__init__', 'class creation', 'ORM example'],
  },
  {
    id: 'tech-python-04',
    type: 'Technical',
    difficulty: 'Easy',
    category: 'Python',
    role: ['Python Developer', 'Backend Developer', 'Software Engineer', 'Data Analyst'],
    prompt:
      'What is the difference between lists and tuples in Python? When would you use a tuple over a list?',
    hint:
      'Discuss mutability, hashability, dictionary keys, and memory footprint.',
    expectedConcepts: ['mutability', 'immutable tuple', 'hashable', 'dictionary keys', 'memory footprint'],
    'expected concepts': ['mutability', 'immutable tuple', 'hashable', 'dictionary keys', 'memory footprint'],
  },

  // ─────────────────────────────────────────
  // TECHNICAL — System design
  // ─────────────────────────────────────────
  {
    id: 'tech-sd-01',
    type: 'Technical',
    difficulty: 'Medium',
    category: 'System design',
    role: ['Full Stack Developer', 'Backend Developer', 'Software Engineer'],
    prompt:
      'Design a URL shortener service like bit.ly. Walk through the high-level architecture.',
    hint:
      'Discuss hashing/encoding, database schema, redirect flow, and scaling considerations.',
    expectedConcepts: ['base62 encoding', 'database lookup', 'redirect 301/302', 'caching', 'collision handling'],
    'expected concepts': ['base62 encoding', 'database lookup', 'redirect 301/302', 'caching', 'collision handling'],
  },
  {
    id: 'tech-sd-02',
    type: 'Technical',
    difficulty: 'Hard',
    category: 'System design',
    role: ['Full Stack Developer', 'Backend Developer', 'Software Engineer'],
    prompt:
      'A page becomes slow when a list grows to several thousand rows. How would you investigate and improve it?',
    hint:
      'Start with measurement, identify the bottleneck, then discuss rendering and data-loading options.',
    expectedConcepts: ['profiling', 'virtualization', 'pagination', 'lazy loading', 'debounce', 'memoization'],
    'expected concepts': ['profiling', 'virtualization', 'pagination', 'lazy loading', 'debounce', 'memoization'],
  },
  {
    id: 'tech-sd-03',
    type: 'Technical',
    difficulty: 'Hard',
    category: 'System design',
    role: ['Full Stack Developer', 'Backend Developer', 'Software Engineer'],
    prompt:
      'Design a real-time chat application. Discuss the architecture, message delivery guarantees, and scaling strategies.',
    hint:
      'Consider WebSockets, message queues, database choice, and horizontal scaling.',
    expectedConcepts: ['WebSocket', 'message queue', 'at-least-once delivery', 'horizontal scaling', 'presence tracking'],
    'expected concepts': ['WebSocket', 'message queue', 'at-least-once delivery', 'horizontal scaling', 'presence tracking'],
  },
  {
    id: 'tech-sd-04',
    type: 'Technical',
    difficulty: 'Medium',
    category: 'System design',
    role: ALL_ROLES,
    prompt:
      'What is the difference between a monolithic architecture and microservices? What are the trade-offs?',
    hint:
      'Discuss deployment complexity, team autonomy, data consistency, and debugging.',
    expectedConcepts: ['monolith', 'microservices', 'deployment', 'data consistency', 'network latency', 'team autonomy'],
    'expected concepts': ['monolith', 'microservices', 'deployment', 'data consistency', 'network latency', 'team autonomy'],
  },

  // ─────────────────────────────────────────
  // TECHNICAL — Problem solving (general)
  // ─────────────────────────────────────────
  {
    id: 'tech-ps-01',
    type: 'Technical',
    difficulty: 'Easy',
    category: 'Problem solving',
    role: ALL_ROLES,
    prompt:
      'Given a string, how would you check if it is a palindrome? Describe your approach and its time complexity.',
    hint:
      'Consider two-pointer technique or reversing the string.',
    expectedConcepts: ['two pointers', 'string reversal', 'O(n) time', 'edge cases', 'case sensitivity'],
    'expected concepts': ['two pointers', 'string reversal', 'O(n) time', 'edge cases', 'case sensitivity'],
  },
  {
    id: 'tech-ps-02',
    type: 'Technical',
    difficulty: 'Medium',
    category: 'Problem solving',
    role: ALL_ROLES,
    prompt:
      'Given an array of integers, find two numbers that add up to a target value. What is the most efficient approach?',
    hint:
      'Think about using a hash map to store complements.',
    expectedConcepts: ['hash map', 'complement lookup', 'O(n) time', 'O(n) space', 'brute force O(n²)'],
    'expected concepts': ['hash map', 'complement lookup', 'O(n) time', 'O(n) space', 'brute force O(n²)'],
  },
  {
    id: 'tech-ps-03',
    type: 'Technical',
    difficulty: 'Hard',
    category: 'Problem solving',
    role: ALL_ROLES,
    prompt:
      'You have a stream of integers arriving one at a time. Design a system to find the median efficiently at any point.',
    hint:
      'Consider using two heaps (a max-heap and a min-heap).',
    expectedConcepts: ['max heap', 'min heap', 'balanced heaps', 'O(log n) insertion', 'O(1) median'],
    'expected concepts': ['max heap', 'min heap', 'balanced heaps', 'O(log n) insertion', 'O(1) median'],
  },

  // ─────────────────────────────────────────
  // TECHNICAL — Data Analyst specific
  // ─────────────────────────────────────────
  {
    id: 'tech-da-01',
    type: 'Technical',
    difficulty: 'Easy',
    category: 'Problem solving',
    role: ['Data Analyst'],
    prompt:
      'What is the difference between descriptive, diagnostic, predictive, and prescriptive analytics?',
    hint:
      'Explain each type with a business example.',
    expectedConcepts: ['descriptive', 'diagnostic', 'predictive', 'prescriptive', 'business examples'],
    'expected concepts': ['descriptive', 'diagnostic', 'predictive', 'prescriptive', 'business examples'],
  },
  {
    id: 'tech-da-02',
    type: 'Technical',
    difficulty: 'Medium',
    category: 'Problem solving',
    role: ['Data Analyst', 'Python Developer'],
    prompt:
      'How would you handle missing data in a dataset? Discuss different strategies and their trade-offs.',
    hint:
      'Discuss deletion, imputation (mean, median, mode, model-based), and when each is appropriate.',
    expectedConcepts: ['deletion', 'imputation', 'mean/median/mode', 'model-based', 'bias', 'data quality'],
    'expected concepts': ['deletion', 'imputation', 'mean/median/mode', 'model-based', 'bias', 'data quality'],
  },
  {
    id: 'tech-da-03',
    type: 'Technical',
    difficulty: 'Hard',
    category: 'Problem solving',
    role: ['Data Analyst'],
    prompt:
      'A business stakeholder claims that a recent marketing campaign increased sales by 20%. How would you validate this claim?',
    hint:
      'Discuss A/B testing, confounding variables, statistical significance, and causation vs. correlation.',
    expectedConcepts: ['A/B testing', 'confounding variables', 'statistical significance', 'causation vs. correlation'],
    'expected concepts': ['A/B testing', 'confounding variables', 'statistical significance', 'causation vs. correlation'],
  },

  // ─────────────────────────────────────────
  // BEHAVIORAL — Communication & Teamwork
  // ─────────────────────────────────────────
  {
    id: 'beh-comm-01',
    type: 'Behavioral',
    difficulty: 'Easy',
    category: 'Communication',
    role: ALL_ROLES,
    prompt:
      'Tell me about a time you had to explain a complex technical concept to a non-technical stakeholder.',
    hint:
      'Describe the context, the concept, how you simplified it, and the outcome.',
    expectedConcepts: ['simplification', 'analogies', 'audience awareness', 'positive outcome', 'feedback'],
    'expected concepts': ['simplification', 'analogies', 'audience awareness', 'positive outcome', 'feedback'],
  },
  {
    id: 'beh-comm-02',
    type: 'Behavioral',
    difficulty: 'Medium',
    category: 'Communication',
    role: ALL_ROLES,
    prompt:
      'Describe a time you disagreed with a teammate about an implementation. How did you resolve it?',
    hint:
      'Focus on listening, evidence, collaboration, and the final decision.',
    expectedConcepts: ['active listening', 'evidence-based argument', 'compromise', 'respect', 'outcome'],
    'expected concepts': ['active listening', 'evidence-based argument', 'compromise', 'respect', 'outcome'],
  },
  {
    id: 'beh-comm-03',
    type: 'Behavioral',
    difficulty: 'Hard',
    category: 'Communication',
    role: ALL_ROLES,
    prompt:
      'Tell me about a time you had to deliver bad news to a client or manager. How did you handle the conversation?',
    hint:
      'Discuss transparency, preparation, proposed solutions, and follow-up.',
    expectedConcepts: ['transparency', 'empathy', 'proposed solutions', 'follow-up actions', 'trust building'],
    'expected concepts': ['transparency', 'empathy', 'proposed solutions', 'follow-up actions', 'trust building'],
  },
  {
    id: 'beh-comm-04',
    type: 'Behavioral',
    difficulty: 'Medium',
    category: 'Communication',
    role: ALL_ROLES,
    prompt:
      'Give an example of when you had to give constructive feedback to a peer. How did you approach it?',
    hint:
      'Describe the situation, the feedback method, the reaction, and what you learned.',
    expectedConcepts: ['constructive feedback', 'specific examples', 'timing', 'empathy', 'improvement'],
    'expected concepts': ['constructive feedback', 'specific examples', 'timing', 'empathy', 'improvement'],
  },
  {
    id: 'beh-comm-05',
    type: 'Behavioral',
    difficulty: 'Medium',
    category: 'Communication',
    role: ALL_ROLES,
    prompt:
      'Tell me about a time you had a technical disagreement with a team lead or architect. How did you advocate for your point of view respectfully?',
    hint:
      'Discuss using data, prototypes, agreeing on criteria, and disagreeing and committing when appropriate.',
    expectedConcepts: ['objective data', 'prototyping', 'professional disagreement', 'disagree and commit', 'respect'],
    'expected concepts': ['objective data', 'prototyping', 'professional disagreement', 'disagree and commit', 'respect'],
  },
  {
    id: 'beh-comm-06',
    type: 'Behavioral',
    difficulty: 'Hard',
    category: 'Communication',
    role: ALL_ROLES,
    prompt:
      'Tell me about a time you received critical or unexpected feedback during a performance evaluation. How did you process it and adapt?',
    hint:
      'Focus on emotional maturity, asking clarifying questions, and building a concrete action plan.',
    expectedConcepts: ['emotional maturity', 'clarifying questions', 'action plan', 'growth mindset', 'measurable improvement'],
    'expected concepts': ['emotional maturity', 'clarifying questions', 'action plan', 'growth mindset', 'measurable improvement'],
  },
  {
    id: 'beh-comm-07',
    type: 'Behavioral',
    difficulty: 'Easy',
    category: 'Communication',
    role: ALL_ROLES,
    prompt:
      'How do you keep cross-functional team members (such as designers, product managers, and QA) informed about your engineering progress?',
    hint:
      'Mention daily standups, async documentation, demos, and proactive blocker communication.',
    expectedConcepts: ['async documentation', 'proactive updates', 'blocker transparency', 'demos', 'collaboration'],
    'expected concepts': ['async documentation', 'proactive updates', 'blocker transparency', 'demos', 'collaboration'],
  },

  // ─────────────────────────────────────────
  // BEHAVIORAL — Problem solving
  // ─────────────────────────────────────────
  {
    id: 'beh-ps-01',
    type: 'Behavioral',
    difficulty: 'Easy',
    category: 'Problem solving',
    role: ALL_ROLES,
    prompt:
      'Tell me about a challenging problem you solved at work or in a project. How did you approach it?',
    hint:
      'Use a clear sequence: context, the challenge, the actions you took, and the measurable result.',
    expectedConcepts: ['structured approach', 'root cause analysis', 'actions taken', 'measurable result'],
    'expected concepts': ['structured approach', 'root cause analysis', 'actions taken', 'measurable result'],
  },
  {
    id: 'beh-ps-02',
    type: 'Behavioral',
    difficulty: 'Medium',
    category: 'Problem solving',
    role: ALL_ROLES,
    prompt:
      'Describe a situation where you had to make a decision with incomplete information. What was your approach?',
    hint:
      'Discuss risk assessment, gathering available data, making assumptions explicit, and validating later.',
    expectedConcepts: ['risk assessment', 'assumptions', 'decision framework', 'validation', 'outcome'],
    'expected concepts': ['risk assessment', 'assumptions', 'decision framework', 'validation', 'outcome'],
  },
  {
    id: 'beh-ps-03',
    type: 'Behavioral',
    difficulty: 'Hard',
    category: 'Problem solving',
    role: ALL_ROLES,
    prompt:
      'Tell me about a time a project was failing or behind schedule. What steps did you take to recover it?',
    hint:
      'Discuss root cause identification, re-prioritization, communication with stakeholders, and results.',
    expectedConcepts: ['root cause', 'prioritization', 'stakeholder communication', 'recovery actions', 'lessons learned'],
    'expected concepts': ['root cause', 'prioritization', 'stakeholder communication', 'recovery actions', 'lessons learned'],
  },
  {
    id: 'beh-ps-04',
    type: 'Behavioral',
    difficulty: 'Medium',
    category: 'Problem solving',
    role: ALL_ROLES,
    prompt:
      'Give an example of a time you identified a potential problem before it became critical. How did you act?',
    hint:
      'Discuss monitoring, pattern recognition, proactive communication, and prevention.',
    expectedConcepts: ['proactive detection', 'risk mitigation', 'communication', 'prevention', 'impact'],
    'expected concepts': ['proactive detection', 'risk mitigation', 'communication', 'prevention', 'impact'],
  },
  {
    id: 'beh-ps-05',
    type: 'Behavioral',
    difficulty: 'Easy',
    category: 'Problem solving',
    role: ALL_ROLES,
    prompt:
      'Describe a time you made an error or oversight in production or code. How did you take ownership and resolve it?',
    hint:
      'Discuss immediate mitigation, transparent disclosure, root cause investigation, and preventive safeguards.',
    expectedConcepts: ['ownership', 'immediate mitigation', 'transparent communication', 'postmortem', 'prevention'],
    'expected concepts': ['ownership', 'immediate mitigation', 'transparent communication', 'postmortem', 'prevention'],
  },
  {
    id: 'beh-ps-06',
    type: 'Behavioral',
    difficulty: 'Hard',
    category: 'Problem solving',
    role: ALL_ROLES,
    prompt:
      'Describe a situation where you had to prioritize multiple high-urgency bug reports with competing business stakeholders.',
    hint:
      'Discuss severity criteria, customer impact, transparent queue communication, and balancing quick fixes with root causes.',
    expectedConcepts: ['severity framework', 'customer impact assessment', 'stakeholder negotiation', 'sustainable fixes'],
    'expected concepts': ['severity framework', 'customer impact assessment', 'stakeholder negotiation', 'sustainable fixes'],
  },
  {
    id: 'beh-ps-07',
    type: 'Behavioral',
    difficulty: 'Medium',
    category: 'Problem solving',
    role: ALL_ROLES,
    prompt:
      'Tell me about an innovative idea or workflow improvement you proposed and implemented for your team.',
    hint:
      'Explain the pain point, how you prototyped the solution, got buy-in, and measured the positive outcome.',
    expectedConcepts: ['initiative', 'workflow efficiency', 'team buy-in', 'measurable improvement', 'automation'],
    'expected concepts': ['initiative', 'workflow efficiency', 'team buy-in', 'measurable improvement', 'automation'],
  },

  // ─────────────────────────────────────────
  // BEHAVIORAL — Leadership & Teamwork
  // ─────────────────────────────────────────
  {
    id: 'beh-lead-01',
    type: 'Behavioral',
    difficulty: 'Easy',
    category: 'Communication',
    role: ALL_ROLES,
    prompt:
      'Describe a successful team project. What was your role, and how did you contribute to the team\'s success?',
    hint:
      'Highlight your specific contributions, collaboration, and the outcome.',
    expectedConcepts: ['role clarity', 'collaboration', 'specific contributions', 'outcome', 'team dynamics'],
    'expected concepts': ['role clarity', 'collaboration', 'specific contributions', 'outcome', 'team dynamics'],
  },
  {
    id: 'beh-lead-02',
    type: 'Behavioral',
    difficulty: 'Medium',
    category: 'Communication',
    role: ALL_ROLES,
    prompt:
      'Tell me about a time you had to work with a difficult colleague. How did you manage the relationship?',
    hint:
      'Discuss empathy, finding common ground, clear communication, and maintaining professionalism.',
    expectedConcepts: ['empathy', 'common ground', 'professionalism', 'conflict resolution', 'positive outcome'],
    'expected concepts': ['empathy', 'common ground', 'professionalism', 'conflict resolution', 'positive outcome'],
  },
  {
    id: 'beh-lead-03',
    type: 'Behavioral',
    difficulty: 'Hard',
    category: 'Communication',
    role: ALL_ROLES,
    prompt:
      'Describe a time you led an initiative without formal authority. How did you influence others and drive results?',
    hint:
      'Discuss building consensus, leading by example, communication, and measurable impact.',
    expectedConcepts: ['influence without authority', 'consensus building', 'leading by example', 'measurable impact'],
    'expected concepts': ['influence without authority', 'consensus building', 'leading by example', 'measurable impact'],
  },
  {
    id: 'beh-lead-04',
    type: 'Behavioral',
    difficulty: 'Medium',
    category: 'Communication',
    role: ALL_ROLES,
    prompt:
      'Tell me about an occasion where you mentored a less experienced engineer or helped a colleague unblock themselves.',
    hint:
      'Discuss identifying learning gaps, guided questioning rather than just giving answers, and the long-term result.',
    expectedConcepts: ['mentorship', 'guided questioning', 'patience', 'knowledge sharing', 'mentee empowerment'],
    'expected concepts': ['mentorship', 'guided questioning', 'patience', 'knowledge sharing', 'mentee empowerment'],
  },

  // ─────────────────────────────────────────
  // BEHAVIORAL — Adaptability
  // ─────────────────────────────────────────
  {
    id: 'beh-adapt-01',
    type: 'Behavioral',
    difficulty: 'Easy',
    category: 'Problem solving',
    role: ALL_ROLES,
    prompt:
      'Tell me about a time you had to quickly learn a new technology or tool for a project.',
    hint:
      'Describe the context, your learning strategy, how you applied it, and the result.',
    expectedConcepts: ['learning strategy', 'time management', 'application', 'resourcefulness', 'outcome'],
    'expected concepts': ['learning strategy', 'time management', 'application', 'resourcefulness', 'outcome'],
  },
  {
    id: 'beh-adapt-02',
    type: 'Behavioral',
    difficulty: 'Medium',
    category: 'Problem solving',
    role: ALL_ROLES,
    prompt:
      'Describe a time when project requirements changed significantly midway through. How did you adapt?',
    hint:
      'Discuss impact assessment, re-planning, communication, and delivering despite changes.',
    expectedConcepts: ['impact assessment', 're-planning', 'flexibility', 'communication', 'delivery'],
    'expected concepts': ['impact assessment', 're-planning', 'flexibility', 'communication', 'delivery'],
  },
  {
    id: 'beh-adapt-03',
    type: 'Behavioral',
    difficulty: 'Hard',
    category: 'Problem solving',
    role: ALL_ROLES,
    prompt:
      'Tell me about a significant failure or setback in your career. What did you learn, and how did it change your approach?',
    hint:
      'Be honest about the failure, focus on the lessons learned, and how you applied them later.',
    expectedConcepts: ['honesty', 'self-reflection', 'lessons learned', 'growth mindset', 'applied changes'],
    'expected concepts': ['honesty', 'self-reflection', 'lessons learned', 'growth mindset', 'applied changes'],
  },

  // ─────────────────────────────────────────
  // HR — Introduction & Self-awareness
  // ─────────────────────────────────────────
  {
    id: 'hr-intro-01',
    type: 'HR',
    difficulty: 'Easy',
    category: 'Communication',
    role: ALL_ROLES,
    prompt:
      'Tell me about yourself and why you are interested in this role.',
    hint:
      'Mention your education, technical skills, projects, strengths, and career goals.',
    expectedConcepts: ['background summary', 'relevant skills', 'motivation', 'career alignment'],
    'expected concepts': ['background summary', 'relevant skills', 'motivation', 'career alignment'],
  },
  {
    id: 'hr-intro-02',
    type: 'HR',
    difficulty: 'Easy',
    category: 'Communication',
    role: ALL_ROLES,
    prompt:
      'What are your greatest strengths and how have they helped you in your career so far?',
    hint:
      'Pick 2-3 strengths with concrete examples demonstrating each.',
    expectedConcepts: ['self-awareness', 'concrete examples', 'relevance to role', 'impact'],
    'expected concepts': ['self-awareness', 'concrete examples', 'relevance to role', 'impact'],
  },
  {
    id: 'hr-intro-03',
    type: 'HR',
    difficulty: 'Medium',
    category: 'Communication',
    role: ALL_ROLES,
    prompt:
      'What is your biggest weakness, and what steps have you taken to improve it?',
    hint:
      'Be genuine, describe a real area for growth, and focus on the improvement actions.',
    expectedConcepts: ['honesty', 'self-awareness', 'improvement actions', 'growth mindset'],
    'expected concepts': ['honesty', 'self-awareness', 'improvement actions', 'growth mindset'],
  },

  // ─────────────────────────────────────────
  // HR — Career goals
  // ─────────────────────────────────────────
  {
    id: 'hr-career-01',
    type: 'HR',
    difficulty: 'Medium',
    category: 'Problem solving',
    role: ALL_ROLES,
    prompt:
      'Where do you see yourself in the next five years, and how will this role help you achieve your goals?',
    hint:
      'Connect your career goals with learning, professional growth, and the responsibilities of the role.',
    expectedConcepts: ['career vision', 'role alignment', 'growth plan', 'specific goals'],
    'expected concepts': ['career vision', 'role alignment', 'growth plan', 'specific goals'],
  },
  {
    id: 'hr-career-02',
    type: 'HR',
    difficulty: 'Easy',
    category: 'Problem solving',
    role: ALL_ROLES,
    prompt:
      'Why are you leaving (or considering leaving) your current position?',
    hint:
      'Stay positive. Focus on growth, new challenges, and alignment with your career path.',
    expectedConcepts: ['positive framing', 'growth motivation', 'no negativity about past employer', 'forward-looking'],
    'expected concepts': ['positive framing', 'growth motivation', 'no negativity about past employer', 'forward-looking'],
  },
  {
    id: 'hr-career-03',
    type: 'HR',
    difficulty: 'Medium',
    category: 'Problem solving',
    role: ALL_ROLES,
    prompt:
      'What motivates you in your work? What kind of work environment helps you perform your best?',
    hint:
      'Be specific about what energizes you and what conditions help you do great work.',
    expectedConcepts: ['intrinsic motivation', 'work environment', 'specific examples', 'self-awareness'],
    'expected concepts': ['intrinsic motivation', 'work environment', 'specific examples', 'self-awareness'],
  },

  // ─────────────────────────────────────────
  // HR — Company & Culture fit
  // ─────────────────────────────────────────
  {
    id: 'hr-culture-01',
    type: 'HR',
    difficulty: 'Easy',
    category: 'Communication',
    role: ALL_ROLES,
    prompt:
      'Why do you want to work at this company?',
    hint:
      'Research the company. Mention products, mission, culture, or recent news that resonates with you.',
    expectedConcepts: ['company research', 'mission alignment', 'specific reasons', 'enthusiasm'],
    'expected concepts': ['company research', 'mission alignment', 'specific reasons', 'enthusiasm'],
  },
  {
    id: 'hr-culture-02',
    type: 'HR',
    difficulty: 'Medium',
    category: 'Communication',
    role: ALL_ROLES,
    prompt:
      'How do you handle pressure or tight deadlines?',
    hint:
      'Give a specific example. Discuss prioritization, time management, and maintaining quality.',
    expectedConcepts: ['specific example', 'prioritization', 'time management', 'quality', 'composure'],
    'expected concepts': ['specific example', 'prioritization', 'time management', 'quality', 'composure'],
  },
  {
    id: 'hr-culture-03',
    type: 'HR',
    difficulty: 'Hard',
    category: 'Communication',
    role: ALL_ROLES,
    prompt:
      'Describe a situation where you had to balance multiple competing priorities. How did you decide what to focus on?',
    hint:
      'Discuss your prioritization framework, communication with stakeholders, and the outcome.',
    expectedConcepts: ['prioritization framework', 'stakeholder communication', 'trade-offs', 'outcome', 'reflection'],
    'expected concepts': ['prioritization framework', 'stakeholder communication', 'trade-offs', 'outcome', 'reflection'],
  },
  {
    id: 'hr-culture-04',
    type: 'HR',
    difficulty: 'Easy',
    category: 'Communication',
    role: ALL_ROLES,
    prompt:
      'How would your former team members and managers describe your working style and everyday collaboration?',
    hint:
      'Highlight reliability, responsiveness, helpfulness, and curiosity with concrete examples.',
    expectedConcepts: ['reliability', 'collaborative spirit', 'responsiveness', 'positive attitude', 'peer feedback'],
    'expected concepts': ['reliability', 'collaborative spirit', 'responsiveness', 'positive attitude', 'peer feedback'],
  },
  {
    id: 'hr-culture-05',
    type: 'HR',
    difficulty: 'Medium',
    category: 'Communication',
    role: ALL_ROLES,
    prompt:
      'How do you manage communication, focus, and work-life balance when working in a remote or hybrid environment?',
    hint:
      'Discuss setting boundaries, asynchronous tools, active check-ins, and avoiding burnout.',
    expectedConcepts: ['asynchronous communication', 'work-life boundaries', 'time blocking', 'burnout prevention'],
    'expected concepts': ['asynchronous communication', 'work-life boundaries', 'time blocking', 'burnout prevention'],
  },

  // ─────────────────────────────────────────
  // HR — Salary & Logistics
  // ─────────────────────────────────────────
  {
    id: 'hr-salary-01',
    type: 'HR',
    difficulty: 'Medium',
    category: 'Communication',
    role: ALL_ROLES,
    prompt:
      'What are your salary expectations for this role?',
    hint:
      'Research market rates, express flexibility, and frame your answer around the value you bring.',
    expectedConcepts: ['market research', 'flexibility', 'value proposition', 'professional tone'],
    'expected concepts': ['market research', 'flexibility', 'value proposition', 'professional tone'],
  },
  {
    id: 'hr-salary-02',
    type: 'HR',
    difficulty: 'Easy',
    category: 'Communication',
    role: ALL_ROLES,
    prompt:
      'Do you have any questions for us?',
    hint:
      'Ask about team culture, growth opportunities, current projects, or challenges the team faces.',
    expectedConcepts: ['thoughtful questions', 'company interest', 'role curiosity', 'growth mindset'],
    'expected concepts': ['thoughtful questions', 'company interest', 'role curiosity', 'growth mindset'],
  },

  // ─────────────────────────────────────────
  // HR — Ethics & Values
  // ─────────────────────────────────────────
  {
    id: 'hr-ethics-01',
    type: 'HR',
    difficulty: 'Hard',
    category: 'Problem solving',
    role: ALL_ROLES,
    prompt:
      'Tell me about a time you faced an ethical dilemma at work. How did you handle it?',
    hint:
      'Describe the dilemma clearly, your thought process, the decision, and the outcome.',
    expectedConcepts: ['ethical reasoning', 'integrity', 'decision process', 'outcome', 'values'],
    'expected concepts': ['ethical reasoning', 'integrity', 'decision process', 'outcome', 'values'],
  },
  {
    id: 'hr-ethics-02',
    type: 'HR',
    difficulty: 'Medium',
    category: 'Problem solving',
    role: ALL_ROLES,
    prompt:
      'How do you stay current with industry trends and continue learning?',
    hint:
      'Mention specific resources, communities, courses, or habits.',
    expectedConcepts: ['continuous learning', 'specific resources', 'community involvement', 'growth habits'],
    'expected concepts': ['continuous learning', 'specific resources', 'community involvement', 'growth habits'],
  },
  {
    id: 'hr-ethics-03',
    type: 'HR',
    difficulty: 'Hard',
    category: 'Communication',
    role: ALL_ROLES,
    prompt:
      'If you discovered that a colleague was taking credit for someone else\'s work, what would you do?',
    hint:
      'Discuss how you would verify the situation, approach the colleague, and escalate if needed.',
    expectedConcepts: ['verification', 'direct conversation', 'escalation path', 'fairness', 'integrity'],
    'expected concepts': ['verification', 'direct conversation', 'escalation path', 'fairness', 'integrity'],
  },
  {
    id: 'hr-ethics-04',
    type: 'HR',
    difficulty: 'Hard',
    category: 'Problem solving',
    role: ALL_ROLES,
    prompt:
      'What factors make you stay committed long-term at a company, and what conditions would cause you to re-evaluate your position?',
    hint:
      'Discuss continuous growth, psychological safety, impactful mission, and transparent leadership.',
    expectedConcepts: ['long-term commitment', 'growth opportunities', 'company culture', 'leadership transparency', 'core values'],
    'expected concepts': ['long-term commitment', 'growth opportunities', 'company culture', 'leadership transparency', 'core values'],
  },
  {
    id: 'hr-ethics-05',
    type: 'HR',
    difficulty: 'Medium',
    category: 'Communication',
    role: ALL_ROLES,
    prompt:
      'How do you maintain enthusiasm and morale when a project you spent months working on gets cancelled or deprioritized?',
    hint:
      'Discuss understanding business rationale, extracting lessons learned, and redirecting energy toward new priorities.',
    expectedConcepts: ['business perspective', 'emotional resilience', 'lessons learned', 'adaptability', 'team morale'],
    'expected concepts': ['business perspective', 'emotional resilience', 'lessons learned', 'adaptability', 'team morale'],
  },

  // ─────────────────────────────────────────
  // MIXED — Cross-cutting Technical & Behavioral
  // ─────────────────────────────────────────
  {
    id: 'mix-techdeb-01',
    type: 'Mixed',
    difficulty: 'Easy',
    category: 'System design',
    role: ALL_ROLES,
    prompt:
      'How do you explain technical debt to a non-technical product manager, and how do you negotiate time in the sprint to address it?',
    hint:
      'Use real-world analogies, explain the risk of compounding bugs or velocity slowdown, and propose dedicating a fixed percentage of sprint capacity.',
    expectedConcepts: ['simplification', 'business impact', 'maintenance cost', 'negotiation', 'risk mitigation'],
    'expected concepts': ['simplification', 'business impact', 'maintenance cost', 'negotiation', 'risk mitigation'],
  },
  {
    id: 'mix-outage-01',
    type: 'Mixed',
    difficulty: 'Medium',
    category: 'Problem solving',
    role: ALL_ROLES,
    prompt:
      'Describe how you would handle a sudden production outage on a critical service. Walk through technical triage, customer communication, and postmortem analysis.',
    hint:
      'Focus on keeping a cool head, rolling back safely before root-causing, maintaining status page updates, and conducting a blameless post-mortem.',
    expectedConcepts: ['triage', 'incident command', 'stakeholder updates', 'rollback', 'blameless postmortem'],
    'expected concepts': ['triage', 'incident command', 'stakeholder updates', 'rollback', 'blameless postmortem'],
  },
  {
    id: 'mix-review-01',
    type: 'Mixed',
    difficulty: 'Easy',
    category: 'Communication',
    role: ALL_ROLES,
    prompt:
      'When reviewing a pull request with severe design or performance flaws from a colleague, how do you deliver actionable feedback while keeping the conversation constructive?',
    hint:
      'Discuss focusing on code rather than the person, asking questions, offering alternatives, and pairing on complex sections.',
    expectedConcepts: ['constructive feedback', 'code review best practices', 'empathy', 'actionable suggestions', 'positive tone'],
    'expected concepts': ['constructive feedback', 'code review best practices', 'empathy', 'actionable suggestions', 'positive tone'],
  },
  {
    id: 'mix-tradeoff-01',
    type: 'Mixed',
    difficulty: 'Hard',
    category: 'System design',
    role: ['Full Stack Developer', 'Backend Developer', 'Software Engineer'],
    prompt:
      'A business sponsor insists on 100% real-time data consistency across multiple global cloud regions without sacrificing latency. How do you explain the architectural trade-offs and guide them to a pragmatic compromise?',
    hint:
      'Explain the CAP theorem or PACELC theorem in accessible terms, the speed of light network latency, and explore read-after-write consistency or eventual consistency options.',
    expectedConcepts: ['CAP theorem', 'eventual consistency', 'SLA negotiation', 'partition tolerance', 'pragmatic trade-offs'],
    'expected concepts': ['CAP theorem', 'eventual consistency', 'SLA negotiation', 'partition tolerance', 'pragmatic trade-offs'],
  },
  {
    id: 'mix-sec-01',
    type: 'Mixed',
    difficulty: 'Medium',
    category: 'Problem solving',
    role: ALL_ROLES,
    prompt:
      'A high-severity zero-day vulnerability is reported in an open-source library used across your production systems on the eve of a scheduled major product release. How do you respond?',
    hint:
      'Discuss risk assessment, evaluating exploitability, patching or isolating the vulnerability, aligning engineering and release management, and executive status reporting.',
    expectedConcepts: ['vulnerability severity', 'dependency audit', 'risk assessment', 'hotfix vs delay', 'cross-functional communication'],
    'expected concepts': ['vulnerability severity', 'dependency audit', 'risk assessment', 'hotfix vs delay', 'cross-functional communication'],
  },
  {
    id: 'mix-perf-01',
    type: 'Mixed',
    difficulty: 'Medium',
    category: 'React',
    role: ['Full Stack Developer', 'Frontend Developer', 'Software Engineer'],
    prompt:
      'Users complain that the web interface stutters when scrolling through dynamic tables. How do you measure the performance issue technically and set realistic delivery expectations with product stakeholders?',
    hint:
      'Discuss Chrome DevTools profiling, virtualization or debouncing, metrics like INP/LCP, and communicating incremental performance milestones.',
    expectedConcepts: ['profiling', 'virtualization', 'Core Web Vitals', 'incremental optimization', 'expectation management'],
    'expected concepts': ['profiling', 'virtualization', 'Core Web Vitals', 'incremental optimization', 'expectation management'],
  },
  {
    id: 'mix-data-01',
    type: 'Mixed',
    difficulty: 'Easy',
    category: 'SQL',
    role: ['Data Analyst', 'Backend Developer', 'Full Stack Developer'],
    prompt:
      'Two departmental managers present conflicting revenue numbers derived from different database queries. How do you audit the queries, resolve discrepancies, and present the single source of truth?',
    hint:
      'Discuss examining join logic, filter criteria, data freshness, timestamps, and documenting standardized metrics.',
    expectedConcepts: ['data reconciliation', 'business logic check', 'query audit', 'clear explanation', 'data governance'],
    'expected concepts': ['data reconciliation', 'business logic check', 'query audit', 'clear explanation', 'data governance'],
  },
  {
    id: 'mix-agile-01',
    type: 'Mixed',
    difficulty: 'Easy',
    category: 'Communication',
    role: ALL_ROLES,
    prompt:
      'Midway through a sprint, engineering discovers that an estimated task is twice as complex as originally thought due to hidden legacy API limitations. How do you handle this with your team and product owner?',
    hint:
      'Discuss immediate transparency, scoping down to an MVP, splitting user stories, and adjusting sprint velocity projections.',
    expectedConcepts: ['scope negotiation', 'MVP definition', 'velocity metrics', 'transparent communication', 'value delivery'],
    'expected concepts': ['scope negotiation', 'MVP definition', 'velocity metrics', 'transparent communication', 'value delivery'],
  },
  {
    id: 'mix-legacy-01',
    type: 'Mixed',
    difficulty: 'Hard',
    category: 'System design',
    role: ['Full Stack Developer', 'Backend Developer', 'Java Developer', 'Python Developer', 'Software Engineer'],
    prompt:
      'How would you architect the migration of a legacy monolithic database to microservices while maintaining zero downtime and keeping multiple development teams in sync?',
    hint:
      'Discuss the Strangler Fig pattern, dual-writing or change-data-capture (CDC), feature flags, and team communication protocols.',
    expectedConcepts: ['Strangler Fig pattern', 'feature flags', 'canary deployments', 'data migration', 'team alignment'],
    'expected concepts': ['Strangler Fig pattern', 'feature flags', 'canary deployments', 'data migration', 'team alignment'],
  },
  {
    id: 'mix-mentor-01',
    type: 'Mixed',
    difficulty: 'Medium',
    category: 'Communication',
    role: ALL_ROLES,
    prompt:
      'A junior developer on your team repeatedly introduces unhandled promise rejections and race conditions in asynchronous code. How do you coach them toward mastery?',
    hint:
      'Discuss pair programming, visual event loop explanations, recommended linting rules, and constructive feedback loops.',
    expectedConcepts: ['pair programming', 'diagnostic empathy', 'learning path', 'patience', 'psychological safety'],
    'expected concepts': ['pair programming', 'diagnostic empathy', 'learning path', 'patience', 'psychological safety'],
  },
  {
    id: 'mix-stack-01',
    type: 'Mixed',
    difficulty: 'Hard',
    category: 'Problem solving',
    role: ALL_ROLES,
    prompt:
      'Your engineering organization needs to choose a new frontend framework. Two senior engineers strongly disagree on the choice. How do you lead an objective technical evaluation that brings everyone to consensus?',
    hint:
      'Propose an RFC process, define evaluation criteria (ecosystem, talent pool, performance, maintainability), build small spikes, and run an open decision matrix.',
    expectedConcepts: ['RFC process', 'POC benchmarks', 'decision matrix', 'consensus building', 'objective criteria'],
    'expected concepts': ['RFC process', 'POC benchmarks', 'decision matrix', 'consensus building', 'objective criteria'],
  },
  {
    id: 'mix-deploy-01',
    type: 'Mixed',
    difficulty: 'Medium',
    category: 'Problem solving',
    role: ['Full Stack Developer', 'Backend Developer', 'Software Engineer'],
    prompt:
      'A release deployment pipeline gets blocked right before a customer demo due to flaky end-to-end tests. How do you assess the risk of overriding the test versus delaying the demo?',
    hint:
      'Discuss risk matrices, isolating flaky tests from critical path regressions, manual sanity checks, and holding an immediate postmortem to stabilize the test suite.',
    expectedConcepts: ['emergency hotfix protocol', 'test isolation', 'flaky test triage', 'CI/CD reliability', 'root cause analysis'],
    'expected concepts': ['emergency hotfix protocol', 'test isolation', 'flaky test triage', 'CI/CD reliability', 'root cause analysis'],
  },
  {
    id: 'mix-spec-01',
    type: 'Mixed',
    difficulty: 'Easy',
    category: 'Problem solving',
    role: ALL_ROLES,
    prompt:
      'You are handed a feature request with brief instructions and undefined error states. What steps do you take before writing code?',
    hint:
      'Discuss clarifying acceptance criteria, drafting mockups or user flows, interviewing stakeholders, and identifying edge cases early.',
    expectedConcepts: ['requirements gathering', 'edge case identification', 'user stories', 'cross-functional collaboration', 'proactive inquiry'],
    'expected concepts': ['requirements gathering', 'edge case identification', 'user stories', 'cross-functional collaboration', 'proactive inquiry'],
  },
  {
    id: 'mix-cost-01',
    type: 'Mixed',
    difficulty: 'Hard',
    category: 'System design',
    role: ['Backend Developer', 'Full Stack Developer', 'Software Engineer'],
    prompt:
      'Your monthly cloud infrastructure bill suddenly spikes by 250%. How do you identify the architectural cause, implement immediate and structural remedies, and communicate the incident to company executives?',
    hint:
      'Discuss cost allocation tags, slow query logs, egress bandwidth spikes, auto-scaling policy bugs, caching fixes, and presenting an actionable ROI breakdown.',
    expectedConcepts: ['cloud cost monitoring', 'query optimization', 'caching strategy', 'resource right-sizing', 'financial communication'],
    'expected concepts': ['cloud cost monitoring', 'query optimization', 'caching strategy', 'resource right-sizing', 'financial communication'],
  },
  {
    id: 'mix-test-01',
    type: 'Mixed',
    difficulty: 'Easy',
    category: 'Algorithms',
    role: ALL_ROLES,
    prompt:
      'Under tight delivery deadlines, how do you determine the optimal testing pyramid strategy (unit vs. integration vs. e2e) and articulate the value of automated testing to managers urging fast delivery?',
    hint:
      'Discuss the testing pyramid, speed of feedback, cost of bugs in production vs development, and focusing on high-risk business logic first.',
    expectedConcepts: ['testing pyramid', 'critical path coverage', 'regression prevention', 'cost of bugs', 'ROI of automated tests'],
    'expected concepts': ['testing pyramid', 'critical path coverage', 'regression prevention', 'cost of bugs', 'ROI of automated tests'],
  },
  {
    id: 'mix-api-01',
    type: 'Mixed',
    difficulty: 'Medium',
    category: 'System design',
    role: ['Backend Developer', 'Frontend Developer', 'Full Stack Developer', 'Software Engineer'],
    prompt:
      'When building an API consumed by both web and mobile applications, how do you handle schema changes and deprecations without breaking older client app versions in the wild?',
    hint:
      'Discuss semantic versioning, additive non-breaking changes, deprecation headers, contract testing, and clear client communication channels.',
    expectedConcepts: ['API versioning', 'semantic versioning', 'deprecation policy', 'clear documentation', 'contract testing'],
    'expected concepts': ['API versioning', 'semantic versioning', 'deprecation policy', 'clear documentation', 'contract testing'],
  },
  {
    id: 'mix-analytics-01',
    type: 'Mixed',
    difficulty: 'Medium',
    category: 'Data structures',
    role: ['Data Analyst', 'Python Developer', 'Backend Developer'],
    prompt:
      'Business leadership needs real-time KPI dashboards, but querying the raw operational database directly slows down user transactions. How do you architect an analytical pipeline and manage stakeholder expectations regarding data latency?',
    hint:
      'Discuss read replicas, ETL/ELT pipelines, pre-aggregated tables, event streams, and explaining the trade-off between real-time and near-real-time.',
    expectedConcepts: ['pre-aggregation', 'caching', 'materialized views', 'event streaming', 'latency vs freshness trade-off'],
    'expected concepts': ['pre-aggregation', 'caching', 'materialized views', 'event streaming', 'latency vs freshness trade-off'],
  },
  {
    id: 'mix-onboard-01',
    type: 'Mixed',
    difficulty: 'Easy',
    category: 'Communication',
    role: ALL_ROLES,
    prompt:
      'You notice that new engineering hires frequently take over a week to set up their local development environments due to outdated documentation. How do you take initiative to fix this technically and culturally?',
    hint:
      'Discuss containerizing dev environments with Docker/devcontainers, automating bootstrap scripts, updating wikis, and instituting a "first PR fixes docs" policy.',
    expectedConcepts: ['documentation as code', 'containerization / Docker', 'ownership', 'continuous onboarding feedback', 'team culture'],
    'expected concepts': ['documentation as code', 'containerization / Docker', 'ownership', 'continuous onboarding feedback', 'team culture'],
  },
]
