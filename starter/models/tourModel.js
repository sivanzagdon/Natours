const mongoose = require('mongoose');
const slugify=require('slugify');
const validator= require('validator');
//const User = require('./userModel');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal then 40 characters'],
      minlength: [10, 'A tour name must have more or equal then 10 characters'],
    },

    slug: String,

    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },

    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },

    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },

    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10, // 4.666666, 46.6666, 47, 4.7
    },

    ratingsQuantity: {
      type: Number,
      default: 0,
    },

    price: {
      type: Number,
      required: [true, ' a tour must have a price!'],
    },

    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only points to current doc on NEW document creation
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },

    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },

    description: {
      type: String,
      trim: true,
    },

    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },

    images: [String], //Array of images

    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },

    startDates: [Date], //Array of dates

    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJSON= geospatial data
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      //array
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    //הוירטואל אומר שזה כולל מאפיינים וירטואלים:
    //מאפיינים וירטואליים הם מאפיינים שאינם מאוחסנים ישירות במסד הנתונים אלא מחושבים על סמך הנתונים הקיימים במסמך.
    toJSON: { virtuals: true }, //המרה ל json
    toObject: { virtuals: true }, //המרה ל javascript
  }
);

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });


//הגדרת מאפיין וירטואלי בשם durationWeeks
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

// Virtual populate= נכס וירטואלי אינו מאוחסן במסד הנתונים אלא מחושב כאשר מבקשים אותו
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
tourSchema.pre('save',function(next){
    this.slug=slugify(this.name,{lower: true});
    next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
      path:'guides',
      select: '-__v -passwordChangedAt'
    });
  next();
});


//תציג את מה שקטגוריית הסודיות שלו לא שווה לטרו
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } }); //ne= not equal
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds!`);
  next();
});

//תתבצע אגרגציה רק למי שקטגוריית הסודיות שלו לא שווה לטרו
tourSchema.pre('aggregate', function (next) {
  //this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

  console.log(this.pipeline());
  next();
});

 //tourSchema.pre('save', async function(next) {
   //const guidesPromises = this.guides.map(async id => await User.findById(id));// באמצעות מפ הוא עובר על כל אחד מהמדריכים שהוכנסו לאובייקט טיול
  // // ועל כל אחד מהמדריכים הוא לוקח תתז ומחפש אותו ברשימת היוזרים
  // // מפ בעצם מכניסה אותם למערך
  // this.guides = await Promise.all(guidesPromises); //מעדכן את מערך המדריכים בתוך האובייקט
  // next();
// });

//tourSchema.post('save', function (doc,next) {
 // console.log(doc);
 // next();
//});

const Tour = mongoose.model('Tour', tourSchema);

module.exports=Tour;

//const testTour=new Tour({
//name:'FirsT Tourrrr',
//rating: 6,
//price:400
//});

//testTour.save().then(doc=>{
//console.log(doc);
//}).catch(err=>{
//console.log('error:',err);
//})
