<p align="center">
  <img src="Domino_logo.png" alt="Domino logo" width="250">
</p>

# Domino 🁣

**Blast Radius & Critical Path Visualizer for Jira**
*A submission for Atlassian Codegeist 2026.*

Domino transforms the flat, standard "Linked Issues" list in Jira into an interactive, multi-level dependency graph. It allows engineering and IT teams to instantly visualize the true blast radius of an incident, track cascading failures, and identify the critical path to resolution across both Jira tickets and Confluence documentation.

## 🚀 Key Features

* **Visual Blast Radius:** Maps complex, multi-tiered issue relationships (Blocks, Relates To, Clones) using an interactive React Flow graph.
* **Critical Path Calculation:** Uses a custom Depth-First Search (DFS) algorithm to calculate and highlight the absolute longest blocking path (the "Critical Path") to prioritize triage.
* **Cross-Platform Context:** Automatically fetches and renders connected Confluence documentation (e.g., strategy docs, database schemas) directly within the incident graph.
* **Jira UI Integration:** Embeds seamlessly as a Forge panel inside the Jira Issue view.

## 🏗️ Architecture & Tech Stack

Domino is built as a monorepo containing a decoupled frontend and backend:

* **Frontend (Atlassian Forge / React):**
  * Uses the Atlassian Forge UI Kit and Custom UI (`@forge/api`, `@forge/resolver`).
  * Renders the interactive node graph using `reactflow`.
  * Handles Jira/Confluence REST API authentication and data fetching.
* **Backend (Python / FastAPI):**
  * Hosted continuously on Render.
  * Built with Python 3.11, FastAPI, and Pydantic.
  * Receives the normalized graph payload from Forge and computes the critical path via DFS adjacency lists.

## 📂 Repository Structure

```text
domino-codegeist-2026/
├── Domino/                 # Atlassian Forge Frontend
│   ├── src/                # React components and Forge resolver functions
│   ├── manifest.yml        # Forge app permissions and remote URL configurations
│   └── package.json        # Node.js dependencies
├── domino-mcp/             # Python FastAPI Backend
│   ├── main.py             # FastAPI server and graph calculation logic
│   └── requirements.txt    # Python dependencies (fastapi, uvicorn, pydantic)
└── .gitignore              # Monorepo git ignore rules
```

## 🛠️ Local Development & Setup

### Prerequisites

* Node.js & npm
* Python 3.11+
* Atlassian Forge CLI (`npm install -g @forge/cli`)
* An Atlassian developer site

### 1. Backend Setup

Navigate to the backend directory, set up your virtual environment, and run the FastAPI server:

```bash
cd domino-mcp
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup

Navigate to the Forge directory, install dependencies, and start the development tunnel:

```bash
cd Domino
npm install
```

> **Note:** Ensure the `remotes` URL in your `manifest.yml` points to your active backend (either a local ngrok tunnel or your deployed Render URL) before deploying.

```bash
forge register
forge deploy
forge install
```

## 📖 How to Use

1. Open any Jira issue containing linked tickets or Confluence pages.
2. Click the **Domino** icon in the issue action menu or sidebar to open the Forge panel.
3. The app will recursively fetch all dependencies and send them to the FastAPI backend.
4. The panel will render the dependency tree:
   * **Red outlined nodes** indicate the root issue.
   * **Blue nodes** indicate Confluence docs.
   * **Critical Path** metrics are displayed alongside the graph.

## 👨‍💻 Author

**Raghudip Ghosh**
Independent Developer | Codegeist 2026 Participant
