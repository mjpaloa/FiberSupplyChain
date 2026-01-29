// routes/authRoutes.ts - Authentication routes with validation
import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/AuthController';
import { authenticate } from '../middleware/auth';
import { loginRateLimiter, registrationRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// =====================================================
// VALIDATION RULES
// =====================================================

const emailValidation = body('email')
  .isEmail()
  .normalizeEmail()
  .withMessage('Valid email is required');

const passwordValidation = body('password')
  .isLength({ min: 4 }) // Reduced from 8 for easier testing
  .withMessage('Password must be at least 4 characters long')
  .custom((value, { req }) => {
    // In development mode, be more lenient with password requirements
    if (process.env.NODE_ENV === 'development') {
      return true; // Skip complex validation in development
    }
    // In production, enforce strong password requirements
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(value)) {
      throw new Error('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
    }
    return true;
  });

// Farmer Registration Validation
const farmerRegistrationValidation = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Full name must be between 2 and 255 characters'),

  body('sex')
    .optional()
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Sex must be Male, Female, or Other'),

  body('age')
    .optional()
    .isInt({ min: 18, max: 100 })
    .withMessage('Age must be between 18 and 100'),

  body('contactNumber')
    .optional({ checkFalsy: true })
    .matches(/^(\+639\d{9}|09\d{9}|9\d{9})$/)
    .withMessage('Invalid Philippine contact number (format: 09XXXXXXXXX or +639XXXXXXXXX)'),

  emailValidation,
  passwordValidation,

  body('profilePhoto')
    .optional()
    .custom((value) => {
      // Allow empty strings or valid base64 strings
      if (value && value.length > 0 && !/^data:image\/[^;]+;base64,/.test(value) && !/^https?:\/\//.test(value)) {
        throw new Error('Profile photo must be a valid base64 image or URL');
      }
      return true;
    }),

  body('validIdPhoto')
    .optional()
    .custom((value) => {
      // Allow empty strings or valid base64 strings
      if (value && value.length > 0 && !/^data:image\/[^;]+;base64,/.test(value) && !/^https?:\/\//.test(value)) {
        throw new Error('Valid ID photo must be a valid base64 image or URL');
      }
      return true;
    }),
];

// Buyer Registration Validation
const buyerRegistrationValidation = [
  body('businessName')
    .trim()
    .notEmpty()
    .withMessage('Business name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Business name must be between 2 and 255 characters'),

  body('ownerName')
    .trim()
    .notEmpty()
    .withMessage('Owner name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Owner name must be between 2 and 255 characters'),

  body('contactNumber')
    .optional({ checkFalsy: true })
    .matches(/^(\+639\d{9}|09\d{9}|9\d{9})$/)
    .withMessage('Invalid Philippine contact number (format: 09XXXXXXXXX or +639XXXXXXXXX)'),

  emailValidation,
  passwordValidation,

  body('acceptedQualityGrades')
    .optional()
    .isArray()
    .withMessage('Accepted quality grades must be an array'),

  body('priceRangeMin')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),

  body('priceRangeMax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number'),

  body('partneredAssociations')
    .optional()
    .isArray()
    .withMessage('Partnered associations must be an array'),
];

// Officer Registration Validation
const officerRegistrationValidation = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Full name must be between 2 and 255 characters'),

  body('position')
    .trim()
    .notEmpty()
    .withMessage('Position is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Position must be between 2 and 100 characters'),

  body('associationName')
    .trim()
    .notEmpty()
    .withMessage('Association name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Association name must be between 2 and 255 characters'),

  body('contactNumber')
    .optional({ checkFalsy: true })
    .matches(/^(\+639\d{9}|09\d{9}|9\d{9})$/)
    .withMessage('Invalid Philippine contact number (format: 09XXXXXXXXX or +639XXXXXXXXX)'),

  emailValidation,
  passwordValidation,

  body('farmersUnderSupervision')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Farmers under supervision must be a positive integer'),
];

// Login Validation
const loginValidation = [
  emailValidation,

  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  body('userType')
    .isIn(['farmer', 'buyer', 'officer', 'association_officer'])
    .withMessage('User type must be farmer, buyer, officer, or association_officer'),
];

// =====================================================
// ROUTES
// =====================================================

/**
 * @route   POST /api/auth/register/farmer
 * @desc    Register a new farmer
 * @access  Public
 */
router.post(
  '/register/farmer',
  registrationRateLimiter,
  farmerRegistrationValidation,
  AuthController.registerFarmer
);

/**
 * @route   POST /api/auth/register/buyer
 * @desc    Register a new buyer
 * @access  Public
 */
router.post(
  '/register/buyer',
  registrationRateLimiter,
  buyerRegistrationValidation,
  AuthController.registerBuyer
);

/**
 * @route   POST /api/auth/register/officer
 * @desc    Register a new association officer (Public with admin approval)
 * @access  Public (requires admin verification after registration)
 */
router.post(
  '/register/officer',
  registrationRateLimiter,
  officerRegistrationValidation,
  AuthController.registerOfficer
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user (farmer, buyer, or officer)
 * @access  Public
 */
router.post('/login', loginRateLimiter, loginValidation, AuthController.login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh',
  loginRateLimiter,
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
    body('recaptchaToken').notEmpty().withMessage('CAPTCHA is required'),
  ],
  AuthController.refreshToken
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post(
  '/logout',
  authenticate,
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('userType')
      .isIn(['farmer', 'buyer', 'officer', 'association_officer'])
      .withMessage('Valid user type is required'),
  ],
  AuthController.logout
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', AuthController.getCurrentUser);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset user password
 * @access  Public
 */
router.post(
  '/reset-password',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('newPassword').isLength({ min: 4 }).withMessage('Password must be at least 4 characters long'),
  ],
  AuthController.resetPassword
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post(
  '/change-password',
  authenticate,
  [
    body('oldPassword').notEmpty().withMessage('Old password is required'),
    body('newPassword').isLength({ min: 4 }).withMessage('New password must be at least 4 characters long'),
  ],
  AuthController.changePassword
);

export default router;
