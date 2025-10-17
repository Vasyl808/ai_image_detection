"""
PDF Report Service

Generates comprehensive PDF reports for deepfake detection results.
"""

import io
from datetime import datetime
from pathlib import Path
from typing import BinaryIO
import tempfile
import os

from PIL import Image
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Image as RLImage,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY

from app.core.logging_config import get_logger

logger = get_logger(__name__)


class PDFReportService:
    """
    Service for generating PDF reports of deepfake detection results.

    The report includes:
    - Detection summary (Real/Deepfake conclusion)
    - Original analyzed image
    - Grad-CAM heatmap visualization
    - Explanation of how to interpret the heatmap
    - Timestamp and metadata
    """

    # Report styling constants - optimized for compactness
    PAGE_SIZE = A4  # A4 is more compact than letter
    MARGIN = 0.5 * inch  # Smaller margins
    TITLE_FONT_SIZE = 20  # Smaller title
    HEADING_FONT_SIZE = 14  # Smaller headings
    BODY_FONT_SIZE = 10  # Smaller body text

    # Image optimization constants
    MAX_IMAGE_WIDTH = 3.5 * inch  # Smaller images
    MAX_IMAGE_HEIGHT = 3.5 * inch
    JPEG_QUALITY = 75  # Good balance of quality vs size

    # Color scheme
    PRIMARY_COLOR = colors.HexColor("#2563eb")  # Blue
    SUCCESS_COLOR = colors.HexColor("#16a34a")  # Green
    DANGER_COLOR = colors.HexColor("#dc2626")   # Red
    GRAY_COLOR = colors.HexColor("#6b7280")     # Gray
    @classmethod
    def _compress_image_for_pdf(cls, image_path: Path) -> Path:
        """
        Compress and resize image for PDF embedding.

        Args:
            image_path: Path to the original image

        Returns:
            Path to the compressed image file
        """
        try:
            with Image.open(image_path) as img:
                # Convert to RGB if necessary
                if img.mode in ('RGBA', 'P', 'L'):
                    img = img.convert('RGB')

                # Calculate scaling to fit within max dimensions
                img_width, img_height = img.size
                width_ratio = cls.MAX_IMAGE_WIDTH / (img_width * 72 / 96)  # Convert pixels to points
                height_ratio = cls.MAX_IMAGE_HEIGHT / (img_height * 72 / 96)
                scale = min(width_ratio, height_ratio, 1.0)

                if scale < 1.0:
                    new_width = int(img_width * scale)
                    new_height = int(img_height * scale)
                    img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

                # Save compressed version to temporary file
                temp_fd, temp_path = tempfile.mkstemp(suffix='.jpg')
                try:
                    os.close(temp_fd)  # Close the file descriptor
                    img.save(temp_path, 'JPEG', quality=cls.JPEG_QUALITY, optimize=True)
                    return Path(temp_path)
                except Exception:
                    os.unlink(temp_path)
                    raise

        except Exception as e:
            logger.warning(f"Failed to compress image {image_path}: {e}, using original")
            return image_path
    
    @classmethod
    def generate_report(
        cls,
        original_image_path: Path,
        gradcam_image_path: Path,
        prediction_label: str,
        is_deepfake: bool,
        gradcam_description: str,
    ) -> io.BytesIO:
        """
        Generate a PDF report for deepfake detection results.
        
        Args:
            original_image_path: Path to the original analyzed image
            gradcam_image_path: Path to the Grad-CAM visualization
            prediction_label: Prediction label (e.g., "Real" or "Deepfake")
            is_deepfake: Whether the image is classified as deepfake
            gradcam_description: Description of the Grad-CAM visualization
            
        Returns:
            BytesIO buffer containing the generated PDF
            
        Raises:
            Exception: If PDF generation fails
        """
        try:
            logger.info("Starting PDF report generation")
            
            # Compress images for PDF embedding
            compressed_original = cls._compress_image_for_pdf(original_image_path)
            compressed_gradcam = cls._compress_image_for_pdf(gradcam_image_path)
            
            # Create PDF buffer
            buffer = io.BytesIO()
            
            # Create document with optimized settings
            doc = SimpleDocTemplate(
                buffer,
                pagesize=cls.PAGE_SIZE,
                leftMargin=cls.MARGIN,
                rightMargin=cls.MARGIN,
                topMargin=cls.MARGIN,
                bottomMargin=cls.MARGIN,
            )
            
            # Build content
            story = []
            styles = cls._get_styles()
            
            # Add header
            cls._add_header(story, styles)
            
            # Add detection summary
            cls._add_detection_summary(
                story, styles, prediction_label, is_deepfake
            )
            
            # Add timestamp
            cls._add_timestamp(story, styles)
            
            story.append(Spacer(1, 0.15 * inch))  # Reduced spacing
            
            # Add original image (compressed)
            cls._add_section_header(story, styles, "Analyzed Image")
            cls._add_image(story, compressed_original, max_width=cls.MAX_IMAGE_WIDTH, max_height=cls.MAX_IMAGE_HEIGHT)
            
            story.append(Spacer(1, 0.15 * inch))  # Reduced spacing
            
            # Add Grad-CAM visualization (compressed)
            cls._add_section_header(story, styles, "Grad-CAM Heatmap")
            cls._add_image(story, compressed_gradcam, max_width=cls.MAX_IMAGE_WIDTH, max_height=cls.MAX_IMAGE_HEIGHT)
            
            story.append(Spacer(1, 0.1 * inch))  # Reduced spacing
            
            # Add Grad-CAM description
            cls._add_gradcam_description(story, styles, gradcam_description)
            
            story.append(Spacer(1, 0.15 * inch))  # Reduced spacing
            
            # Add simplified interpretation guide
            cls._add_interpretation_guide(story, styles)
            
            # Build PDF
            doc.build(story)
            
            # Clean up temporary compressed images
            try:
                if compressed_original != original_image_path:
                    compressed_original.unlink(missing_ok=True)
                if compressed_gradcam != gradcam_image_path:
                    compressed_gradcam.unlink(missing_ok=True)
            except Exception as e:
                logger.warning(f"Failed to clean up temporary images: {e}")
            
            # Reset buffer position
            buffer.seek(0)
            
            logger.info("PDF report generated successfully")
            return buffer
            
        except Exception as e:
            logger.error(f"Failed to generate PDF report: {e}", exc_info=True)
            raise
    
    @classmethod
    def _get_styles(cls) -> dict:
        """Get custom paragraph styles for the report."""
        base_styles = getSampleStyleSheet()
        
        # Custom styles
        styles = {
            'Title': ParagraphStyle(
                'CustomTitle',
                parent=base_styles['Title'],
                fontSize=cls.TITLE_FONT_SIZE,
                textColor=cls.PRIMARY_COLOR,
                spaceAfter=20,
                alignment=TA_CENTER,
                fontName='Helvetica-Bold',
            ),
            'Heading': ParagraphStyle(
                'CustomHeading',
                parent=base_styles['Heading1'],
                fontSize=cls.HEADING_FONT_SIZE,
                textColor=cls.PRIMARY_COLOR,
                spaceAfter=12,
                spaceBefore=12,
                fontName='Helvetica-Bold',
            ),
            'BodyText': ParagraphStyle(
                'CustomBody',
                parent=base_styles['BodyText'],
                fontSize=cls.BODY_FONT_SIZE,
                alignment=TA_JUSTIFY,
                spaceAfter=8,
                leading=14,
            ),
            'Centered': ParagraphStyle(
                'CustomCentered',
                parent=base_styles['BodyText'],
                fontSize=cls.BODY_FONT_SIZE,
                alignment=TA_CENTER,
                textColor=cls.GRAY_COLOR,
            ),
            'ResultReal': ParagraphStyle(
                'ResultReal',
                parent=base_styles['Heading1'],
                fontSize=18,  # Smaller
                textColor=cls.SUCCESS_COLOR,
                alignment=TA_CENTER,
                spaceAfter=6,  # Smaller spacing
                fontName='Helvetica-Bold',
            ),
            'ResultFake': ParagraphStyle(
                'ResultFake',
                parent=base_styles['Heading1'],
                fontSize=18,  # Smaller
                textColor=cls.DANGER_COLOR,
                alignment=TA_CENTER,
                spaceAfter=6,  # Smaller spacing
                fontName='Helvetica-Bold',
            ),
        }
        
        return styles
    
    @classmethod
    def _add_header(cls, story: list, styles: dict) -> None:
        """Add report header."""
        story.append(Paragraph("Deepfake Detection Report", styles['Title']))
        story.append(Spacer(1, 0.1 * inch))  # Reduced spacing
    
    @classmethod
    def _add_detection_summary(
        cls,
        story: list,
        styles: dict,
        prediction_label: str,
        is_deepfake: bool,
    ) -> None:
        """Add detection summary section."""
        # Result box
        result_style = styles['ResultFake'] if is_deepfake else styles['ResultReal']
        
        story.append(Paragraph(
            f"<b>Detection Result: {prediction_label}</b>",
            result_style
        ))
        
        # Conclusion text
        conclusion = (
            "This image appears to be <b>AI-generated or digitally manipulated</b>. "
            "The analysis detected patterns consistent with synthetic image generation."
        ) if is_deepfake else (
            "This image appears to be <b>authentic</b>. "
            "The analysis found patterns consistent with real, unmanipulated imagery."
        )
        
        story.append(Paragraph(conclusion, styles['BodyText']))
    
    @classmethod
    def _add_timestamp(cls, story: list, styles: dict) -> None:
        """Add analysis timestamp."""
        timestamp = datetime.now().strftime("%B %d, %Y at %I:%M %p")
        story.append(Paragraph(
            f"<i>Analysis performed on {timestamp}</i>",
            styles['Centered']
        ))
    
    @classmethod
    def _add_section_header(cls, story: list, styles: dict, title: str) -> None:
        """Add a section header."""
        story.append(Paragraph(title, styles['Heading']))
    
    @classmethod
    def _add_image(
        cls,
        story: list,
        image_path: Path,
        max_width: float = 3.5 * inch,
        max_height: float = 3.5 * inch,
    ) -> None:
        """
        Add an image to the report with automatic scaling.
        
        Args:
            story: Report story list
            image_path: Path to the image file
            max_width: Maximum width in points
            max_height: Maximum height in points
        """
        try:
            # Get image dimensions
            with Image.open(image_path) as img:
                img_width, img_height = img.size
            
            # Calculate scaling
            width_ratio = max_width / img_width
            height_ratio = max_height / img_height
            scale = min(width_ratio, height_ratio, 1.0)  # Don't upscale
            
            # Calculate final dimensions
            final_width = img_width * scale
            final_height = img_height * scale
            
            # Add image centered
            img = RLImage(str(image_path), width=final_width, height=final_height)
            
            # Center the image using a table with optimized width
            table_width = min(final_width + 0.5 * inch, 4.5 * inch)  # Add some padding but cap at reasonable size
            table = Table([[img]], colWidths=[table_width])
            table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))
            
            story.append(table)
            
        except Exception as e:
            logger.error(f"Failed to add image to PDF: {e}")
            story.append(Paragraph(
                f"<i>[Image could not be loaded: {image_path.name}]</i>",
                cls._get_styles()['Centered']
            ))
    
    @classmethod
    def _add_gradcam_description(
        cls,
        story: list,
        styles: dict,
        description: str,
    ) -> None:
        """Add Grad-CAM description."""
        story.append(Paragraph(
            "<b>What this visualization shows:</b>",
            styles['BodyText']
        ))
        story.append(Paragraph(description, styles['BodyText']))
    
    @classmethod
    def _add_interpretation_guide(cls, story: list, styles: dict) -> None:
        """Add simplified Grad-CAM interpretation guide."""
        story.append(Paragraph(
            "<b>Understanding the Heatmap:</b>",
            styles['Heading']
        ))
        
        # Simple bullet points instead of complex table
        guide_items = [
            "<b>Red/Yellow areas:</b> Most important regions for the AI's decision",
            "<b>Blue/Green areas:</b> Less influential regions", 
            "<b>Dark areas:</b> Minimal impact on the prediction"
        ]
        
        for item in guide_items:
            story.append(Paragraph(f"• {item}", styles['BodyText']))
        
        story.append(Spacer(1, 0.1 * inch))
        
        # Simplified disclaimer
        story.append(Paragraph(
            "<i>This AI analysis provides insights but should be considered alongside other verification methods.</i>",
            styles['Centered']
        ))
