const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Get farmer's notifications
router.get('/farmer/my-notifications', authenticateToken, requireRole('farmer'), async (req, res) => {
  try {
    const farmerId = req.user.userId;
    
    const result = await pool.query(`
      SELECT 
        notification_id,
        notification_type,
        title,
        message,
        reference_id,
        is_read,
        created_at
      FROM farmer_notifications
      WHERE farmer_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [farmerId]);

    res.json({
      success: true,
      notifications: result.rows
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get unread notification count
router.get('/farmer/unread-count', authenticateToken, requireRole('farmer'), async (req, res) => {
  try {
    const farmerId = req.user.userId;
    
    const result = await pool.query(`
      SELECT COUNT(*) as unread_count
      FROM farmer_notifications
      WHERE farmer_id = $1 AND is_read = false
    `, [farmerId]);

    res.json({
      success: true,
      unreadCount: parseInt(result.rows[0].unread_count)
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Mark notification as read
router.put('/farmer/:notificationId/mark-read', authenticateToken, requireRole('farmer'), async (req, res) => {
  try {
    const { notificationId } = req.params;
    const farmerId = req.user.userId;
    
    await pool.query(`
      UPDATE farmer_notifications
      SET is_read = true
      WHERE notification_id = $1 AND farmer_id = $2
    `, [notificationId, farmerId]);

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/farmer/mark-all-read', authenticateToken, requireRole('farmer'), async (req, res) => {
  try {
    const farmerId = req.user.userId;
    
    await pool.query(`
      UPDATE farmer_notifications
      SET is_read = true
      WHERE farmer_id = $1 AND is_read = false
    `, [farmerId]);

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Helper function to create notification (used by other routes)
async function createNotification(farmerId, type, title, message, referenceId = null) {
  try {
    await pool.query(`
      INSERT INTO farmer_notifications (farmer_id, notification_type, title, message, reference_id)
      VALUES ($1, $2, $3, $4, $5)
    `, [farmerId, type, title, message, referenceId]);
    
    console.log(`✅ Notification created for farmer ${farmerId}: ${title}`);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

module.exports = { router, createNotification };
