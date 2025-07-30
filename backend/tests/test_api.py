import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
import json

class TestAgentsAPI:
    """Test suite per API degli agenti"""
    
    def test_profile_analysis_endpoint(
        self, 
        client: TestClient, 
        auth_headers, 
        sample_profile_data,
        mock_orchestrator
    ):
        """Test endpoint di analisi profilo"""
        
        # Mock orchestrator response
        mock_response = AsyncMock()
        mock_response.status.value = "completed"
        mock_response.agent_name = "profiling_agent"
        mock_response.result = {
            "profile_updated": True,
            "analysis_summary": {"skills_identified": 3},
            "recommendations": {"starting_level": "intermediate"}
        }
        mock_response.error = None
        
        with patch('app.api.v1.agents.get_orchestrator', return_value=mock_orchestrator):
            mock_orchestrator.route_message.return_value = mock_response
            
            response = client.post(
                "/api/v1/agents/profile/analyze",
                headers=auth_headers,
                json=sample_profile_data
            )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["agent_name"] == "profiling_agent"
        assert "execution_time" in data
        assert "request_id" in data
    
    def test_learning_path_generation_endpoint(
        self,
        client: TestClient,
        auth_headers,
        sample_learning_path_request,
        mock_orchestrator
    ):
        """Test endpoint generazione percorso"""
        
        mock_response = AsyncMock()
        mock_response.status.value = "completed"
        mock_response.agent_name = "learning_path_agent"
        mock_response.result = {
            "path_generated": True,
            "path_id": "test-path-id",
            "path_data": {"modules": [{"title": "Module 1"}]}
        }
        mock_response.error = None
        
        with patch('app.api.v1.agents.get_orchestrator', return_value=mock_orchestrator):
            mock_orchestrator.route_message.return_value = mock_response
            
            response = client.post(
                "/api/v1/agents/learning-path/generate",
                headers=auth_headers,
                json=sample_learning_path_request
            )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["result"]["path_generated"] is True
    
    def test_unauthorized_access(self, client: TestClient, sample_profile_data):
        """Test accesso non autorizzato"""
        response = client.post(
            "/api/v1/agents/profile/analyze",
            json=sample_profile_data
        )
        
        assert response.status_code == 403
    
    def test_workflow_execution_endpoint(
        self,
        client: TestClient,
        auth_headers,
        sample_profile_data,
        mock_orchestrator
    ):
        """Test endpoint esecuzione workflow"""
        
        # Mock workflow responses
        mock_responses = [
            AsyncMock(
                agent_name="profiling_agent",
                status=AsyncMock(value="completed"),
                result={"profile_updated": True},
                error=None
            ),
            AsyncMock(
                agent_name="learning_path_agent", 
                status=AsyncMock(value="completed"),
                result={"path_generated": True},
                error=None
            )
        ]
        
        with patch('app.api.v1.agents.get_orchestrator', return_value=mock_orchestrator):
            mock_orchestrator.execute_workflow.return_value = mock_responses
            
            response = client.post(
                "/api/v1/agents/workflow/new-user-onboarding",
                headers=auth_headers,
                json={
                    **sample_profile_data,
                    "learning_goal": "Learn Python"
                }
            )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["total_steps"] == 2
        assert data["successful_steps"] == 2

class TestSystemEndpoints:
    """Test per endpoint di sistema"""
    
    def test_health_check(self, client: TestClient):
        """Test health check endpoint"""
        with patch('app.main.get_db') as mock_db, \
             patch.object(client.app.state, 'redis_client') as mock_redis, \
             patch.object(client.app.state, 'orchestrator') as mock_orchestrator:
            
            # Mock dependencies
            mock_db_session = mock_db.return_value.__next__.return_value
            mock_db_session.execute.return_value = None
            mock_redis.ping.return_value = True
            mock_orchestrator.get_system_status.return_value = {"agents": {}}
            
            response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "services" in data
    
    def test_system_status_endpoint(
        self,
        client: TestClient,
        auth_headers,
        mock_orchestrator
    ):
        """Test system status endpoint"""
        
        mock_status = {
            "orchestrator": {"name": "master_orchestrator"},
            "agents": {"profiling_agent": {"status": "healthy"}}
        }
        
        with patch('app.api.v1.agents.get_orchestrator', return_value=mock_orchestrator):
            mock_orchestrator.get_system_status.return_value = mock_status
            
            response = client.get(
                "/api/v1/agents/system/status",
                headers=auth_headers
            )
        
        assert response.status_code == 200
        data = response.json()
        assert "system_status" in data
        assert data["system_status"]["orchestrator"]["name"] == "master_orchestrator"
