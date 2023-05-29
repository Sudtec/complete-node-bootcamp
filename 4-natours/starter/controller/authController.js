const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const User = require('../models/userModels');
const catchAsync = require('../utils/catchAsync');
const sendEmail = require('../utils/email');

const tokenGenerator = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
const createAndSendToken = (user, statusCode, res) => {
  const token = tokenGenerator(user._id);
  const cookieOption = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOption.secure = true;
  res.cookie('jwt', token, cookieOption);
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};
exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    passwordChangedAt: req.body.passwordChangedAt,
  });

  createAndSendToken(newUser, 201, res);
});

exports.logIn = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1)Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and Password', 400));
  }

  //Check if user exist and password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  //If everything is okay
  createAndSendToken(user, 200, res);
});
exports.protect = catchAsync(async (req, res, next) => {
  let token;
  // 1) Getting the token and checking if it's there
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(
      new AppError('You are not logged In, please log in to get access'),
      401
    );
  }
  //2)Token verification

  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET_KEY
  );
  //3)Check if User still exist
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The User with this id no longer exist', 401));
  }
  //4)Check if user changes password after the token was issued

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password, please log in again', 401)
    );
  }

  //Grant access to the protected route
  req.user = currentUser;
  next();
});
exports.restrictTo =
  (...role) =>
  (req, res, next) => {
    // role ['admin', 'lead-guide']
    if (!role.includes(req.user.role)) {
      return next(
        new AppError('You are not authorized to perform this action', 403)
      );
    }
    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on the inputed email address
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('No User found for this email address', 404));
  }
  //2) Generate a random reset Token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  //3) Send the rest token to user's email address
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot your password? Submit a patch request with your new password and password confirm to: ${resetUrl}. \n if you did not forget your password, please ignore this message.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'PASSWORD RESET TOKEN (10 minutes)',
      message,
    });
    res.status(200).json({
      status: 'success',
      message: 'Token to send to your mail',
    });
  } catch (err) {
    user.passwordResetExpires = undefined;
    user.passwordResetToken = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email, please try again later!',
        500
      )
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  //2) if the token has not expired and their is a user, set the new password
  if (!user) {
    return next(new AppError('Token is Invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  //3) update change passwordChangedAt using pre save model in user schema
  await user.save();

  //4) Log the user in and send JWT
  createAndSendToken(user, 200, res);
});
exports.updatePassword = catchAsync(async (req, res, next) => {
  //Get User from Collection
  const user = await User.findById(req.user.id).select('+password');
  //Check if Posted Password is correct
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('Your Current Password is incorrect.', 401));
  }
  //Update Password
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();

  //Log User In, send JWT
  createAndSendToken(user, 200, res);
});
