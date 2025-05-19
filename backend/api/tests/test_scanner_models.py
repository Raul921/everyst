"""
Tests for the network scanner service module.
"""

import unittest
from api.services.network_scanner import (
    ScanOptions, ScanType, ScanStatus, ScanJob, ScanResult
)


class TestScanOptions(unittest.TestCase):
    def test_default_values(self):
        """Test that ScanOptions has correct default values."""
        options = ScanOptions()
        self.assertEqual(options.scan_type, ScanType.BASIC)
        self.assertIsNone(options.ip_range)
        self.assertIsNone(options.subnet)
        self.assertTrue(options.include_ports)
        self.assertFalse(options.include_os_detection)
        self.assertFalse(options.include_service_detection)
        self.assertEqual(options.max_devices, 100)
        
    def test_to_dict(self):
        """Test the to_dict method."""
        options = ScanOptions(
            scan_type=ScanType.INTENSE,
            ip_range="192.168.1.0/24",
            include_os_detection=True
        )
        
        options_dict = options.to_dict()
        self.assertEqual(options_dict['scan_type'], 'INTENSE')
        self.assertEqual(options_dict['ip_range'], '192.168.1.0/24')
        self.assertTrue(options_dict['include_os_detection'])
        self.assertTrue(options_dict['include_ports'])  # Default


class TestScanJob(unittest.TestCase):
    def test_default_values(self):
        """Test that ScanJob has correct default values."""
        job = ScanJob()
        self.assertIsNotNone(job.id)
        self.assertEqual(job.status, ScanStatus.READY)
        self.assertEqual(job.progress, 0)
        self.assertIsNone(job.start_time)
        self.assertIsNone(job.end_time)
        
    def test_lifecycle_methods(self):
        """Test the job lifecycle methods."""
        job = ScanJob()
        
        # Test mark_started
        job.mark_started()
        self.assertEqual(job.status, ScanStatus.RUNNING)
        self.assertEqual(job.progress, 0)
        self.assertIsNotNone(job.start_time)
        
        # Test update_progress
        job.update_progress(50)
        self.assertEqual(job.progress, 50)
        
        # Test mark_completed
        job.mark_completed()
        self.assertEqual(job.status, ScanStatus.COMPLETED)
        self.assertEqual(job.progress, 100)
        self.assertIsNotNone(job.end_time)
        
        # Create a new job for failure testing
        job = ScanJob()
        job.mark_started()
        
        # Test mark_failed
        job.mark_failed("Test error")
        self.assertEqual(job.status, ScanStatus.FAILED)
        self.assertEqual(job.error_message, "Test error")
        self.assertIsNotNone(job.end_time)
