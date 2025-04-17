const User = require('../models/User');
const appConfig = require('../config/app');

/**
 * Shows the login page
 */
exports.showLogin = (req, res) => {
  res.render('login', {
    title: 'Login to Skydea',
    basePath: appConfig.appBasePath,
    error: req.session.error,
    success: req.session.success
  });
  
  // Clear session messages
  delete req.session.error;
  delete req.session.success;
};

/**
 * Shows the registration page
 */
exports.showRegister = (req, res) => {
  res.render('register', {
    title: 'Register for Skydea',
    basePath: appConfig.appBasePath,
    error: req.session.error,
    success: req.session.success
  });
  
  // Clear session messages
  delete req.session.error;
  delete req.session.success;
};

/**
 * Process user registration
 */
exports.register = async (req, res) => {
  try {
    console.log('Register form submitted with data:', req.body);
    const { username, email, password, confirmPassword, googleMapsApiKey } = req.body;
    
    // Input validation
    if (!username || !email || !password || !confirmPassword) {
      req.session.error = 'All fields are required';
      console.log('Validation error: All fields are required');
      return res.redirect('/auth/register');
    }
    
    if (password !== confirmPassword) {
      req.session.error = 'Passwords do not match';
      console.log('Validation error: Passwords do not match');
      return res.redirect('/auth/register');
    }
    
    if (password.length < 6) {
      req.session.error = 'Password must be at least 6 characters long';
      console.log('Validation error: Password must be at least 6 characters long');
      return res.redirect('/auth/register');
    }
    
    // Create user
    console.log('Attempting to create user with:', { username, email, googleMapsApiKey });
    const user = await User.create({ 
      username, 
      email, 
      password, 
      google_maps_api_key: googleMapsApiKey || null 
    });
    console.log('User created successfully:', user);
    
    req.session.success = 'Registration successful! You can now log in.';
    return res.redirect('/auth/login');
  } catch (error) {
    console.error('Registration error:', error);
    req.session.error = error.message || 'An error occurred during registration';
    console.log('Setting error message in session:', req.session.error);
    return res.redirect('/auth/register');
  }
};

/**
 * Process user login
 */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Input validation
    if (!username || !password) {
      req.session.error = 'Username and password are required';
      return res.redirect('/auth/login');
    }
    
    // Authenticate user
    const user = await User.authenticate(username, password);
    
    if (!user) {
      req.session.error = 'Invalid username or password';
      return res.redirect('/auth/login');
    }
    
    // Store user in session
    req.session.user = user;
    req.session.isAuthenticated = true;
    
    return res.redirect('/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    req.session.error = 'An error occurred during login';
    return res.redirect('/auth/login');
  }
};

/**
 * Logout the user
 */
exports.logout = (req, res) => {
  // Destroy the session
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/');
  });
};