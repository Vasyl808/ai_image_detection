"""
Pytest configuration and shared fixtures.

This module contains pytest configuration and reusable fixtures
for testing the FastAPI application.
"""

import io
from pathlib import Path
from typing import Generator
from unittest.mock import Mock, MagicMock

import pytest
import torch
from fastapi.testclient import TestClient
from PIL import Image

from app.core.config import Settings
from app.models import DeepfakeDetector
from app.services import DetectionService, FileService, PDFReportService


@pytest.fixture
def mock_device() -> torch.device:
    """Provide a mock CPU device for testing."""
    return torch.device("cpu")


@pytest.fixture
def mock_model() -> Mock:
    """Provide a mock DeepfakeDetector model."""
    model = Mock(spec=DeepfakeDetector)
    model.eval.return_value = None
    # Mock model output (logit)
    model.return_value = torch.tensor([[0.8]])  # Simulates deepfake prediction
    return model


@pytest.fixture
def test_image() -> Image.Image:
    """Create a test PIL Image for testing."""
    # Create a simple 224x224 RGB image
    image = Image.new('RGB', (224, 224), color='red')
    return image


@pytest.fixture
def test_image_bytes(test_image: Image.Image) -> bytes:
    """Convert test image to bytes for upload testing."""
    img_byte_arr = io.BytesIO()
    test_image.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    return img_byte_arr.read()


@pytest.fixture
def test_settings(tmp_path: Path) -> Settings:
    """Create test settings with temporary directories."""
    settings = Settings()
    # Override paths for testing
    settings.RESULTS_DIR = tmp_path / "results"
    settings.RESULTS_DIR.mkdir(exist_ok=True)
    settings.MODEL_CHECKPOINT_PATH = None  # Don't load real model
    settings.DEBUG = True
    return settings


@pytest.fixture
def mock_detection_service(mock_model: Mock, mock_device: torch.device) -> DetectionService:
    """Provide a mock DetectionService for testing."""
    service = DetectionService(mock_model, mock_device)
    return service


@pytest.fixture
def mock_file_service() -> FileService:
    """Provide a FileService instance for testing."""
    return FileService()


@pytest.fixture
def mock_pdf_report_service() -> PDFReportService:
    """Provide a PDFReportService instance for testing."""
    return PDFReportService()


@pytest.fixture
def test_gradcam_path(tmp_path: Path, test_image: Image.Image) -> Path:
    """Create a test Grad-CAM image file."""
    gradcam_path = tmp_path / "results" / "gradcam_test.png"
    gradcam_path.parent.mkdir(exist_ok=True)
    test_image.save(gradcam_path)
    return gradcam_path


@pytest.fixture
def test_original_path(tmp_path: Path, test_image: Image.Image) -> Path:
    """Create a test original image file."""
    original_path = tmp_path / "results" / "original_test.png"
    original_path.parent.mkdir(exist_ok=True)
    test_image.save(original_path)
    return original_path


@pytest.fixture
def test_app() -> Generator[TestClient, None, None]:
    """
    Create a test FastAPI client.
    
    This fixture creates a minimal test app without loading the actual model.
    """
    from app.main import app as fastapi_app
    from app.api.deps import AppState
    
    # Create mock app state
    mock_state = AppState()
    mock_state.model = Mock(spec=DeepfakeDetector)
    mock_state.device = torch.device("cpu")
    mock_state.detection_service = Mock(spec=DetectionService)
    mock_state.file_service = FileService()
    mock_state.pdf_report_service = PDFReportService()
    
    # Attach to app
    fastapi_app.state.services = mock_state
    
    # Create client without keyword argument
    client = TestClient(fastapi_app)
    yield client
    
    # Cleanup
    if hasattr(fastapi_app.state, 'services'):
        delattr(fastapi_app.state, 'services')


@pytest.fixture
def mock_torch_tensor() -> torch.Tensor:
    """Provide a mock preprocessed image tensor."""
    # Shape: (1, 3, 224, 224) - batch, channels, height, width
    return torch.randn(1, 3, 224, 224)


@pytest.fixture
def mock_gradcam() -> Mock:
    """Provide a mock GradCAM instance."""
    from app.models import GradCAM
    
    gradcam = Mock(spec=GradCAM)
    # Mock CAM generation (returns a 224x224 heatmap)
    gradcam.generate_cam.return_value = torch.randn(224, 224).numpy()
    return gradcam
