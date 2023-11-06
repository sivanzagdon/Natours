const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {}; // איתחול אובייקט ריק
  //Object.keys(obj): שיטה שבה אנו לוקחים את כל המפתחות  של האוביקט שקיבלנו ויוצרים ממנו מערך
  Object.keys(obj).forEach((el) => { // עוברים על כל אחד מהמפתחות האלו במערך
    if (allowedFields.includes(el)) newObj[el] = obj[el]; // אם המאפיין נמצא ברשימת המאפיינים שקיבלנו אז נכניס אותו לאובייקט החדש בתור מאפיין
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  console.log(req.params.id);
  req.params.id = req.user.id;
  next();
};


exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead',
  });
};
exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser =factory.deleteOne(User);

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});