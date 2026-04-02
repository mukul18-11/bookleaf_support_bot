# BookLeaf Publishing - Customer Query Bot

A multi-channel-ready customer query bot built with n8n, Supabase, and OpenAI that handles author queries automatically with workflow-aware automation.

## Architecture

![Architecture Flow](https://via.placeholder.com/800x400?text=Webhook+->+OpenAI+Classifier+->+Router+->+Supabase+->+OpenAI+Response+->+Webhook)

1. **Frontend**: A modern, responsive chat widget written in HTML/CSS/JS that sends queries via POST request to an n8n webhook.
2. **n8n Orchestration Engine**: Acts as the central logic processor, exposing a webhook, routing data, formatting prompts, executing logical steps, and responding to the frontend.
3. **OpenAI**: Used for Natural Language Understanding (NLU) to classify user intent and construct human-friendly responses.
4. **Supabase**: A PostgreSQL database acting as the system of record for author publishing timelines, royalty statuses, knowledge base articles, and chat history.

## Tech Stack
- **n8n** (Logic & Orchestration)
- **Supabase** / PostgreSQL (Database)
- **OpenAI GPT-4o** (AI Classification & Generation)
- **HTML / CSS / JS** (Web Chat UI)

## Setup Instructions

### 1. Database Setup (Supabase)
Create a new project in Supabase and execute the SQL scripts found in `BookLeaf_Customer_Query_Bot_Guide.txt` to create the `authors`, `query_logs`, and `knowledge_base` tables, and to populate them with mock data.

### 2. Workflow Setup (n8n)
Start a local n8n instance and follow the node-by-node setup instructions in `BookLeaf_Customer_Query_Bot_Guide.txt`. Make sure to add your OpenAI and Supabase credentials in n8n.

### 3. Frontend Setup
The frontend is completely static. Simply open `frontend/index.html` in your web browser. Ensure that your n8n workflow is active and listening on `http://localhost:5678/webhook/query`.

## How to Run

1. Make sure n8n is running (`npx n8n` or Docker).
2. Activate your workflow in n8n.
3. Open `frontend/index.html` in your browser.
4. Enter an email like `rahul.sharma@gmail.com` and start asking questions!
