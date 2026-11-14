const express = require('express');
const router = express.Router();
const controller = require('../controllers/passController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, authorize('student'), controller.create);
router.get('/my', authenticate, authorize('student'), controller.my);
router.get('/profile', authenticate, authorize('student'), controller.getProfile);
router.put('/profile', authenticate, authorize('student'), controller.updateProfile);

router.get('/admin/all', authenticate, authorize('admin'), controller.adminList);
router.patch('/admin/:id/review', authenticate, authorize('admin'), controller.review);

router.post('/security/verify', authenticate, authorize('security'), controller.verify);
router.get('/security/records', authenticate, authorize('security', 'admin'), controller.records);

router.get('/teacher/attendance', authenticate, authorize('teacher', 'admin'), controller.teacherAttendance);

module.exports = router;
