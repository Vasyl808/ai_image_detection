"""
EfficientNet-based deepfake detection model with Grad-CAM support.

This module contains the PyTorch model architecture for binary classification
of images as real or AI-generated/manipulated (deepfake).
"""

from collections import OrderedDict
from pathlib import Path
from typing import Optional, Tuple

import torch
import torch.nn as nn
from torchvision import models

from app.core.logging_config import get_logger

logger = get_logger(__name__)


class DeepfakeDetector(nn.Module):
    """
    EfficientNet-B0 based deepfake detector with Grad-CAM support.
    
    This model uses a pretrained EfficientNet-B0 as a backbone and adds
    custom classification layers for binary classification. It includes
    support for Grad-CAM visualization by storing activations and gradients.
    
    Attributes:
        efficientnet: The full EfficientNet model
        features: Feature extraction layers (for Grad-CAM)
        avgpool: Global average pooling layer
        gradients: Stored gradients for Grad-CAM (set during backward pass)
        activations: Stored activations for Grad-CAM (set during forward pass)
    """
    
    def __init__(self, num_classes: int = 1, pretrained: bool = True) -> None:
        """
        Initialize the deepfake detector model.
        
        Args:
            num_classes: Number of output classes (1 for binary classification with sigmoid)
            pretrained: Whether to use ImageNet pretrained weights
        """
        super(DeepfakeDetector, self).__init__()
        
        # Load pretrained EfficientNet-B0
        weights = 'DEFAULT' if pretrained else None
        self.efficientnet = models.efficientnet_b0(weights=weights)
        
        # Store references to feature layers for Grad-CAM
        self.features = self.efficientnet.features
        self.avgpool = self.efficientnet.avgpool
        
        # Replace classification head
        in_features = self.efficientnet.classifier[1].in_features
        self.efficientnet.classifier = nn.Sequential(
            nn.Dropout(p=0.3, inplace=True), 
            nn.Linear(in_features, 256),     
            nn.BatchNorm1d(256),
            nn.ReLU(inplace=True),
            nn.Dropout(p=0.4),
            nn.Linear(256, num_classes)
        )
        
        # Storage for Grad-CAM
        self.gradients: Optional[torch.Tensor] = None
        self.activations: Optional[torch.Tensor] = None
        
        logger.info(
            f"Initialized DeepfakeDetector with {self._count_parameters():,} parameters"
        )
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Standard forward pass without Grad-CAM.
        
        Args:
            x: Input tensor of shape (batch_size, 3, 224, 224)
            
        Returns:
            Output logits of shape (batch_size, num_classes)
        """
        return self.efficientnet(x)
    
    def forward_with_cam(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass with Grad-CAM activation and gradient storage.
        
        This method stores intermediate activations and registers a hook
        to capture gradients during backpropagation, which are needed
        for Grad-CAM visualization.
        
        Args:
            x: Input tensor of shape (batch_size, 3, 224, 224)
            
        Returns:
            Output logits of shape (batch_size, num_classes)
        """
        # Forward through feature extractor
        x = self.features(x)
        
        # Store activations for Grad-CAM
        self.activations = x
        
        # Register hook to capture gradients
        if x.requires_grad:
            x.register_hook(self._save_gradient)
        
        # Complete forward pass
        x = self.avgpool(x)
        x = torch.flatten(x, 1)
        x = self.efficientnet.classifier(x)
        
        return x
    
    def _save_gradient(self, grad: torch.Tensor) -> None:
        """
        Hook function to save gradients during backpropagation.
        
        Args:
            grad: Gradient tensor from backpropagation
        """
        self.gradients = grad
    
    def load_weights(
        self,
        checkpoint_path: Path,
        use_dataparallel: bool = False
    ) -> "DeepfakeDetector":
        """
        Load model weights from a checkpoint file.
        
        Supports loading weights saved with or without DataParallel wrapper.
        When loading DataParallel weights, automatically removes the 'module.'
        prefix from state dict keys.
        
        Args:
            checkpoint_path: Path to the .pth checkpoint file
            use_dataparallel: Whether the checkpoint was saved with DataParallel
            
        Returns:
            Self for method chaining
            
        Raises:
            FileNotFoundError: If checkpoint file doesn't exist
            RuntimeError: If checkpoint loading fails
        """
        if not Path(checkpoint_path).exists():
            raise FileNotFoundError(f"Checkpoint not found: {checkpoint_path}")
        
        try:
            checkpoint = torch.load(checkpoint_path, map_location='cpu')
            
            if use_dataparallel:
                # Remove 'module.' prefix from DataParallel state dict
                new_state_dict = OrderedDict()
                for k, v in checkpoint.items():
                    name = k[7:] if k.startswith('module.') else k
                    new_state_dict[name] = v
                self.load_state_dict(new_state_dict)
            else:
                self.load_state_dict(checkpoint)
            
            logger.info(f"Successfully loaded weights from {checkpoint_path}")
            self.eval()
            
        except Exception as e:
            logger.error(f"Failed to load weights from {checkpoint_path}: {e}")
            raise RuntimeError(f"Failed to load checkpoint: {e}")
        
        return self
    
    def save_weights(self, save_path: Path) -> None:
        """
        Save model weights to a file.
        
        Args:
            save_path: Path where to save the checkpoint
        """
        torch.save(self.state_dict(), save_path)
        logger.info(f"Model weights saved to {save_path}")
    
    def _count_parameters(self) -> int:
        """
        Count total number of trainable parameters.
        
        Returns:
            Total number of parameters
        """
        return sum(p.numel() for p in self.parameters() if p.requires_grad)
    
    def get_num_parameters(self) -> Tuple[int, int]:
        """
        Get counts of total and trainable parameters.
        
        Returns:
            Tuple of (total_params, trainable_params)
        """
        total = sum(p.numel() for p in self.parameters())
        trainable = sum(p.numel() for p in self.parameters() if p.requires_grad)
        return total, trainable
