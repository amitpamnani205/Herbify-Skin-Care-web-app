const express = require("express");
const router = express.Router();
const landingController = require("../controller/landing.js")

router
    .route("/")
    .get(landingController.renderIndex)

router
    .route("/abour")
    .get(landingController.renderAbout)

router 
    .route("/blog")
    .get(landingController.renderBlog)

router.
    route("/testimonial")
    .get(landingController.renderTestimonial)


module.exports = router
