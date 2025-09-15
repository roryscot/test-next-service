-- PostgreSQL initialization script for Strella Interview System
-- This script sets up the database schema and initial data

-- Create the main database (already created by POSTGRES_DB)
-- \c strella_interview;

-- Create tables for the interview system
CREATE TABLE IF NOT EXISTS questionnaire_prompts (
    id SERIAL PRIMARY KEY,
    prompt TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default prompt
INSERT INTO questionnaire_prompts (prompt) 
VALUES ('You are a helpful AI interviewer. Ask thoughtful questions about the candidate''s experience, skills, and goals. Be professional, engaging, and encouraging.') 
ON CONFLICT DO NOTHING;

-- Create sessions table for tracking interview sessions
CREATE TABLE IF NOT EXISTS interview_sessions (
    id SERIAL PRIMARY KEY,
    room_name VARCHAR(255) NOT NULL,
    participant_identity VARCHAR(255) NOT NULL,
    agent_identity VARCHAR(255) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    status VARCHAR(50) DEFAULT 'active',
    metadata JSONB
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questionnaire_prompts_created_at ON questionnaire_prompts(created_at);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_room_name ON interview_sessions(room_name);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_status ON interview_sessions(status);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_started_at ON interview_sessions(started_at);

-- Grant permissions (if needed for additional users)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO strella;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO strella;
