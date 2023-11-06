
const Tour=require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');



exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

//לא צריכים את הפונקציות הללו יותר:
//exports.checkId=(req,res,next, val)=>{
  //console.log(`Tour id is: ${val}`);
  //const id = req.params.id * 1;
  //if (id > tours.length) {
    //return res.status(404).json({
      //status: 'fail',
      //message: 'invalid id',
    //});
   //};
   //next();
  //};

  //exports.checkBody=(req, res, next)=>{
    //if(!req.body.name || !req.body.price){
        //return res.status(400).json({
            //status:'fail',
            //message:'Missing name or price',
        //});
      //}
     //next();
  //};

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour=factory.deleteOne(Tour);
//exports.deleteTour = catchAsync(async (req, res, next) => {

  //const tour=await Tour.findByIdAndDelete(req.params.id);

   //if (!tour) {
   //  // הפונקציה צריכה לקבל את אובייקט השגיאה מכיוון שזו נוהג סטנדרטי ב-אקספרס להעביר אובייקטי שגיאה לפונקציה הבאה כדי לציין שהתרחשה שגיאה ולהעביר את השליטה לתווך לטיפול בשגיאות.
   //  return next(new AppError('No tour found with that ID', 404));
   //}

 // res.status(204).json({
 //   //204 = no content
 //   status: 'sucess',
 //   data: null,
 // });
//});


exports.getTourStats = catchAsync(async (req, res,next) => {
  
    const stats = await Tour.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } }, //תכלול רק את הטיולים שממוצע הרייטינג שלהוא גדול שווה.. (תתאים)
      },
      {
        $group: {
          _id: { $toUpper: '$difficulty' }, //מקבץ את כל הטיולים על פי רמת קושי [קלים, בינוניים, קשים]
          numTours: { $sum: 1 }, //עבור כל טיול באותה קבוצת קושי תוסיף 1 לספירה
          numRatings: { $sum: '$ratingsQuantity' }, // סכום הדירוגים
          avgRating: { $avg: '$ratingsAverage' }, // ממוצע רייטינג
          avgPrice: { $avg: '$price' }, //מחיר ממוצע
          minPrice: { $min: '$price' }, //מחיר מינימלי
          maxPrice: { $max: '$price' }, //מחיר מקסימלי
        },
      },
      {
        $sort: { avgPrice: 1 }, //תציג אותם במיון בסדר עולה על פי מחיר ממוצע
      },
      // {
      //   $match: { _id: { $ne: 'EASY' } }
      // }
    ]);
    res.status(200).json({
      status: 'success',
      data: {
        stats,
      },
    });
});

exports.getMonthlyPlan = catchAsync(async (req, res,next) => {
  
    const year = req.params.year * 1; // 2021

    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates', // שלב זה "משחרר" שדה מערך בשם `startDates`. 
        //זה יוצר מסמך נפרד עבור כל רכיב במערך
        //. זה נעשה בדרך כלל כדי לעבוד עם תאריכים בודדים בתוך המערך.
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`), // <1.1.2021
            $lte: new Date(`${year}-12-31`), //>29.12.2021
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' }, //תקבץ אותם על פי חודשים
          numTourStarts: { $sum: 1 }, //תספור כמה טיולים יש בקבוצה של החודש הזה
          tours: { $push: '$name' }, //תדחוף את שמות הטיולים למערך ותציג אותם
        },
      },
      {
        $addFields: { month: '$_id' }, //תוסיף שדה של חודש
      },
      {
        $project: {
          _id: 0, //אל תציג את שדה האיידי
        },
      },
      {
        $sort: { numTourStarts: -1 }, //תציג את החודשים בסדר יורד
      },
      {
        $limit: 12, //תציג את כל 12 החודשים (אם היינו רושמים 6 אז זזה היה מציג רק שש)
      },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        plan,
      },
    });
});


//GET TOURS WITHIN RADIUS:
// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/34.111745,-118.113491/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitutr and longitude in the format lat,lng.',
        400
      )
    );
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitutr and longitude in the format lat,lng.',
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});