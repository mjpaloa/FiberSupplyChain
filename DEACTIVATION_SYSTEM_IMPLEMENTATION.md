# User Deactivation System Implementation

## Overview
Implemented a comprehensive user deactivation system for MAO super admin and admin users to replace permanent deletion with a 3-day grace period system. This applies to farmers, buyers, and association officers.

## Key Features

### 🔄 Deactivation Instead of Deletion
- **Replace Delete with Deactivate**: All "delete" buttons now deactivate users instead of permanently removing them
- **3-Day Grace Period**: Deactivated users remain in the system for 3 days before automatic permanent deletion
- **Reactivation Option**: Admins can reactivate users within the 3-day window
- **Audit Trail**: Track who deactivated/reactivated users and when

### 📊 User Status Management
- **Active**: Normal functioning users
- **Deactivated**: Users in 3-day grace period (cannot login)
- **Expired**: Users ready for permanent deletion (>3 days deactivated)

## Backend Implementation

### Database Schema Changes
**New Fields Added to All User Tables:**
```sql
-- farmers, buyers, association_officers tables
deactivated_at TIMESTAMPTZ        -- When user was deactivated
deactivated_by TEXT               -- Officer who deactivated
reactivated_at TIMESTAMPTZ        -- When user was reactivated
reactivated_by TEXT               -- Officer who reactivated
```

### API Endpoints

#### Farmers
- `POST /api/mao/farmers/:id/deactivate` - Deactivate farmer
- `POST /api/mao/farmers/:id/reactivate` - Reactivate farmer
- `DELETE /api/mao/farmers/:id/permanent` - Permanent delete (cleanup only)

#### Buyers
- `POST /api/mao/buyers/:id/deactivate` - Deactivate buyer
- `POST /api/mao/buyers/:id/reactivate` - Reactivate buyer
- `DELETE /api/mao/buyers/:id/permanent` - Permanent delete (cleanup only)

#### Association Officers
- `POST /api/mao/association-officers/:id/deactivate` - Deactivate officer
- `POST /api/mao/association-officers/:id/reactivate` - Reactivate officer
- `DELETE /api/mao/association-officers/:id/permanent` - Permanent delete (cleanup only)

#### Cleanup Management
- `POST /api/mao/cleanup/run` - Manually trigger cleanup
- `GET /api/mao/cleanup/stats` - Get deactivation statistics
- `GET /api/mao/cleanup/pending` - Get users pending deletion

### Controllers Updated

#### UserManagementController.ts
- **deactivateFarmer()** - Deactivate farmer with timestamp
- **reactivateFarmer()** - Reactivate farmer and clear deactivation
- **permanentlyDeleteFarmer()** - Permanent deletion (cleanup use)
- Same pattern for buyers and association officers

#### CleanupController.ts (New)
- **runCleanup()** - Manual cleanup trigger
- **getStats()** - Deactivation statistics
- **getPendingDeletion()** - List users pending deletion

### Services

#### CleanupService.ts (New)
- **cleanupDeactivatedUsers()** - Delete users deactivated >3 days
- **getDeactivationStats()** - Statistics on deactivated users

## Database Migration

### Migration Script: `add_deactivation_fields.sql`
```sql
-- Adds deactivation fields to all user tables
-- Creates indexes for efficient queries
-- Includes cleanup function and monitoring view
-- Adds comprehensive documentation
```

### Key Database Objects Created:
1. **Deactivation Fields** - Track deactivation timestamps and actors
2. **Indexes** - Efficient queries on deactivated users
3. **Cleanup Function** - `cleanup_expired_deactivated_users()`
4. **Monitoring View** - `deactivated_users_with_expiry`

## User Experience Flow

### Admin Actions
1. **Deactivate User**: Click "Deactivate" → User marked inactive, 3-day timer starts
2. **Reactivate User**: Click "Reactivate" → User restored to active status
3. **View Pending**: See list of users awaiting permanent deletion
4. **Manual Cleanup**: Trigger immediate cleanup of expired users

### User Status Indicators
- **Active** ✅ - Normal user, can login
- **Deactivated** ⏳ - Grace period active, cannot login
- **Expiring Soon** ⚠️ - <1 day remaining before deletion
- **Expired** ❌ - Ready for permanent deletion

### Automatic Cleanup
- **Daily Process**: Automatically delete users deactivated >3 days
- **Manual Trigger**: Admins can run cleanup immediately
- **Audit Logging**: All cleanup operations logged

## Security & Permissions

### Access Control
- **Super Admin**: Full access to all deactivation functions
- **Regular Admin**: Access to deactivation functions
- **Audit Trail**: All actions tracked with user ID and timestamp

### Data Protection
- **Grace Period**: 3-day window prevents accidental data loss
- **Reactivation**: Easy recovery within grace period
- **Permanent Deletion**: Only after grace period expires

## Implementation Status

### ✅ Completed Backend Features
- [x] Deactivation functionality for all user types
- [x] 3-day grace period implementation
- [x] Reactivation functionality
- [x] Automated cleanup service
- [x] Database migration script
- [x] API endpoints and routes
- [x] Audit trail and logging

### 🔄 Pending Frontend Updates
- [ ] Update UI buttons (Delete → Deactivate/Reactivate)
- [ ] Add deactivation status indicators
- [ ] Implement cleanup management interface
- [ ] Add pending deletion dashboard

## Usage Examples

### Deactivate a Farmer
```bash
POST /api/mao/farmers/123/deactivate
Authorization: Bearer <admin_token>
```

### Get Deactivation Statistics
```bash
GET /api/mao/cleanup/stats
Authorization: Bearer <admin_token>
```

### Manual Cleanup
```bash
POST /api/mao/cleanup/run
Authorization: Bearer <admin_token>
```

## Database Queries

### View All Deactivated Users
```sql
SELECT * FROM deactivated_users_with_expiry 
ORDER BY expires_at ASC;
```

### Manual Cleanup
```sql
SELECT cleanup_expired_deactivated_users();
```

## Next Steps

1. **Deploy Database Migration**: Run the migration script on production
2. **Update Frontend UI**: Replace delete buttons with deactivate/reactivate
3. **Add Status Indicators**: Show user deactivation status in admin panels
4. **Setup Automated Cleanup**: Configure daily cleanup job
5. **Admin Training**: Train admins on new deactivation workflow

## Benefits

### For Administrators
- **Mistake Recovery**: 3-day window to fix accidental deactivations
- **Better Control**: Clear distinction between temporary and permanent removal
- **Audit Trail**: Complete history of user status changes

### For System
- **Data Safety**: Prevents accidental permanent data loss
- **Compliance**: Better data retention and deletion policies
- **Performance**: Efficient cleanup of inactive users

### For Users
- **Account Recovery**: Chance to reactivate within grace period
- **Clear Status**: Understanding of account state
- **Fair Process**: Time to resolve issues before permanent deletion

This implementation provides a robust, safe, and auditable user management system that replaces immediate deletion with a thoughtful deactivation process.
