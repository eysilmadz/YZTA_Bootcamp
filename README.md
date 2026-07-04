# AI-Hire Coach

## What is the Project?
We analyze the PDF CV uploaded by the user using local NLP processes to extract their skills (tech stack, years of experience, etc.). Then, through AI agents configured with LangChain/CrewAI, we conduct a personalized, interactive technical interview simulation based on this information. At the end of the interview, the Evaluation Agent scores the candidate and provides a report outlining their deficiencies and development suggestions.

---

## 👥 Team Members

| | Name | Title | Socials |
| :---: | :--- | :--- | :---: |
| <img src="https://github.com/esmayildiz.png" width="80" height="80" style="border-radius:50%"> | **Esma Yıldız** | Scrum Master | [![GitHub](https://img.shields.io/badge/-GitHub-181717?style=flat&logo=github&logoColor=white)](https://github.com/eysilmadz) [![LinkedIn](https://img.shields.io/badge/-LinkedIn-0077B5?style=flat&logo=linkedin&logoColor=white)](https://linkedin.com/in/eysilmadz) |
| <img src="https://github.com/user2.png" width="80" height="80" style="border-radius:50%"> | **Nur Sima Akgül** | Product Owner | [![GitHub](https://img.shields.io/badge/-GitHub-181717?style=flat&logo=github&logoColor=white)](https://github.com/akgulnursima0349) [![LinkedIn](https://img.shields.io/badge/-LinkedIn-0077B5?style=flat&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/nur-sima-akg%C3%BCl/) |
| <img src="https://github.com/user3.png" width="80" height="80" style="border-radius:50%"> | **Esra Bayrakcı** | Developer | [![GitHub](https://img.shields.io/badge/-GitHub-181717?style=flat&logo=github&logoColor=white)](https://github.com/Esrabayrakci) [![LinkedIn](https://img.shields.io/badge/-LinkedIn-0077B5?style=flat&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/esra-bayrakc%C4%B1-914837306/) |

---

<h1 align="center">SPRINTS</h1>

<details>
<summary><b>Sprint 1</b></summary>
<br>

### 📌 Sprint Goals
Our primary goal in this sprint is to define the architectural outline of the project, finalize technology selections, and set up the development environments (individual local installations and the shared repository).

### 📋 Sprint Tasks & Status Table

| Field of Work | Task | Assignee | Status |
| :--- | :--- | :--- | :--- |
| **Project Management** | Finalizing technology selections, setting up the Repo and Scrum Board | Esma Yıldız | 🔄 In Progress |
| **CV Analysis & NLP** | Selecting a library for PDF text extraction (pdfplumber/PyMuPDF) and initial trials | Esra Bayrakcı | 🔄 In Progress |
| **Multi-Agent** | Designing agent roles on paper and creating a basic architectural drawing | Esra Bayrakcı | 🔄 In Progress |
| **Backend API** | Setting up the boilerplate structure of the FastAPI project, folder layout, and `.env` configuration | Esra Bayrakcı | 🔄 In Progress |
| **Database & Memory** | Table schema design (User, Session, Message, Report) and DB selection | Nur Sima Akgül | 🔄 In Progress |
| **Frontend** | Preparing a quick wireframe/Figma draft | Esma Yıldız | 🔄 In Progress |
| **DevOps** | Researching free hosting options (Render, Railway, HF) | Esma Yıldız | 🔄 In Progress |

<details>
<summary>📸 Sprint 1 - App Screenshots</summary>
<br>
<i>No screenshots added yet (In design phase).</i>
</details>

<details>
<summary>📸 Sprint 1 - Sprint Board Update Screenshots</summary>
<br>

#### Product Management Board (Trello / GitHub Projects)
![Scrum Board Screenshot](https://via.placeholder.com/800x400.png?text=Upload+Your+Trello+Screenshot+Here)
</details>

### 📝 Sprint Notes:
* It has been decided to use `Trello` for project management.
* It has been agreed to use `Figma` for UI designs and wireframes.
* `FastAPI` has been deemed appropriate for the backend architecture and will be deployed using `Render`.
* It has been decided to test `pdfplumber` or `PyMuPDF` libraries for PDF text extraction in NLP processes.
* `Render` and `Hugging Face Spaces` platforms have been prioritized as free hosting solutions.
* User interfaces will be developed using `React.js` as the frontend technology and deployed with `Vercel`.
* It has been decided to use `Redux Toolkit` on the React side to manage data such as interview history, user information, and agent responses efficiently without complexity.

</details>

<!--
<details>
<summary><b>Sprint 2</b></summary>
<br>
<i>Bu sprint henüz başlamadı.</i>
</details>

<details>
<summary><b>🔒 Sprint 3</b></summary>
<br>
<i>Bu sprint henüz başlamadı.</i>
</details>

<details>
<summary><b>🔒 Sprint 4</b></summary>
<br>
<i>Bu sprint henüz başlamadı.</i>
</details>

<details>
<summary><b>🔒 Sprint 5</b></summary>
<br>
<i>Bu sprint henüz başlamadı.</i>
</details>

<details>
<summary><b>🔒 Sprint 6</b></summary>
<br>
<i>Bu sprint henüz başlamadı.</i>
</details>

->
