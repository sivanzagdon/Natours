const express=require('express');
const tourController=require('./../controllers/tourController');
const router = express.Router();
const authController = require('./../controllers/authController');
const reviewRouter = require('./reviewRoutes');

///router.param('id',tourController.checkId);

router.use('/:tourId/reviews', reviewRouter);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);

router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

  router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);
// /tours-within?distance=233&center=-40,45&unit=mi
// /tours-within/233/center/-40,45/unit/mi

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  .get(authController.protect, tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );


router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updateTour
  )
  .delete(
    authController.protect,
    //מגבילים את פעולת המחיקה רק לתפקידים האלו:
    authController.restrictTo('admin', 'lead-guide', 'user'),
    tourController.deleteTour
  );




module.exports = router;

//same:
//app.route('/api/v1/tours')
//.get(getAllTours)
//.post(createTour);

//app
//.route('/api/v1/tours/:id')
//.get(getTour)
//.patch(updateTour)
//.delete(deleteTour);
