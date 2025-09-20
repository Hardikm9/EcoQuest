"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import emailjs from "@emailjs/browser";

export default function Home() {
  const form = useRef();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      errors.email = "Please enter a valid email";
    }
    if (!formData.message.trim()) errors.message = "Message is required";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const sendEmail = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    emailjs
      .sendForm('service_v5kg6b4', 'template_9edhdyc', form.current, {
        publicKey: 'xD8MHtq83T1HvZ5BY',
      })
      .then(
        () => {
          setSubmitStatus("success");
          setFormData({ name: "", email: "", message: "" });
          setTimeout(() => setSubmitStatus(null), 3000);
        },
        (error) => {
          console.log('FAILED...', error.text);
          setSubmitStatus("error");
        },
      )
      .finally(() => {
        setIsSubmitting(false);
      });
  };
  
  useEffect(() => {
    // Navbar scroll effect
    const navbar = document.querySelector(".navbar");
    const handleScroll = () => {
      if (window.scrollY > 50) {
        navbar?.classList.add("scrolled");
      } else {
        navbar?.classList.remove("scrolled");
      }
    };

    window.addEventListener("scroll", handleScroll);

    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
    const navLinks = document.querySelector(".nav-links");
    const navActions = document.querySelector(".nav-actions");

    const handleMobileMenu = () => {
      navLinks?.classList.toggle("active");
      navActions?.classList.toggle("active");
    };

    mobileMenuBtn?.addEventListener("click", handleMobileMenu);

    const testimonialSlider = document.querySelector(".testimonials-slider");
    let isDown = false;
    let startX;
    let scrollLeft;

    const mouseDown = (e) => {
      if (!testimonialSlider) return;
      isDown = true;
      startX = e.pageX - testimonialSlider.offsetLeft;
      scrollLeft = testimonialSlider.scrollLeft;
    };

    const mouseLeave = () => (isDown = false);
    const mouseUp = () => (isDown = false);

    const mouseMove = (e) => {
      if (!isDown || !testimonialSlider) return;
      e.preventDefault();
      const x = e.pageX - testimonialSlider.offsetLeft;
      const walk = (x - startX) * 2;
      testimonialSlider.scrollLeft = scrollLeft - walk;
    };

    if (testimonialSlider) {
      testimonialSlider.addEventListener("mousedown", mouseDown);
      testimonialSlider.addEventListener("mouseleave", mouseLeave);
      testimonialSlider.addEventListener("mouseup", mouseUp);
      testimonialSlider.addEventListener("mousemove", mouseMove);
    }

    // Animation on scroll
    function initScrollAnimations() {
      const animatedElements = document.querySelectorAll(
        ".feature-card, .course-card, .testimonial"
      );

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.style.opacity = "1";
              entry.target.style.transform = "translateY(0)";
            }
          });
        },
        { threshold: 0.1 }
      );

      animatedElements.forEach((element) => {
        element.style.opacity = "0";
        element.style.transform = "translateY(20px)";
        element.style.transition = "opacity 0.5s ease, transform 0.5s ease";
        observer.observe(element);
      });
    }

    initScrollAnimations();

    // Cleanup
    return () => {
      window.removeEventListener("scroll", handleScroll);
      mobileMenuBtn?.removeEventListener("click", handleMobileMenu);
      if (testimonialSlider) {
        testimonialSlider.removeEventListener("mousedown", mouseDown);
        testimonialSlider.removeEventListener("mouseleave", mouseLeave);
        testimonialSlider.removeEventListener("mouseup", mouseUp);
        testimonialSlider.removeEventListener("mousemove", mouseMove);
      }
    };
  }, []);

  return (
    <div className="landing-page">
      {/* Smart Floating Icons Animation */}
      <div className="floating-leaves">
        <span className="leaf-float" style={{ left: "8%", top: "20%" }}>
          🍃
        </span>
        <span
          className="leaf-float-delayed"
          style={{ left: "18%", top: "60%" }}
        >
          🍀
        </span>
        <span className="leaf-float-slow" style={{ left: "78%", top: "30%" }}>
          🌿
        </span>
        <span className="leaf-float-fast" style={{ left: "65%", top: "75%" }}>
          🍃
        </span>
        <span className="icon-float" style={{ left: "35%", top: "40%" }}>
          💧
        </span>
        <span
          className="icon-float-delayed"
          style={{ left: "85%", top: "15%" }}
        >
          ☀️
        </span>
        <span className="eco-float" style={{ left: "55%", top: "55%" }}>
          ♻️
        </span>
        <span className="eco-float-delayed" style={{ left: "25%", top: "75%" }}>
          🌎
        </span>
        <span className="star-float" style={{ left: "15%", top: "35%" }}>
          ⭐
        </span>
        <span
          className="star-float-delayed"
          style={{ left: "85%", top: "65%" }}
        >
          🌟
        </span>
        <span className="star-float-fast" style={{ left: "45%", top: "15%" }}>
          ✨
        </span>
        <span className="star-float-slow" style={{ left: "75%", top: "85%" }}>
          💫
        </span>
      </div>

      {/* Navigation */}
      <nav className="navbar">
        <div className="container navbar-container">
          <Link to="/" className="logo">
            <span className="logo-icon">🌱</span>
            <span className="logo-text">EcoLearn</span>
          </Link>
          <ul className="nav-links">
            <li>
              <Link to="/" className="nav-link">
                Home
              </Link>
            </li>
            <li>
              <Link to="/login" className="nav-link">
                Courses
              </Link>
            </li>
            <li>
              <Link to="/about" className="nav-link">
                About
              </Link>
            </li>
            <li>
              <Link to="/login" className="nav-link">
                Community
              </Link>
            </li>
            <li>
              <Link to="/contact" className="nav-link">
                Contact
              </Link>
            </li>
          </ul>
          <div className="nav-actions">
            <Link to="/login" className="btn btn-outline">
              Login
            </Link>
            <Link to="/register" className="btn btn-primary">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero hero-section">
        <div className="container hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Learn. Play. Earn ecoPoints. Make an impact.
            </h1>
            <p className="hero-description">
              Join our community of eco-warriors and transform your knowledge
              into action. Our gamified platform makes sustainability education
              engaging and rewarding.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary btn-large">
                Start Learning
              </Link>
              <Link to="/login" className="btn btn-outline btn-large">
                Explore Courses
              </Link>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">10K+</span>
                <span className="stat-label">Active Learners</span>
              </div>
              <div className="stat">
                <span className="stat-number">500+</span>
                <span className="stat-label">Courses</span>
              </div>
              <div className="stat">
                <span className="stat-number">50K+</span>
                <span className="stat-label">ecoPoints Earned</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="section">
        <div className="container">
          <div className="section-title">
            <h2>Why Choose EcoLearn?</h2>
            <p>
              Our innovative approach to sustainability education combines
              learning with real-world impact.
            </p>
          </div>
          <div className="features">
            <div className="feature-card">
              <div className="feature-icon">🎮</div>
              <h3 className="feature-title">Gamified Learning</h3>
              <p className="feature-description">
                Unlock badges, climb leaderboards, and compete in eco challenges
                to make learning fun and engaging.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👨‍🏫</div>
              <h3 className="feature-title">Learn by Doing</h3>
              <p className="feature-description">
                Courses with materials, quizzes, and assignments guided by
                expert teachers and environmental specialists.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌍</div>
              <h3 className="feature-title">Make an Impact</h3>
              <p className="feature-description">
                Convert your ecoPoints into real-world actions like tree
                planting or beach cleanups through our partners.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="section about about-section">
        <div className="container about-container">
          <div className="about-content">
            <h2 className="about-title">
              Transforming Education for a Sustainable Future
            </h2>
            <p className="about-description">
              EcoLearn was founded in 2020 with a mission to make sustainability
              education accessible, engaging, and impactful for everyone. We
              believe that learning about our planet should be as exciting as it
              is important.
            </p>
            <p className="about-description">
              Our platform combines cutting-edge educational technology with
              gamification elements to create an immersive learning experience
              that drives real behavior change.
            </p>
            <div className="about-stats">
              <div className="stat about-stat">
                <div className="stat-number about-stat-number">95%</div>
                <div className="stat-label about-stat-label">
                  Completion Rate
                </div>
              </div>
              <div className="stat about-stat">
                <div className="stat-number about-stat-number">87%</div>
                <div className="stat-label about-stat-label">
                  Reported Behavior Change
                </div>
              </div>
              <div className="stat about-stat">
                <div className="stat-number about-stat-number">15</div>
                <div className="stat-label about-stat-label">
                  Environmental Partners
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="section">
        <div className="container">
          <div className="section-title">
            <h2>Popular Courses</h2>
            <p>
              Explore our most popular sustainability courses and start your
              eco-journey today.
            </p>
          </div>
          <div className="courses-grid">
            <div className="course-card">
              <div className="course-image">Climate Science Basics</div>
              <div className="course-content">
                <h3 className="course-title">Climate Science Basics</h3>
                <p className="course-description">
                  Understand the fundamentals of climate change and its impacts
                  on our planet.
                </p>
                <div className="course-meta">
                  <span className="course-level">Beginner</span>
                  <span className="course-rating">★★★★★ (4.9)</span>
                </div>
              </div>
            </div>
            <div className="course-card">
              <div className="course-image">Sustainable Living</div>
              <div className="course-content">
                <h3 className="course-title">Sustainable Living</h3>
                <p className="course-description">
                  Learn practical ways to reduce your environmental footprint in
                  daily life.
                </p>
                <div className="course-meta">
                  <span className="course-level">Intermediate</span>
                  <span className="course-rating">★★★★☆ (4.7)</span>
                </div>
              </div>
            </div>
            <div className="course-card">
              <div className="course-image">Renewable Energy</div>
              <div className="course-content">
                <h3 className="course-title">Renewable Energy</h3>
                <p className="course-description">
                  Explore the technologies powering our transition to a clean
                  energy future.
                </p>
                <div className="course-meta">
                  <span className="course-level">Advanced</span>
                  <span className="course-rating">★★★★★ (4.8)</span>
                </div>
              </div>
            </div>
          </div>
          <div className="view-all-button">
            <Link to="/login" className="btn btn-primary">
              View All Courses
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section testimonials testimonials-section">
        <div className="container testimonials-container">
          <div className="section-title">
            <h2>What Our Learners Say</h2>
            <p>
              Join thousands of satisfied learners who have transformed their
              understanding of sustainability.
            </p>
          </div>
          <div className="testimonials-slider">
            <div className="testimonial">
              <div className="testimonial-content">
                <p className="testimonial-text">
                  "EcoLearn made understanding complex environmental issues so
                  engaging. The gamification elements kept me motivated
                  throughout the courses!"
                </p>
              </div>
              <div className="testimonial-author">
                <div className="author-avatar">JD</div>
                <div className="author-info">
                  <h4 className="author-name">Jane Doe</h4>
                  <p className="author-title">Environmental Science Student</p>
                </div>
              </div>
            </div>
            <div className="testimonial">
              <div className="testimonial-content">
                <p className="testimonial-text">
                  "I've been able to implement so many sustainable practices at
                  home thanks to EcoLearn. The courses are practical and
                  immediately applicable."
                </p>
              </div>
              <div className="testimonial-author">
                <div className="author-avatar">JS</div>
                <div className="author-info">
                  <h4 className="author-name">John Smith</h4>
                  <p className="author-title">Homeowner & Parent</p>
                </div>
              </div>
            </div>
            <div className="testimonial">
              <div className="testimonial-content">
                <p className="testimonial-text">
                  "As a teacher, I've incorporated EcoLearn into my curriculum.
                  My students are more engaged than ever with environmental
                  topics!"
                </p>
              </div>
              <div className="testimonial-author">
                <div className="author-avatar">ES</div>
                <div className="author-info">
                  <h4 className="author-name">Emma Wilson</h4>
                  <p className="author-title">High School Teacher</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="contact">
        <div className="container">
          <div className="section-title">
            <h2>Get In Touch</h2>
            <p>Have questions or want to learn more? Reach out to our team.</p>
          </div>

          <div className="contact-container">
            <div className="contact-form">
              <form ref={form} className="form" onSubmit={sendEmail}>
                <input type="hidden" name="title" value="Feedback" />

                <div className="form-group">
                  <label htmlFor="name" className="form-label">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your name"
                    className="form-input"
                    required
                  />
                  {formErrors.name && (
                    <div className="error-message">{formErrors.name}</div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Your email"
                    className="form-input"
                    required
                  />
                  {formErrors.email && (
                    <div className="error-message">{formErrors.email}</div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="message" className="form-label">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Your message"
                    className="form-input textarea"
                    required
                  ></textarea>
                  {formErrors.message && (
                    <div className="error-message">{formErrors.message}</div>
                  )}
                </div>

                <input type="hidden" name="time" value={new Date().toLocaleString()} />

                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>

                {submitStatus === "success" && (
                  <div className="success-message">
                    Message sent successfully!
                  </div>
                )}
                {submitStatus === "error" && (
                  <div className="error-message">
                    There was an error sending your message. Please try again.
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-container">
          <div className="footer-col">
            <h3 className="footer-title">EcoLearn</h3>
            <p className="footer-text">
              Making sustainability education engaging, accessible, and
              impactful for everyone.
            </p>
            <div className="footer-social">
              <a href="#" className="social-icon">
                f
              </a>
              <a href="#" className="social-icon">
                t
              </a>
              <a href="#" className="social-icon">
                in
              </a>
              <a href="#" className="social-icon">
                ig
              </a>
            </div>
          </div>
          <div className="footer-col">
            <h3 className="footer-title">Quick Links</h3>
            <ul className="footer-list">
              <li>
                <Link to="/" className="footer-link">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/" className="footer-link">
                  Courses
                </Link>
              </li>
              <li>
                <Link to="/" className="footer-link">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/" className="footer-link">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <h3 className="footer-title">Resources</h3>
            <ul className="footer-list">
              <li>
                <a href="#" className="footer-link">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="footer-link">
                  FAQ
                </a>
              </li>
              <li>
                <a href="#" className="footer-link">
                  Support Center
                </a>
              </li>
              <li>
                <a href="#" className="footer-link">
                  Partnerships
                </a>
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <h3 className="footer-title">Newsletter</h3>
            <p className="footer-text">
              Subscribe to our newsletter for the latest updates and eco-tips.
            </p>
            <form className="newsletter-form">
              <div className="form-group">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="newsletter-input"
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Subscribe
              </button>
            </form>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="copyright-text">
            &copy; {new Date().getFullYear()} EcoLearn. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}