# Absher Visa AI Agents

AI-powered multi-agent system for visa application assistance, built with LangGraph and FastAPI.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR AGENT                            │
│                     (LangGraph Workflow)                         │
│         Coordinates all agents, manages state & routing          │
└──────┬──────────────┬──────────────┬──────────────┬─────────────┘
       │              │              │              │
       ▼              ▼              ▼              ▼
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│ REQUIREMENTS│ │  DOCUMENT  │ │ VALIDATION │ │    PDF     │
│   SCRAPER   │ │  MATCHER   │ │   AGENT    │ │ GENERATOR  │
│             │ │            │ │            │ │            │
│ • Crawl4AI  │ │ • BGE-M3   │ │ • PaddleOCR│ │ • WeasyPrint│
│ • LLM Extract│ │ • Semantic │ │ • Rules    │ │ • Jinja2   │
└─────────────┘ └────────────┘ └────────────┘ └────────────┘
```

## Features

- **Multi-Agent Orchestration**: LangGraph-based workflow with conditional routing
- **Intelligent Scraping**: Crawl4AI with LLM extraction for embassy websites
- **Semantic Matching**: BGE-M3 multilingual embeddings for document matching
- **Document Validation**: PaddleOCR for Arabic text extraction and rule-based validation
- **PDF Generation**: WeasyPrint with full Arabic RTL support
- **Caching**: Redis + PostgreSQL with pgvector for embeddings

## Quick Start

### Prerequisites

- Python 3.11+
- Docker & Docker Compose (for supporting services)
- Node.js backend running on port 5000

### Installation

```bash
# Navigate to python-agents directory
cd python-agents

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -e .

# Copy environment file
cp .env.example .env
```

### Running Locally

```bash
# Start supporting services (PostgreSQL, Redis)
docker-compose up -d postgres redis

# Run the API server
uvicorn src.api.main:app --reload --port 8000
```

### Running with Docker

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/health/ready` | Readiness probe |
| POST | `/api/v1/workflow/start` | Start visa workflow |
| GET | `/api/v1/workflow/status/{id}` | Get workflow status |
| GET | `/api/v1/workflow/result/{id}` | Get final result |
| POST | `/api/v1/workflow/retry/{id}` | Retry failed workflow |
| POST | `/api/v1/documents/upload` | Upload document |
| POST | `/api/v1/documents/validate` | Validate document |
| GET | `/api/v1/documents/pdf/{id}/{type}` | Download PDF |

## Configuration

Key environment variables:

```bash
# LLM Provider (ollama, openai, anthropic)
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b

# For cloud LLMs
OPENAI_API_KEY=your-key
ANTHROPIC_API_KEY=your-key

# Database
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/absher_visa

# Cache
REDIS_URL=redis://localhost:6379/0

# Node.js Backend
NODE_BACKEND_URL=http://localhost:5000
```

## Project Structure

```
python-agents/
├── src/
│   ├── api/              # FastAPI application
│   │   ├── main.py       # App factory
│   │   ├── routes/       # API endpoints
│   │   └── schemas/      # Pydantic models
│   ├── agents/           # AI Agents
│   │   ├── orchestrator/ # LangGraph workflow
│   │   ├── scraper/      # Requirements scraper
│   │   ├── matcher/      # Document matcher
│   │   ├── validator/    # Document validator
│   │   └── pdf_generator/# PDF generator
│   ├── services/         # External services
│   ├── config/           # Configuration
│   └── utils/            # Utilities
├── tests/                # Test suite
├── docker-compose.yml    # Docker services
└── pyproject.toml        # Dependencies
```

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/test_agents.py -v
```

## Integration with Node.js Backend

The Python agents communicate with the existing Node.js backend:

1. **Node.js calls Python**: `POST /api/v1/workflow/start` after Step 2
2. **Python fetches data**: From Node.js endpoints (`/api/countries`, `/api/travelers`)
3. **Frontend polls status**: `GET /api/v1/workflow/status/{id}`
4. **PDF download**: Served by Python at `/api/v1/documents/pdf/{id}/{type}`

## License

MIT
