[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/nRcUn8vA)

# AI-Powered Personalized Itinerary Generation Web Application

[![PNU CSE](https://img.shields.io/badge/Pusan%20National%20Univ-CSE-blue)](https://cse.pusan.ac.kr/cse/index.do)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react)](https://reactjs.org/)
[![Django](https://img.shields.io/badge/Django-5.0.2-092E20?logo=django)](https://www.djangoproject.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688?logo=fastapi)](https://fastapi.tiangolo.com/)

An intelligent travel planning assistant that generates personalized, adaptive, and logistically sound itineraries based on natural language queries. This project moves beyond generic "Top 10" lists to create truly unique travel experiences.

---

## 📖 Background (프로젝트 배경)

### Market Situation & Problem Statement

Traditional travel planning is often a frustrating and inefficient process. Existing platforms like TripAdvisor or Expedia typically provide static, one-size-fits-all recommendations that fail to consider a user's unique preferences, real-time conditions like weather, or logistical coherence. This leads to common problems:

* [cite_start]**Information Overload**: Users must manually sift through hundreds of generic reviews to find places that match a specific vibe (e.g., a "quiet, cozy cafe").
* [cite_start]**Manual Curation Burden**: Users are responsible for the difficult initial discovery phase of finding a set of activities that are not only interesting but also located conveniently near each other.
* **Lack of Context**: Recommendations are often static and unaware of dynamic factors. [cite_start]A platform might suggest an outdoor park during a rainstorm or fail to mention a limited-time local festival.

### Necessity & Expected Impact

[cite_start]This project was born from the need to solve these issues by creating a truly personalized, adaptive, and intelligent travel planning assistant.[cite_start]The expected impact is a revolutionary travel planning experience where users can receive a practical, enjoyable, and customized itinerary in seconds, eliminating hours of manual research and preventing common travel frustrations like inefficient travel between locations.[cite_start]Our system promotes a more immersive and eco-friendly way to travel by creating walkable daily plans.

---

## 🚀 Goals (개발 목표)

### Overall Objective & Features

[cite_start]The primary goal was to create a holistic, end-to-end travel planning ecosystem. This was broken down into two main components:

1.  [cite_start]**A Comprehensive User Application**: A secure and responsive web app built with React, featuring a full authentication system, user profiles, and the ability to create and share personal travel journals and reviews.
2.  **An AI Recommendation & Itinerary Service**: A powerful backend service that can:
    * [cite_start]Achieve a deep semantic understanding of a user's free-text travel queries. 
    * [cite_start]Generate dynamic recommendations ranked by semantic similarity, weather, operating hours, and proximity.
    * [cite_start]Automatically assemble recommendations into coherent, walkable daily schedules by clustering activities.
    * [cite_start]Satisfy non-negotiable user requests (e.g., "I must visit this museum") using constraint optimization.

### Differentiation vs. Similar Services

| Platform | Common Limitation | Our Solution |
| :--- | :--- | :--- |
| **TripAdvisor** | [cite_start]Recommendations are based on broad popularity, not personal context.| [cite_start]**Deep Semantic Understanding:** Our AI understands the nuance behind queries like "quiet and cozy," matching it to rich, AI-generated location descriptions. |
| **Wanderlog** | [cite_start]The initial discovery and logistical clustering of places is left to the user.| [cite_start]**Automated Discovery & Clustering:** Our system proactively discovers the best cluster of relevant places in a single neighborhood, creating an optimal itinerary from scratch. |
| **Expedia** | [cite_start]"Things to Do" sections are static and context-unaware (e.g., suggesting a park in the rain). | [cite_start]**Dynamic & Time-Sensitive:** Our system integrates live weather data to provide warnings and recommends timely events like festivals or concerts.|

---

## 🏗️ System Design (시스템 설계)

### Architecture Diagram

Our system is split into two main phases: an **Offline Preparation Phase** for data processing and a **Real-time Online Recommendation Phase** to handle user requests.

**1. Offline Data Processing & Indexing**

This phase transforms raw location data into a highly optimized format for semantic search.
1.  [cite_start]**Data Enrichment**: Raw location data is enriched using the Kakao Maps API (for coordinates) and Google Gemini API (for generating rich, descriptive paragraphs). [cite: 133, 135, 179]
2.  [cite_start]**Embedding Generation**: The AI-generated descriptions are converted into 384-dimension numerical vectors (embeddings) using Sentence Transformers. [cite: 150, 153]
3.  **Vector Indexing**: The embeddings are indexed using Facebook AI Similarity Search (FAISS) for near-instantaneous search. [cite_start]We use an `IndexFlatIP` optimized for cosine similarity. [cite: 158, 172, 175]

**2. Online Real-Time Recommendation Engine**

This is the live FastAPI microservice that generates itineraries.
1.  [cite_start]**Query Deconstruction**: A complex user query is broken down into semantic chunks (e.g., "luxurious italian restaurant," "jazz club"). [cite: 209]
2.  [cite_start]**Candidate Retrieval**: FAISS retrieves the top-k most semantically similar locations for each sub-query. [cite: 216]
3.  **Multi-Factor Reranking**: Candidates are scored and filtered based on geographic cohesion to ensure a walkable itinerary. [cite_start]A final score is calculated based on semantic similarity, distance, and operating hours. [cite: 223, 227]
4.  **Itinerary Optimization**: A hybrid planner assembles the final schedule. [cite_start]A Beam Search heuristic is used by default, while Google OR-Tools (CP-SAT solver) is activated to satisfy "must-have" requests. [cite: 236, 245]
5.  **Finalization & Delivery**: The itinerary is checked against weather data. [cite_start]The structured plan is sent immediately to the user via WebSocket, followed by an AI-generated summary paragraph from the Gemma 3 API. [cite: 261, 264, 265, 269]

### Technologies Used

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React, Vite, Tailwind CSS, Material UI | [cite_start]Building a responsive, modern, and intuitive single-page application (SPA). [cite: 311, 313, 314] |
| **Backend** | Django, Django Rest Framework | [cite_start]Core application logic, user authentication (JWT), database management, and REST APIs for journals/reviews. [cite: 77, 78] |
| **AI Service** | FastAPI | [cite_start]High-performance, asynchronous microservice for handling AI-intensive recommendation tasks. [cite: 207] |
| **Database** | PostgreSQL | [cite_start]Relational database for storing user data, locations, trips, and journals. [cite: 80] |
| **AI & ML** | Sentence Transformers, FAISS, Google OR-Tools | [cite_start]Semantic search, high-speed vector indexing, and constraint satisfaction for itinerary optimization. [cite: 148, 158, 233] |
| **LLMs / APIs**| Google Gemini, OpenAI Gemma 3, OpenWeatherMap | [cite_start]AI-powered data enrichment, itinerary summarization, and real-time weather data. [cite: 133, 259] |

---

## ✨ Results (개발 결과)

### Overall System Flow

The final platform provides a seamless user experience. [cite_start]A guest user can visit the landing page and immediately generate an itinerary by providing a natural language query. [cite: 319] [cite_start]Registered users gain access to a full dashboard where they can manage their profiles, create detailed travel journals with photo uploads, and write reviews. [cite: 320, 326] [cite_start]The system successfully generates high-quality, relevant, and logistically sound itineraries with an average latency of ~5-10 seconds. [cite: 367, 373]

### Mentor Feedback & Applied Changes

Mentor feedback was critical in shaping the project's final architecture. The initial plan to use a traditional ML model trained on synthetic data was identified as a major risk.

> [cite_start]**Key Feedback**: "Concerns about the risks and lack of mitigation strategies for using synthetic data." [cite: 381]

[cite_start]**Our Response**: We executed a major pivot, re-architecting the entire system around a state-of-the-art **semantic search engine**. [cite: 351] [cite_start]This eliminated the need for risky synthetic data and resulted in a more powerful, modern, and scalable system. [cite: 354] [cite_start]Other changes included implementing Google OR-Tools for robust optimization and adopting a "walkable-first" philosophy to promote eco-friendly travel. [cite: 387, 388]

### Directory Structure