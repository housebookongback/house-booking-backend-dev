const { Sequelize } = require('sequelize');
const db = require('./src/models');

// Sample review texts for different ratings
const reviewTexts = {
  5: [
    "Absolutely amazing! The property exceeded all our expectations. It was spotlessly clean, beautifully furnished, and had everything we needed for a comfortable stay. The host was incredibly helpful and responsive. Would definitely stay here again!",
    "What a fantastic experience! The place was perfect in every way - amazing location, stunning views, and all the amenities we could ask for. The host went above and beyond to make our stay special. Highly recommend!",
    "This was the best Airbnb experience I've ever had! The property is even more beautiful than the pictures show. Everything was immaculate, and the host was so welcoming and attentive. Can't wait to come back!",
    "We had a wonderful stay! The property is in a perfect location, within walking distance to great restaurants and attractions. The space was clean, comfortable, and stylishly decorated. The host was very communicative and provided excellent recommendations.",
    "Five stars all around! The place was pristine, comfortable, and had everything we needed. Check-in was seamless, and the host was incredibly responsive and helpful. Would book again in a heartbeat!"
  ],
  4: [
    "We had a great stay at this property. The location was perfect, and the space was comfortable and clean. The host was responsive and helpful. A few minor maintenance issues, but nothing that affected our enjoyment of the stay.",
    "Very nice place in a convenient location. The property was clean and well-equipped with most of what we needed. The host was friendly and provided good information. Just a few small things could be improved, but overall a great experience.",
    "We enjoyed our stay here. The property was spacious and in a good location. The host was communicative and check-in was easy. Some furnishings could use updating, but it was comfortable and met our needs.",
    "Good experience overall. The property was clean and the location was excellent. The host responded quickly to our questions. A few more kitchen supplies would have been helpful, but we managed fine.",
    "Nice property with good amenities. The location was convenient and the host was friendly. The bathroom could use some updating, but everything was functional and clean. Would consider staying again."
  ],
  3: [
    "The property was okay. Good location and the basics were covered, but there were some cleanliness issues and a few things in need of repair. The host was responsive when we reached out about problems.",
    "Average stay. The location was good, and check-in was easy. The property could use some updating and deeper cleaning. The host was nice but slow to respond to messages.",
    "Mixed experience. The property looked mostly like the photos but was smaller than expected. Some amenities didn't work properly. The host was polite but didn't resolve all our concerns.",
    "Decent place for the price. The location was convenient, but the property showed signs of wear and tear. Cleanliness was acceptable but not outstanding. Host communication was adequate.",
    "The property met our basic needs. The location was good, but the furnishings were dated and some things didn't work properly. The host eventually addressed our concerns but not immediately."
  ],
  2: [
    "Disappointed with our stay. The property wasn't as clean as expected, and several things weren't working properly. The host was difficult to reach when we had issues.",
    "Below average experience. The property didn't match the photos well, and there were cleanliness issues throughout. The host wasn't very helpful when we reported problems.",
    "Not what we expected. The location was okay, but the property needs significant updating and better cleaning. The host seemed uninterested in addressing our concerns.",
    "Wouldn't stay again. The property had numerous issues including broken fixtures and inadequate supplies. Cleanliness was a problem, and the host was defensive when we brought up issues.",
    "Unsatisfactory stay. The property had maintenance and cleanliness problems. The host was responsive but didn't resolve the issues. Wouldn't recommend."
  ],
  1: [
    "Terrible experience. The property was dirty and in disrepair. Many amenities didn't work, and the host was unresponsive to our complaints. Would not recommend under any circumstances.",
    "Worst stay ever. The property was nothing like the photos - it was dirty, damaged, and poorly maintained. The host ignored our messages about serious issues. Stay away!",
    "Extremely disappointed. The property was unacceptably dirty with broken furniture and appliances. The host was unhelpful and dismissive of our legitimate concerns.",
    "Avoid this property. Nothing worked properly, cleanliness was a major issue, and the host was unreachable when we needed assistance. Complete waste of money.",
    "Horrible experience from start to finish. The property was dirty, smelly, and unsafe. The host refused to address serious problems. Had to find alternative accommodation."
  ]
};

// Host response templates for different rating categories
const hostResponses = {
  positive: [
    "Thank you so much for your wonderful review! We're delighted that you enjoyed your stay and appreciated the property. We put a lot of effort into making sure our guests have everything they need for a comfortable visit. We'd love to welcome you back anytime!",
    "We're thrilled to hear you had such a positive experience! Thank you for being such great guests and for taking the time to share your feedback. Your kind words mean a lot to us. Hope to see you again soon!",
    "What a lovely review - thank you! We're so happy that you enjoyed the property and had a good stay. It was a pleasure hosting you, and we hope you'll come back and visit again in the future!",
    "Thank you for your fantastic review! We're delighted that you enjoyed your stay with us. We strive to provide a comfortable and welcoming experience for all our guests, and we're glad we could do that for you. You're welcome back anytime!"
  ],
  neutral: [
    "Thank you for taking the time to leave a review. We appreciate your feedback about the aspects you enjoyed, and we've noted your suggestions for improvement. We're constantly working to enhance our guests' experience, and your input helps us do that. We hope to have the opportunity to host you again and provide an even better experience.",
    "We appreciate your honest feedback. Thank you for highlighting both the positives and the areas where we can improve. We've taken note of your comments and will be addressing them. We hope you'll give us another chance to impress you in the future.",
    "Thank you for your review and for choosing our property. We're sorry that your stay wasn't perfect, and we appreciate you bringing these issues to our attention. We're always working to improve, and your feedback is valuable in helping us do that. We hope to have the opportunity to provide you with a better experience next time."
  ],
  negative: [
    "Thank you for your feedback. We're truly sorry that your experience didn't meet your expectations. We would have appreciated the opportunity to address your concerns during your stay. We take all guest feedback seriously and will use your comments to make improvements. If you'd like to discuss your experience further, please feel free to contact us directly.",
    "We're disappointed to hear that your stay was not satisfactory, and we apologize for the issues you experienced. Our property typically receives positive reviews, so we're surprised by your experience. We wish you had contacted us during your stay so we could have addressed these concerns immediately. We'll be looking into the points you've raised to ensure they're resolved for future guests.",
    "We apologize that your experience didn't meet our usual standards. We take pride in our property and the service we provide, so we're sorry to hear about these issues. We would have welcomed the chance to address your concerns during your stay. We'll be reviewing the points you've mentioned to improve our offerings. Thank you for your feedback."
  ]
};

// Generate a random integer between min and max (inclusive)
const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Get a random item from an array
const getRandomItem = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

// Determine response category based on rating
const getResponseCategory = (rating) => {
  if (rating >= 4) return 'positive';
  if (rating >= 3) return 'neutral';
  return 'negative';
};

// Generate random review data
const generateReviewData = async () => {
  try {
    console.log('Connecting to database...');
    await db.sequelize.authenticate();
    console.log('Connection established successfully.');

    // Get all completed bookings that don't have reviews yet
    console.log('Fetching completed bookings without reviews...');
    const completedBookings = await db.Booking.findAll({
      where: {
        status: 'completed',
        checkOut: {
          [Sequelize.Op.lt]: new Date() // Only past checkouts
        },
        // Make sure there's no review for this booking yet
        id: {
          [Sequelize.Op.notIn]: Sequelize.literal('(SELECT "bookingId" FROM "Reviews")')
        }
      },
      include: [
        {
          model: db.User,
          as: 'guest',
          attributes: ['id']
        },
        {
          model: db.Listing,
          as: 'listing',
          attributes: ['id', 'hostId']
        }
      ]
    });

    if (completedBookings.length === 0) {
      console.log('No eligible bookings found for review generation.');
      return;
    }

    console.log(`Found ${completedBookings.length} eligible bookings for review generation.`);

    // Create reviews for each eligible booking
    const reviews = [];
    for (const booking of completedBookings) {
      // 80% chance of having a review
      if (Math.random() < 0.8) {
        // Generate guest review of the property (host)
        const guestRating = getRandomInt(1, 5);
        
        // Time after checkout when the review was left (1-14 days)
        const daysAfterCheckout = getRandomInt(1, 14);
        const reviewDate = new Date(booking.checkOut);
        reviewDate.setDate(reviewDate.getDate() + daysAfterCheckout);
        
        // If the reviewDate is in the future, skip this review
        if (reviewDate > new Date()) continue;
        
        const guestReview = {
          bookingId: booking.id,
          reviewerId: booking.guestId,
          reviewedId: booking.listing.hostId,
          rating: guestRating,
          comment: getRandomItem(reviewTexts[guestRating]),
          type: 'host', // Guest reviewing host
          isPublic: true,
          createdAt: reviewDate,
          updatedAt: reviewDate
        };
        
        // 70% chance of host responding to the review
        if (Math.random() < 0.7) {
          // Host responds 1-5 days after the review
          const daysAfterReview = getRandomInt(1, 5);
          const responseDate = new Date(reviewDate);
          responseDate.setDate(responseDate.getDate() + daysAfterReview);
          
          // If the responseDate is in the future, don't add a response
          if (responseDate <= new Date()) {
            const responseCategory = getResponseCategory(guestRating);
            guestReview.response = getRandomItem(hostResponses[responseCategory]);
            guestReview.responseDate = responseDate;
          }
        }
        
        reviews.push(guestReview);
        
        // Host review of the guest (60% chance if guest left a review)
        if (Math.random() < 0.6) {
          // Host rating tends to be higher (3-5) because hosts are less likely to leave negative reviews
          const hostRating = getRandomInt(3, 5);
          
          // Host typically reviews within 1-10 days after checkout
          const hostReviewDays = getRandomInt(1, 10);
          const hostReviewDate = new Date(booking.checkOut);
          hostReviewDate.setDate(hostReviewDate.getDate() + hostReviewDays);
          
          // If the hostReviewDate is in the future, skip this review
          if (hostReviewDate > new Date()) continue;
          
          const hostReview = {
            bookingId: booking.id,
            reviewerId: booking.listing.hostId,
            reviewedId: booking.guestId,
            rating: hostRating,
            comment: getRandomItem(reviewTexts[hostRating]),
            type: 'guest', // Host reviewing guest
            isPublic: true,
            createdAt: hostReviewDate,
            updatedAt: hostReviewDate
          };
          
          reviews.push(hostReview);
        }
      }
    }

    if (reviews.length === 0) {
      console.log('No reviews generated. All eligible bookings might have future review dates.');
      return;
    }

    console.log(`Generated ${reviews.length} reviews. Saving to database...`);

    // Bulk insert reviews
    const createdReviews = await db.Review.bulkCreate(reviews);
    
    console.log(`Successfully created ${createdReviews.length} reviews.`);
    
    // Update host average ratings
    console.log('Updating host average ratings...');
    const uniqueHostIds = [...new Set(reviews
      .filter(r => r.type === 'host')
      .map(r => r.reviewedId))];
    
    for (const hostId of uniqueHostIds) {
      const stats = await db.Review.findAll({
        where: { 
          reviewedId: hostId, 
          type: 'host',
          deletedAt: null
        },
        attributes: [
          [Sequelize.fn('AVG', Sequelize.col('rating')), 'avgRating'],
          [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
        ]
      });
      
      const { avgRating, count } = stats[0].dataValues;
      await db.User.update(
        { 
          averageRating: avgRating || 0,
          reviewCount: count || 0
        },
        { where: { id: hostId } }
      );
    }
    
    console.log('Host average ratings updated successfully.');
    console.log('Review generation completed successfully!');
  } catch (error) {
    console.error('Error generating reviews:', error);
  } finally {
    // Close the database connection
    await db.sequelize.close();
    console.log('Database connection closed.');
  }
};

// Run the script
generateReviewData(); 