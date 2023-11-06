const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) Get tour data from collection
  const tours = await Tour.find();
  const user = req.cookies.user; // Read the user data from cookies

  // 2) Build template
  // 3) Render that template using tour data from 1)
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getTour = catchAsync(async(req, res, next) => {
const tour= await Tour.findOne({slug: req.params.slug}).populate({
    path:'reviews',
    field:'review rating user'
});

if(!tour){
   return next(new AppError('there is no tour with that name'),404);
}

    res.status(200).render('tour', {
    title: `${tour.name}`,
    tour,
  });

});


exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
};
