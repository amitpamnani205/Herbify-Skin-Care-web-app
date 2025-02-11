const renderIndex = ("/", (req, res) => {
    res.render("landing/index.ejs");
});

const renderAbout = ("/about", (req, res) => {
    res.render("landing/about.ejs");
});

const renderBlog = ("/blog", (req, res) => {
    res.render("landing/blog.ejs");
});

const renderTestimonial = ("/testimonial", (req, res) => {
    res.render("landing/testimonial.ejs");
});


const render404 = ("*", (req, res) => {
    res.render("landing/404.ejs");
});

module.exports = { renderIndex,renderAbout,renderBlog,renderTestimonial,render404 };