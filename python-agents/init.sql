-- Initialize PostgreSQL database with pgvector extension
-- This script runs automatically when the container starts

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create tables for the application

-- Scraped requirements cache
CREATE TABLE IF NOT EXISTS scraped_requirements (
    id SERIAL PRIMARY KEY,
    country_id VARCHAR(10) NOT NULL,
    visa_type VARCHAR(50) NOT NULL,
    requirements JSONB NOT NULL,
    source_url TEXT,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(country_id, visa_type)
);

-- Document embeddings for semantic search
CREATE TABLE IF NOT EXISTS document_embeddings (
    id SERIAL PRIMARY KEY,
    document_id VARCHAR(100) NOT NULL,
    document_type VARCHAR(50),
    content_text TEXT,
    embedding vector(1024),  -- BGE-M3 dimension
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(document_id)
);

-- Requirement embeddings for matching
CREATE TABLE IF NOT EXISTS requirement_embeddings (
    id SERIAL PRIMARY KEY,
    requirement_id VARCHAR(100) NOT NULL,
    country_id VARCHAR(10) NOT NULL,
    description_text TEXT,
    embedding vector(1024),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(requirement_id)
);

-- Workflow jobs tracking
CREATE TABLE IF NOT EXISTS workflow_jobs (
    id SERIAL PRIMARY KEY,
    request_id VARCHAR(100) NOT NULL UNIQUE,
    country_id VARCHAR(10) NOT NULL,
    visa_type VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    current_step VARCHAR(50),
    state_json JSONB,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_scraped_requirements_country ON scraped_requirements(country_id, visa_type);
CREATE INDEX IF NOT EXISTS idx_scraped_requirements_expires ON scraped_requirements(expires_at);
CREATE INDEX IF NOT EXISTS idx_workflow_jobs_status ON workflow_jobs(status);
CREATE INDEX IF NOT EXISTS idx_workflow_jobs_request ON workflow_jobs(request_id);

-- Create vector similarity search indexes
CREATE INDEX IF NOT EXISTS idx_document_embeddings_vector ON document_embeddings
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_requirement_embeddings_vector ON requirement_embeddings
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_workflow_jobs_updated_at ON workflow_jobs;
CREATE TRIGGER update_workflow_jobs_updated_at
    BEFORE UPDATE ON workflow_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
