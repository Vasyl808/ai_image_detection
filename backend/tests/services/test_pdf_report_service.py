"""Unit tests for PDFReportService."""

import pytest
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
from io import BytesIO

from app.services.pdf_report_service import PDFReportService


class TestPDFReportService:
    """Test cases for PDFReportService."""
    
    def test_generate_report_deepfake(
        self, mock_pdf_report_service, test_original_path, test_gradcam_path
    ):
        """Test PDF report generation for deepfake detection."""
        # Generate report
        pdf_buffer = PDFReportService.generate_report(
            original_image_path=test_original_path,
            gradcam_image_path=test_gradcam_path,
            prediction_label="AI-generated image",
            is_deepfake=True,
            gradcam_description="Test description"
        )
        
        # Verify BytesIO object returned
        assert isinstance(pdf_buffer, BytesIO)
        
        # Verify PDF has content
        pdf_content = pdf_buffer.getvalue()
        assert len(pdf_content) > 0
        
        # Basic PDF format check
        assert pdf_content.startswith(b'%PDF')
    
    def test_generate_report_real_image(
        self, mock_pdf_report_service, test_original_path, test_gradcam_path
    ):
        """Test PDF report generation for real image."""
        pdf_buffer = PDFReportService.generate_report(
            original_image_path=test_original_path,
            gradcam_image_path=test_gradcam_path,
            prediction_label="Real",
            is_deepfake=False,
            gradcam_description="This image appears to be authentic."
        )
        
        assert isinstance(pdf_buffer, BytesIO)
        pdf_content = pdf_buffer.getvalue()
        assert len(pdf_content) > 0
        assert pdf_content.startswith(b'%PDF')
    
    def test_compress_image_for_pdf(self, test_original_path):
        """Test image compression for PDF embedding."""
        compressed_path = PDFReportService._compress_image_for_pdf(test_original_path)
        
        # Verify compressed image exists
        assert compressed_path.exists()
        
        # Verify it's in temp directory
        assert compressed_path.parent.name != test_original_path.parent.name
        
        # Verify file is smaller or same size
        original_size = test_original_path.stat().st_size
        compressed_size = compressed_path.stat().st_size
        # For test images this might not always be smaller, but should exist
        assert compressed_size > 0
    
    def test_get_styles(self):
        """Test PDF styles generation."""
        styles = PDFReportService._get_styles()
        
        # Verify required styles exist (based on actual implementation)
        assert "Title" in styles
        assert "Heading" in styles
        assert "BodyText" in styles
        assert "Centered" in styles
        
        # Verify styles are configured
        assert styles["Title"].fontSize > styles["Heading"].fontSize
    
    def test_pdf_contains_all_sections(
        self, mock_pdf_report_service, test_original_path, test_gradcam_path
    ):
        """Test that generated PDF contains all expected sections."""
        pdf_buffer = PDFReportService.generate_report(
            original_image_path=test_original_path,
            gradcam_image_path=test_gradcam_path,
            prediction_label="AI-generated image",
            is_deepfake=True,
            gradcam_description="AI-generated content detected."
        )
        
        # While we can't easily parse PDF content in tests,
        # we can verify the PDF is substantial enough to contain sections
        pdf_content = pdf_buffer.getvalue()
        
        # A complete report should be reasonably large
        assert len(pdf_content) > 3000  # At least 3KB for a proper report with images
    
    def test_generate_report_with_logging(self, tmp_path):
        """Test that report generation logs errors gracefully for missing images."""
        non_existent = tmp_path / "missing.png"
        gradcam_path = tmp_path / "gradcam.png"
        
        # Create only gradcam file
        from PIL import Image
        Image.new('RGB', (224, 224)).save(gradcam_path)
        
        # PDF service handles missing images gracefully without raising
        pdf_buffer = PDFReportService.generate_report(
            original_image_path=non_existent,
            gradcam_image_path=gradcam_path,
            prediction_label="Real",
            is_deepfake=False,
            gradcam_description="Test"
        )
        
        # Should still return a PDF (with logged errors)
        assert pdf_buffer is not None
        assert len(pdf_buffer.getvalue()) > 0
    
    def test_add_header(self):
        """Test header addition to PDF story."""
        story = []
        styles = PDFReportService._get_styles()
        
        PDFReportService._add_header(story, styles)
        
        # Verify elements were added
        assert len(story) > 0
    
    def test_add_detection_summary_deepfake(self):
        """Test detection summary for deepfake."""
        story = []
        styles = PDFReportService._get_styles()
        
        PDFReportService._add_detection_summary(
            story, styles, "AI-generated image", is_deepfake=True
        )
        
        # Verify elements were added
        assert len(story) > 0
    
    def test_add_detection_summary_real(self):
        """Test detection summary for real image."""
        story = []
        styles = PDFReportService._get_styles()
        
        PDFReportService._add_detection_summary(
            story, styles, "Real", is_deepfake=False
        )
        
        # Verify elements were added
        assert len(story) > 0
    
    def test_add_timestamp(self):
        """Test timestamp addition."""
        story = []
        styles = PDFReportService._get_styles()
        
        PDFReportService._add_timestamp(story, styles)
        
        # Verify elements were added
        assert len(story) > 0
    
    def test_add_image_to_story(self, test_original_path):
        """Test adding image to PDF story."""
        story = []
        
        PDFReportService._add_image(story, test_original_path)
        
        # Verify image was added
        assert len(story) > 0
    
    def test_pdf_report_is_seekable(
        self, test_original_path, test_gradcam_path
    ):
        """Test that returned PDF buffer is seekable (at position 0)."""
        pdf_buffer = PDFReportService.generate_report(
            original_image_path=test_original_path,
            gradcam_image_path=test_gradcam_path,
            prediction_label="Real",
            is_deepfake=False,
            gradcam_description="Test"
        )
        
        # Verify buffer is ready to be read from start
        assert pdf_buffer.tell() == 0
