import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { AssociationProfileController } from '../controllers/AssociationProfileController';
import multer from 'multer';
import path from 'path';

const router = Router();
const controller = new AssociationProfileController();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profiles/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif)'));
    }
  }
});

// Get association officer profile
router.get('/profile', authenticateToken, controller.getProfile);

// Update association officer profile
router.put('/profile', authenticateToken, controller.updateProfile);

// Upload profile picture
router.post('/profile/upload-picture', authenticateToken, upload.single('profile_picture'), controller.uploadProfilePicture);

// Upload valid ID photo
router.post('/profile/upload-id', authenticateToken, upload.single('valid_id_photo'), controller.uploadIDPhoto);

// Change password
router.put('/profile/change-password', authenticateToken, controller.changePassword);

export default router;
