"""Unit tests for session cache module."""

import pytest
from datetime import datetime, timedelta
from pathlib import Path
from unittest.mock import Mock, patch, AsyncMock
import asyncio

from app.schemas import DetectionResponse, PredictionResult, GradCAMExplanation


class TestSessionCacheOperations:
    """Test cases for session cache CRUD operations."""
    
    def setup_method(self):
        """Clear cache before each test."""
        from app.core.session_cache import detection_cache
        detection_cache.clear()
    
    def teardown_method(self):
        """Clear cache after each test."""
        from app.core.session_cache import detection_cache
        detection_cache.clear()
    
    def _create_mock_result(self) -> DetectionResponse:
        """Helper to create a mock detection response."""
        return DetectionResponse(
            success=True,
            prediction=PredictionResult(label="Real", is_deepfake=False),
            explanation=GradCAMExplanation(
                gradcam_image="/results/test.png",
                description="Test"
            )
        )
    
    def test_add_session(self, tmp_path):
        """Test adding a session to cache."""
        from app.core.session_cache import add_session, detection_cache
        
        session_id = "test-123"
        original_path = tmp_path / "original.png"
        gradcam_path = tmp_path / "gradcam.png"
        result = self._create_mock_result()
        
        add_session(session_id, original_path, gradcam_path, result)
        
        assert session_id in detection_cache
        stored = detection_cache[session_id]
        assert stored[0] == original_path
        assert stored[1] == gradcam_path
        assert stored[2] == result
    
    def test_get_session_exists(self, tmp_path):
        """Test getting an existing session."""
        from app.core.session_cache import add_session, get_session
        
        session_id = "test-get-123"
        original_path = tmp_path / "original.png"
        gradcam_path = tmp_path / "gradcam.png"
        result = self._create_mock_result()
        
        add_session(session_id, original_path, gradcam_path, result)
        
        retrieved = get_session(session_id)
        
        assert retrieved is not None
        assert retrieved[0] == original_path
        assert retrieved[1] == gradcam_path
        assert retrieved[2] == result
    
    def test_get_session_not_exists(self):
        """Test getting a non-existent session returns None."""
        from app.core.session_cache import get_session
        
        result = get_session("nonexistent-session")
        assert result is None
    
    def test_remove_session_exists(self, tmp_path):
        """Test removing an existing session."""
        from app.core.session_cache import add_session, remove_session, detection_cache
        
        session_id = "test-remove-123"
        add_session(session_id, tmp_path / "o.png", tmp_path / "g.png", self._create_mock_result())
        
        result = remove_session(session_id)
        
        assert result is True
        assert session_id not in detection_cache
    
    def test_remove_session_not_exists(self):
        """Test removing a non-existent session returns False."""
        from app.core.session_cache import remove_session
        
        result = remove_session("nonexistent-session")
        assert result is False


class TestCacheCleanup:
    """Test cases for cache cleanup functionality."""
    
    def setup_method(self):
        """Clear cache before each test."""
        from app.core.session_cache import detection_cache
        detection_cache.clear()
    
    def teardown_method(self):
        """Clear cache after each test."""
        from app.core.session_cache import detection_cache
        detection_cache.clear()
    
    def _create_mock_result(self) -> DetectionResponse:
        """Helper to create a mock detection response."""
        return DetectionResponse(
            success=True,
            prediction=PredictionResult(label="Real", is_deepfake=False),
            explanation=GradCAMExplanation(
                gradcam_image="/results/test.png",
                description="Test"
            )
        )
    
    def test_cleanup_old_sessions(self, tmp_path):
        """Test cleanup removes sessions older than max age."""
        from app.core.session_cache import detection_cache, cleanup_old_sessions
        
        # Add an old session (manually set old timestamp)
        old_timestamp = datetime.now() - timedelta(minutes=120)
        detection_cache["old-session"] = (
            tmp_path / "o.png",
            tmp_path / "g.png",
            self._create_mock_result(),
            old_timestamp
        )
        
        # Add a recent session
        detection_cache["new-session"] = (
            tmp_path / "o2.png",
            tmp_path / "g2.png",
            self._create_mock_result(),
            datetime.now()
        )
        
        removed = cleanup_old_sessions()
        
        assert removed == 1
        assert "old-session" not in detection_cache
        assert "new-session" in detection_cache
    
    def test_cleanup_no_old_sessions(self, tmp_path):
        """Test cleanup returns 0 when no old sessions exist."""
        from app.core.session_cache import detection_cache, cleanup_old_sessions
        
        # Add only recent sessions
        detection_cache["recent"] = (
            tmp_path / "o.png",
            tmp_path / "g.png",
            self._create_mock_result(),
            datetime.now()
        )
        
        removed = cleanup_old_sessions()
        assert removed == 0
    
    def test_cleanup_respects_max_cache_size(self, tmp_path):
        """Test cleanup removes oldest when cache exceeds max size."""
        from app.core import session_cache as sc_module
        
        # Temporarily set a small max cache size
        original_max = sc_module.MAX_CACHE_SIZE
        sc_module.MAX_CACHE_SIZE = 2
        
        try:
            # Add 3 sessions
            for i in range(3):
                sc_module.detection_cache[f"session-{i}"] = (
                    tmp_path / f"o{i}.png",
                    tmp_path / f"g{i}.png",
                    self._create_mock_result(),
                    datetime.now() + timedelta(seconds=i)  # Different timestamps
                )
            
            removed = sc_module.cleanup_old_sessions()
            
            # Should have removed 1 to get back to max size
            assert removed >= 1
            assert len(sc_module.detection_cache) <= 2
        finally:
            sc_module.MAX_CACHE_SIZE = original_max


class TestCacheStats:
    """Test cases for cache statistics."""
    
    def setup_method(self):
        """Clear cache before each test."""
        from app.core.session_cache import detection_cache
        detection_cache.clear()
    
    def teardown_method(self):
        """Clear cache after each test."""
        from app.core.session_cache import detection_cache
        detection_cache.clear()
    
    def _create_mock_result(self) -> DetectionResponse:
        """Helper to create a mock detection response."""
        return DetectionResponse(
            success=True,
            prediction=PredictionResult(label="Real", is_deepfake=False),
            explanation=GradCAMExplanation(
                gradcam_image="/results/test.png",
                description="Test"
            )
        )
    
    def test_get_cache_stats_empty(self):
        """Test stats for empty cache."""
        from app.core.session_cache import get_cache_stats
        
        stats = get_cache_stats()
        
        assert stats["total_sessions"] == 0
        assert stats["active_sessions"] == 0
        assert stats["old_sessions"] == 0
    
    def test_get_cache_stats_with_sessions(self, tmp_path):
        """Test stats with mixed sessions."""
        from app.core.session_cache import detection_cache, get_cache_stats
        from app.core import session_cache as sc_module
        
        # Add an active session
        detection_cache["active"] = (
            tmp_path / "o.png",
            tmp_path / "g.png",
            self._create_mock_result(),
            datetime.now()
        )
        
        # Add an old session
        old_time = datetime.now() - timedelta(minutes=sc_module.MAX_SESSION_AGE_MINUTES + 10)
        detection_cache["old"] = (
            tmp_path / "o2.png",
            tmp_path / "g2.png",
            self._create_mock_result(),
            old_time
        )
        
        stats = get_cache_stats()
        
        assert stats["total_sessions"] == 2
        assert stats["active_sessions"] == 1
        assert stats["old_sessions"] == 1


class TestCacheCleanupTask:
    """Test cases for background cleanup task."""
    
    @pytest.mark.asyncio
    async def test_start_cache_cleanup_task(self):
        """Test starting the cleanup task."""
        from app.core import session_cache as sc_module
        
        # Store original task
        original_task = sc_module._cleanup_task
        sc_module._cleanup_task = None
        
        try:
            sc_module.start_cache_cleanup_task()
            
            assert sc_module._cleanup_task is not None
            assert not sc_module._cleanup_task.done()
            
            # Cancel the task for cleanup
            sc_module._cleanup_task.cancel()
            try:
                await sc_module._cleanup_task
            except asyncio.CancelledError:
                pass
        finally:
            sc_module._cleanup_task = original_task
    
    @pytest.mark.asyncio
    async def test_stop_cache_cleanup_task(self):
        """Test stopping the cleanup task."""
        from app.core import session_cache as sc_module
        
        # Store original task
        original_task = sc_module._cleanup_task
        sc_module._cleanup_task = None
        sc_module.start_cache_cleanup_task()
        
        try:
            task_ref = sc_module._cleanup_task
            sc_module.stop_cache_cleanup_task()
            
            # Give the task time to cancel
            await asyncio.sleep(0.1)
            
            # Task should be cancelled (or about to be)
            assert task_ref.cancelled() or task_ref.done() or task_ref.cancelling()
        finally:
            if sc_module._cleanup_task and not sc_module._cleanup_task.done():
                sc_module._cleanup_task.cancel()
                try:
                    await sc_module._cleanup_task
                except asyncio.CancelledError:
                    pass
            sc_module._cleanup_task = original_task
    
    def test_stop_cleanup_task_when_none(self):
        """Test stopping when no task exists."""
        from app.core import session_cache as sc_module
        
        original_task = sc_module._cleanup_task
        sc_module._cleanup_task = None
        
        try:
            # Should not raise
            sc_module.stop_cache_cleanup_task()
        finally:
            sc_module._cleanup_task = original_task
