//Node.js cafe web application
//Author: Chathuni Wahalathantri
//Date created: 14 February 2024
//Updated: May 27, 2025 (Added user/product management, email as user key, menu table, custom food_type)

// Include required modules
var express = require('express');
var app = express();
var session = require('express-session');
var conn = require('./dbConfig');
var bodyParser = require('body-parser');

console.log('Starting application...');

// Set up EJS as the view engine
app.set('view engine', 'ejs');
console.log('View engine set to EJS');

// Set up session middleware
app.use(session({
    secret: 'yoursecret',
    resave: true,
    saveUninitialized: true
}));
console.log('Session middleware configured');

// Handle JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
console.log('JSON and URL-encoded parsers enabled');

// Serve static files from /public
app.use('/public', express.static('public'));
console.log('Static files served from /public');

// Body parser middleware for form data
app.use(bodyParser.urlencoded({ extended: false }));
console.log('Body parser middleware configured');


// Admin authentication middleware
const isAdmin = (req, res, next) => {
    console.log('Checking admin authentication:', {
        loggedin: req.session.loggedin,
        role: req.session.role
    });

    if (req.session.loggedin && req.session.role === 'ITadmin') {
        return next();
    }

    console.log('Admin authentication failed, sending error response');

    res.send(`
        <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
            <h2>❌ Access Denied</h2>
            <p>You must <strong>login as an ITadmin</strong> to view this page.</p>
            <a href="/login" style="padding: 10px 20px; background-color: #007bff; color: white; border-radius: 5px; text-decoration: none;">← Back to Login Page</a>
        </div>
    `);
};


// Home route
app.get('/', function(req, res) {
    console.log('Entering / route');
    res.render('home');
    console.log('Rendered home view');
});

// Login route
app.get('/login', function(req, res) {
    console.log('Entering /login route');
    res.render('login');
    console.log('Rendered login view');
});

// Register route (GET)
app.get('/register', function(req, res) {
    console.log('Entering /register GET route');
    res.render('register', { title: 'Register' });
    console.log('Rendered register view');
});

// Register route (POST)
app.post('/register', function(req, res) {
    console.log('Entering /register POST route', req.body);
    let username = req.body.username;
    let email = req.body.email;
    let password = req.body.password;
    if (username && email && password) {
        const sql = `INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'customer')`;
        console.log('Executing query:', sql, [username, email, password]);
        conn.query(sql, [username, email, password], function(err, result) {
            if (err) {
                console.error('Query error:', err);
                if (err.code === 'ER_DUP_ENTRY') {
                    console.log('Duplicate email detected');
                    return res.send('A user with this email already exists!');
                }
                return res.status(500).send('Server Error');
            }
            console.log('Query result: Record inserted', result);
            res.render('login');
            console.log('Rendered login view');
        });
    } else {
        console.log('Missing required fields:', req.body);
        res.send('Please enter all required fields!');
    }
});

// Authentication route
app.post('/auth', function(req, res) {
    console.log('Entering /auth route', req.body);
    let email = req.body.email;
    let password = req.body.password;
    if (email && password) {
        const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';
        console.log('Executing query:', sql, [email, password]);
        conn.query(sql, [email, password], function(error, results, fields) {
            if (error) {
                console.error('Query error:', error);
                return res.status(500).send('Server Error');
            }
            console.log('Query result:', results);
            if (results.length > 0) {
                req.session.loggedin = true;
                req.session.email = email;
                req.session.role = results[0].role;
                console.log('User authenticated:', { role: results[0].role, username: results[0].username });
                res.redirect('/memberplayerOnly');
                console.log('Redirecting to /memberplayerOnly');
            } else {
                console.log('Authentication failed: Incorrect email/password');
                res.send('Incorrect Email and/or Password!');
            }
        });
    } else {
        console.log('Missing email or password');
        res.send('Please enter Email and Password!');
    }
});


    // Memberplayer-only route (admin, customer, or guest) include Court Booking View for guestplayer
     app.get('/memberplayerOnly', (req, res) => {
    if (!req.session.loggedin) {
        console.log('Not logged in, sending error response');
        return res.send('Please login to view this page!');
    }

    const email = req.session.email;
    const role = req.session.role;

    const today = new Date();
    const selectedDate = today.toISOString().split('T')[0];
    const selectedTime = '18:00'; // 6 PM

    // Generate 7-day date range
    const dateOptions = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dateOptions.push(date.toISOString().split('T')[0]);
    }

    // Generate time slots from 6PM to 12MN
    const timeOptions = [];
    for (let hour = 18; hour <= 23; hour++) {
        timeOptions.push(hour.toString().padStart(2, '0') + ':00');
    }

    // Fetch user ID first
    const getUserSql = 'SELECT userid FROM users WHERE email = ?';
    conn.query(getUserSql, [email], (errUser, userRes) => {
        if (errUser) {
            console.error('Error fetching userid:', errUser);
            return res.status(500).send('Server Error');
        }

        if (userRes.length === 0) {
            return res.status(404).send('User not found');
        }

        const userid = userRes[0].userid;

        // Prepare court availability check
        const courtStatus = {};
        const courts = ['Court 1', 'Court 2', 'Court 3'];
        let pendingQueries = courts.length;

        courts.forEach(court => {
            const sql = 'SELECT date, time FROM booking WHERE court = ? AND date IN (?)';
            conn.query(sql, [court, dateOptions], (err, results) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).send('Server Error');
                }

                const slotsByDate = {};
                results.forEach(row => {
                    const date = row.date;
                    slotsByDate[date] = slotsByDate[date] || [];
                    slotsByDate[date].push(row.time);
                });

                const fullyBooked = dateOptions.every(date =>
                    (slotsByDate[date] || []).length >= timeOptions.length
                );

                courtStatus[court] = fullyBooked ? 'fullyBooked' : 'available';

                pendingQueries--;
                if (pendingQueries === 0) {
                    // All availability checks complete
                    if (role === 'memberplayer') {
                        res.render('memberplayerOnly', {
                            memberplayerEmail: email,
                            userid: userid,
                            selectedDate,
                            selectedTime,
                            dateOptions,
                            timeOptions,
                            courtStatus
                        });
                        console.log('Rendered memberplayerOnly view with court status');
                    } else if (role === 'ITadmin') {
                        res.render('ITadminOnly', {
                            adminEmail: email
                        });
                        console.log('Rendered ITadminOnly view for ITadmin');
                    } else {
                        res.render('guestplayerOnly', {
                            guestplayerEmail: email,
                            guestplayerUserId: userid,
                            courtStatus,
                            selectedDate,
                            selectedTime,
                            dateOptions,
                            timeOptions
                        });
                        console.log('Rendered guestplayerOnly view for guestplayer');
                    }
                }
            });
        });
    });
});


// ITAdmin redirect route
app.get('/ITadmin', isAdmin, (req, res) => {
    console.log('Entering /ITadmin route, redirecting to /memberplayerOnly');
    res.redirect('/memberplayerOnly');
});

// User Management route
app.get('/ITadmin/user-management', isAdmin, (req, res) => {
    console.log('Entering /ITadmin/user-management route');
    const sql = 'SELECT email, username, role FROM users';
    console.log('Executing query:', sql);
    conn.query(sql, (err, users) => {
        if (err) {
            console.error('Query error:', err);
            return res.status(500).send('Server Error');
        }
        console.log('Query result: Fetched users', users);
        const roles = [
            { name: 'ITadmin' },
            { name: 'memberplayer' },
            { name: 'guestplayer' }
        ];
        const error = req.query.error;
        res.render('userManagement', { users, roles, error });
        console.log('Rendered userManagement view', { error });
    });
});

// Add User route
app.post('/ITadmin/add-user', isAdmin, (req, res) => {
    console.log('Entering /ITadmin/add-user route', req.body);
    const { username, email, password, role } = req.body;
    if (username && email && password && role) {
        const checkSql = `SELECT email FROM users WHERE email = ?`;
        console.log('Executing check query:', checkSql, [email]);
        conn.query(checkSql, [email], (err, results) => {
            if (err) {
                console.error('Check query error:', err);
                return res.status(500).send('Server Error');
            }
            if (results.length > 0) {
                console.log('Duplicate email detected:', email);
                return res.redirect('/ITadmin/user-management?error=duplicate');
            }
            const sql = `INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)`;
            console.log('Executing insert query:', sql, [username, email, password, role]);
            conn.query(sql, [username, email, password, role], (err, result) => {
                if (err) {
                    console.error('Insert query error:', err);
                    if (err.code === 'ER_DUP_ENTRY') {
                        console.log('Duplicate email detected (race condition):', email);
                        return res.redirect('/ITadmin/user-management?error=duplicate');
                    }
                    return res.status(500).send('Server Error');
                }
                console.log('Query result: User added', { username, email, role });
                res.redirect('/ITadmin/user-management');
                console.log('Redirecting to /ITadmin/user-management');
            });
        });
    } else {
        console.log('Missing fields in add-user:', req.body);
        res.send('All fields are required!');
    }
});

// Edit User route
app.post('/ITadmin/edit-user/:email', isAdmin, (req, res) => {
    console.log('Entering /ITadmin/edit-user route', { email: req.params.email, body: req.body });
    const { username, role, password } = req.body;
    const email = req.params.email;
    if (username && role) {
        let sql, params;
        if (password) {
            // Update password if provided
            sql = `UPDATE users SET username = ?, role = ?, password = ? WHERE email = ?`;
            params = [username, role, password, email];
        } else {
            // Skip password update if not provided
            sql = `UPDATE users SET username = ?, role = ? WHERE email = ?`;
            params = [username, role, email];
        }
        console.log('Executing query:', sql, params);
        conn.query(sql, params, (err, result) => {
            if (err) {
                console.error('Query error:', err);
                return res.status(500).send('Server Error');
            }
            console.log('Query result: User updated', { email, username, role, passwordUpdated: !!password, affectedRows: result.affectedRows });
            res.redirect('/ITadmin/user-management');
            console.log('Redirecting to /ITadmin/user-management');
        });
    } else {
        console.log('Missing fields in edit-user:', req.body);
        res.send('All fields are required!');
    }
});

// Delete User route
app.get('/ITadmin/delete-user/:email', isAdmin, (req, res) => {
    console.log('Entering /ITadmin/delete-user route', { email: req.params.email });
    const email = req.params.email;
    const sql = `DELETE FROM users WHERE email = ?`;
    console.log('Executing query:', sql, [email]);
    conn.query(sql, [email], (err, result) => {
        if (err) {
            console.error('Query error:', err);
            return res.status(500).send('Server Error');
        }
        console.log('Query result: User deleted', { email, affectedRows: result.affectedRows });
        res.redirect('/ITadmin/user-management');
        console.log('Redirecting to /ITadmin/user-management');
    });
});


    // Product Management route
     app.get('/ITadmin/product-management', isAdmin, (req, res) => {
     console.log('Entering /ITadmin/product-management route');

    // Correct: Using "type AS category" so frontend can still refer to "category"
    const sql = 'SELECT id, name, price, type AS category FROM foods';
    console.log('Executing product query:', sql);

    conn.query(sql, (err, products) => {
        if (err) {
            console.error('Product query error:', err);
            return res.status(500).send('Server Error');
        }

        // Extract unique types (called "category" in EJS for consistency)
        const foodTypes = [...new Set(products.map(p => p.category).filter(Boolean))];
        const error = req.query.error || null;

        console.log('Query result: Fetched products and foodTypes');

        res.render('productManagement', {
            products: products,
            foodTypes: foodTypes,
            error: error
        });
    });
});


    // Add Product route
    app.post('/ITadmin/add-product', isAdmin, (req, res) => {
    console.log('Entering /ITadmin/add-product route', req.body);
    const { name, price, category, customCategory } = req.body;

    // Use custom category if "Other" was selected
    const finalType = category === 'Other' ? customCategory : category;

    if (name && price && finalType) {
        const checkSql = `SELECT name FROM foods WHERE name = ?`;
        console.log('Executing check query:', checkSql, [name]);

        conn.query(checkSql, [name], (err, results) => {
            if (err) {
                console.error('Check query error:', err);
                return res.status(500).send('Server Error');
            }

            if (results.length > 0) {
                console.log('Duplicate product name detected:', name);
                return res.redirect('/ITadmin/product-management?error=duplicate');
            }

    // ✅ Use "type" instead of "category"
            const insertSql = `INSERT INTO foods (name, price, type) VALUES (?, ?, ?)`;
            const values = [name, parseFloat(price), finalType];

            console.log('Executing insert query:', insertSql, values);

            conn.query(insertSql, values, (err, result) => {
                if (err) {
                    console.error('Insert query error:', err);
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.redirect('/ITadmin/product-management?error=duplicate');
                    }
                    return res.status(500).send('Server Error');
                }

                console.log('Product added:', {
                    name,
                    price,
                    type: finalType,
                    id: result.insertId
                });

                res.redirect('/ITadmin/product-management');
            });
        });
    } else {
        console.log('Missing fields in add-product:', req.body);
        res.send('All fields are required!');
    }
});


    // Edit Product route
    app.post('/ITadmin/edit-product/:id', isAdmin, (req, res) => {
    console.log('Entering /ITadmin/edit-product route', { id: req.params.id, body: req.body });

    const { name, price, category, customCategory } = req.body;
    const id = req.params.id;

    // If "Other" is selected, use custom category value
    const finalType = category === 'Other' ? customCategory : category;

    if (name && price && finalType) {
        const checkSql = `SELECT name FROM foods WHERE name = ? AND id != ?`;
        console.log('Executing check query:', checkSql, [name, id]);

        conn.query(checkSql, [name, id], (err, results) => {
            if (err) {
                console.error('Check query error:', err);
                return res.status(500).send('Server Error');
            }

            if (results.length > 0) {
                console.log('Duplicate product name detected:', name);
                return res.redirect('/ITadmin/product-management?error=duplicate');
            }

            // ✅ Corrected column: category → type
            const updateSql = `UPDATE foods SET name = ?, price = ?, type = ? WHERE id = ?`;
            const updateValues = [name, parseFloat(price), finalType, id];

            console.log('Executing update query:', updateSql, updateValues);

            conn.query(updateSql, updateValues, (err, result) => {
                if (err) {
                    console.error('Update query error:', err);
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.redirect('/ITadmin/product-management?error=duplicate');
                    }
                    return res.status(500).send('Server Error');
                }

                console.log('Product updated:', {
                    id,
                    name,
                    price,
                    type: finalType,
                    affectedRows: result.affectedRows
                });

                res.redirect('/ITadmin/product-management');
            });
        });
    } else {
        console.log('Missing fields in edit-product:', req.body);
        res.send('All fields are required!');
    }
});
    
    // Delete Product route
    app.get('/ITadmin/delete-product/:id', isAdmin, (req, res) => {
    const id = req.params.id;
    console.log('Entering /ITadmin/delete-product route', { id });

    const sql = `DELETE FROM foods WHERE id = ?`;

    console.log('Executing delete query:', sql, [id]);

    conn.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Delete query error:', err);
            return res.status(500).send('Server Error');
        }

        if (result.affectedRows === 0) {
            console.warn('No product found with id:', id);
            return res.redirect('/ITadmin/product-management?error=notfound');
        }

        console.log('Product deleted:', { id, affectedRows: result.affectedRows });

        res.redirect('/ITadmin/product-management');
    });
});


   // Make sure this is near your other route handlers (after db connection is set up)

   // Middleware to restrict access to ITadmin only
    function isITAdmin(req, res, next) {
    if (req.session.loggedin && req.session.role === 'ITadmin') {
    return next();
  }
    res.redirect('/login');
}

  // Route: View all confirmed orders from `confirmorder` table
   app.get('/view-orders', isITAdmin, (req, res) => {
   const sql = 'SELECT date, name, email, phone, amount FROM confirmorder ORDER BY date DESC';
   conn.query(sql, (err, results) => {
    if (err) {
      console.error('❌ Error querying confirmorder:', err.sqlMessage);
      return res.status(500).send('❌ Error retrieving orders from the database.');
    }

    // Render the view with orders
    res.render('ViewOrder', { orders: results });
       });
    });


    // ITAdmin view Booking
    app.get('/ITadmin/view-bookings', (req, res) => {
    const bookingQuery = `SELECT id, court, DATE_FORMAT(date, '%Y-%m-%d') AS date, TIME_FORMAT(time, '%H:%i') AS time FROM booking ORDER BY date, time, court`;

  conn.query(bookingQuery, (err, bookings) => {
    if (err) {
      console.error('Error fetching bookings:', err);
      return res.status(500).send('Database Error');
    }

    const bookedTimesMap = {};
    const fullyBookedDates = {};
    const fullyBookedCourts = new Set();

    const timeSlots = ['18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];

    // Populate booking map and detect full bookings
    bookings.forEach(b => {
      const { court, date, time } = b;

      // Build bookedTimesMap structure
      if (!bookedTimesMap[court]) bookedTimesMap[court] = {};
      if (!bookedTimesMap[court][date]) bookedTimesMap[court][date] = [];
      bookedTimesMap[court][date].push(time);

      // Track how many times are booked for each date per court
      if (!fullyBookedDates[court]) fullyBookedDates[court] = {};
      if (!fullyBookedDates[court][date]) fullyBookedDates[court][date] = new Set();
      fullyBookedDates[court][date].add(time);
    });

    // Analyze fully booked dates/courts
    const finalFullyBookedDates = {};

    for (let i = 1; i <= 3; i++) {
      const court = `Court ${i}`;
      finalFullyBookedDates[court] = [];

      const dates = fullyBookedDates[court] || {};
      for (const date in dates) {
        if (dates[date].size === timeSlots.length) {
          finalFullyBookedDates[court].push(date);
        }
      }

      if (finalFullyBookedDates[court].length >= 7) {
        fullyBookedCourts.add(court);
      }
    }

    res.render('ViewBookings', {
      bookings,
      fullyBookedDates: finalFullyBookedDates,
      fullyBookedCourts: Array.from(fullyBookedCourts),
      bookedTimesMap
    });
  });
});


    // Handle booking from Guest Player using court, date, and time 
app.post('/guestplayer/book-court', (req, res) => {
  const { court, date, time } = req.body;

  if (!court || !date || !time) {
    return res.status(400).send('Missing booking details');
  }

  const email = req.session.email;
  if (!email) {
    return res.status(401).send('Unauthorized. Please log in.');
  }

  // Step 1: Get userid using session email
  const getUserSql = 'SELECT userid FROM users WHERE email = ?';
  conn.query(getUserSql, [email], (err, userResult) => {
    if (err) {
      console.error('❌ Error fetching userid:', err);
      return res.status(500).send('Database error');
    }

    if (userResult.length === 0) {
      return res.status(404).send('User not found');
    }

    const userid = userResult[0].userid;

    // Step 2: Check for existing booking
    const checkSql = `SELECT COUNT(*) AS count FROM booking WHERE court = ? AND date = ? AND time = ?`;
    conn.query(checkSql, [court, date, time], (err, result) => {
      if (err) {
        console.error('❌ Error checking booking:', err);
        return res.status(500).send('Database error');
      }

      
    if (result[0].count > 0) {
  return res.send(`
    <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 80px;">
      <h2 style="color: #dc3545;">❌ Slot Already Booked!</h2>
      <p style="font-size: 18px; margin-top: 20px;">
        The slot for <strong>${court}</strong> on <strong>${date}</strong> at <strong>${time}</strong> is already booked.
      </p>
      
      <a href="javascript:history.back()" 
         style="display: inline-block; margin-top: 30px; padding: 12px 25px; font-size: 16px; font-weight: bold; border-radius: 8px; background-color: #dc3545; color: white; text-decoration: none;">
         🔁 Try Again
      </a>
    </div>
  `);
}


      // Step 3: Insert booking with userid
      const insertSql = `INSERT INTO booking (court, date, time, userid) VALUES (?, ?, ?, ?)`;
      conn.query(insertSql, [court, date, time, userid], (err2, result2) => {
        if (err2) {
          console.error('❌ Error inserting booking:', err2);
          return res.status(500).send('Database insert error');
        }

        res.send(`
          <div style="font-family: Arial; text-align: center; margin-top: 50px;">
            <h2>✅ Booking Confirmed!</h2>
            <p>You booked <strong>${court}</strong> on <strong>${date}</strong> at <strong>${time}</strong>.</p>
            <p><strong>Checkout: $40 per hour.</strong></p>
            <a href="/" style="margin:10px; padding:10px 20px; background:#4CAF50; color:white; border-radius:5px;">🏠 Home</a>
            <a href="/checkout" style="margin:10px; padding:10px 20px; background:#f39c12; color:white; border-radius:5px;">💳 Checkout</a>
          </div>
        `);
      });
    });
  });
});
 
      // Route to display the guestplayerOnly dashboard page
      app.get('/guestplayerOnly', (req, res) => {
     // Check if the user is logged in as a guest
  if (!req.session || !req.session.userId || req.session.role !== 'guestplayer') {
    return res.redirect('/login'); // Or any login page
  }

  // Pass email and userId to the view
  res.render('guestplayerOnly', {
    guestplayerEmail: req.session.email,
    guestplayerUserId: req.session.userId
  });
});


    // Handle booking from Member Player using only court, date, and time 
    app.post('/memberplayer/book-court', (req, res) => {
    const { court, date, time } = req.body;

  if (!court || !date || !time) {
    return res.status(400).send('Missing booking details');
  }

  const email = req.session.email;
  if (!email) {
    return res.status(401).send('Unauthorized. Please log in.');
  }

  // Step 1: Get userid based on session email
  const getUserSql = 'SELECT userid FROM users WHERE email = ?';
  conn.query(getUserSql, [email], (err, userResult) => {
    if (err) {
      console.error('Error fetching userid:', err);
      return res.status(500).send('Database error');
    }

    if (userResult.length === 0) {
      return res.status(404).send('User not found');
    }

    const userid = userResult[0].userid;

    // Step 2: Check for existing booking
    const checkSql = `SELECT COUNT(*) AS count FROM booking WHERE court = ? AND date = ? AND time = ?`;
    conn.query(checkSql, [court, date, time], (err, result) => {
      if (err) {
        console.error('Error checking booking:', err);
        return res.status(500).send('Database error');
      }

      
      if (result[0].count > 0) {
  return res.send(`
    <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 80px;">
      <h2 style="color: #dc3545;">❌ Slot Already Booked!</h2>
      <p style="font-size: 18px; margin-top: 20px;">
        The slot for <strong>${court}</strong> on <strong>${date}</strong> at <strong>${time}</strong> is already booked.
      </p>
      
      <a href="/memberplayerOnly" 
         style="margin-top: 30px; padding: 12px 25px; font-size: 16px; font-weight: bold; border-radius: 8px;" 
         class="btn btn-danger">
         🔁 Try Again
      </a>
    </div>
  `);
}


      // Step 3: Insert booking with userid
      const insertSql = `INSERT INTO booking (court, date, time, userid) VALUES (?, ?, ?, ?)`;
      conn.query(insertSql, [court, date, time, userid], (err2, result2) => {
        if (err2) {
          console.error('Error saving booking:', err2);
          return res.status(500).send('Insert error');
        }

        res.send(`
          <div style="font-family: Arial; text-align: center; margin-top: 50px;">
            <h2>✅ Booking Confirmed!</h2>
            <p>You booked <strong>${court}</strong> on <strong>${date}</strong> at <strong>${time}</strong>.</p>
            <p><strong>Please proceed to checkout and pay $40 per court/hour.</strong></p>
            <a href="/" class="btn btn-success mt-3">🏠 Home</a>
            <a href="/checkout" class="btn btn-warning mt-3">💳 Checkout</a>
          </div>
        `);
      });
    });
  });
});
    

    // Handle court booking form submission (only court, date, time)
    app.post('/your-booking-handler', (req, res) => {
    const { court, date, time } = req.body;

    const allowedCourts = ['Court 1', 'Court 2', 'Court 3'];
    const allowedTimes = ['18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];

    // Basic validations
    if (!allowedCourts.includes(court)) {
        return res.send(`<h3 style="color:red;">❌ Invalid court selection. Please select Court 1, 2, or 3 only.</h3><a href="/memberplayerOnly">← Back</a>`);
    }

    const today = new Date();
    const bookingDate = new Date(date);
    const diffDays = Math.floor((bookingDate - today) / (1000 * 60 * 60 * 24));
    if (isNaN(bookingDate) || diffDays < 0 || diffDays > 6) {
        return res.send(`<h3 style="color:red;">❌ Booking date must be within the next 7 days starting today.</h3><a href="/memberplayerOnly">← Back</a>`);
    }

    if (!allowedTimes.includes(time)) {
        return res.send(`<h3 style="color:red;">❌ Booking time must be between 6:00 PM and 12:00 AM.</h3><a href="/memberplayerOnly">← Back</a>`);
    }

    // ✅ Step 1: Check for existing booking for same court/date/time
    const checkSql = `SELECT * FROM booking WHERE court = ? AND date = ? AND time = ?`;
    conn.query(checkSql, [court, date, time], (err, results) => {
        if (err) {
            console.error('Booking check failed:', err);
            return res.status(500).send('Server error while checking availability.');
        }

        if (results.length > 0) {
            return res.send(`
                <div style="text-align:center; margin-top: 50px;">
                    <h3 style="color:red;">❌ This slot is already booked.</h3>
                    <p><strong>Court:</strong> ${court}</p>
                    <p><strong>Date:</strong> ${date}</p>
                    <p><strong>Time:</strong> ${time}</p>
                    <a href="/memberplayerOnly" style="display:inline-block; margin-top:20px; text-decoration:none; color:white; background:#dc3545; padding:10px 20px; border-radius:5px;">← Back to Booking</a>
                </div>
            `);
        }

        // ✅ Step 2: Insert booking
        const insertSql = `INSERT INTO booking (court, date, time) VALUES (?, ?, ?)`;
        conn.query(insertSql, [court, date, time], (err, result) => {
            if (err) {
                console.error('Booking failed:', err);
                return res.status(500).send('Something went wrong while saving your booking.');
            }

            // ✅ Step 3: Confirmation
            res.send(`
                <div style="text-align:center; margin-top: 50px;">
                    <h2 style="color:green;">✅ Booking Confirmed!</h2>
                    <p><strong>Court:</strong> ${court}</p>
                    <p><strong>Date:</strong> ${date}</p>
                    <p><strong>Time:</strong> ${time}</p>
                    <p>You will receive a confirmation shortly. Please arrive 15 minutes early. 🕒</p>
                    <a href="/" style="display:inline-block; margin-top:20px; text-decoration:none; color:white; background:#28a745; padding:10px 20px; border-radius:5px;">🏠 Back to Home</a>
                </div>
            `);
        });
    });
});
  

       //Checking for Court Booking Availability per court per day per time slot
       function isCourtFullyBooked(bookings, courtName) {
       const bookingMap = {};

    bookings.forEach(({ court, date, time }) => {
        if (!bookingMap[court]) bookingMap[court] = {};
        if (!bookingMap[court][date]) bookingMap[court][date] = new Set();
        bookingMap[court][date].add(time);
    });

    const timeSlots = ['18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];

    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        const timesBooked = bookingMap[courtName]?.[dateStr] || new Set();
        if (timesBooked.size < timeSlots.length) return false;
    }

    return true;
}


    //Get booking data
    app.get('/get-weekly-schedule', (req, res) => {
  const court = req.query.court;

  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + 7);

  const sql = `
    SELECT date, time
    FROM booking
    WHERE court = ?
      AND (STR_TO_DATE(CONCAT(date, ' ', time), '%Y-%m-%d %H:%i') >= NOW())
      AND date BETWEEN ? AND ?
  `;

  const start = today.toISOString().split('T')[0];
  const end = futureDate.toISOString().split('T')[0];

  conn.query(sql, [court, start, end], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    const bookedMap = {};

    results.forEach(row => {
      if (!bookedMap[row.date]) bookedMap[row.date] = [];
      bookedMap[row.date].push(row.time);
    });

    const week = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      week.push({
        date: dateStr,
        bookedTimes: bookedMap[dateStr] || []
      });
    }

    res.json(week);
  });
});


//CheckOut route
       app.get('/CheckOut', (req, res) => {
    const sql = 'SELECT id, type, name, Price FROM foods';
    conn.query(sql, (err, result) => {
        if (err) {
            console.error('Error fetching foods:', err);
            return res.status(500).send('Server Error');
        }
        res.render('CheckOut', { menuData: result });
    });
});

// Contact route
app.get('/contact', function(req, res) {
    console.log('Entering /contact route');
    res.render('contact');
    console.log('Rendered contact view');
});

  // Place Order route    
  app.get('/place-order', (req, res) => {
    let userId = req.session.userid || null;
    let subtotal = parseFloat(req.query.subtotal || 0); // example: subtotal from cart

    if (!userId) {
        // No login - no discount
        let discountMessage = "Register and become member to Enjoy 10% Discount across all items and services.";
        return res.render('PlaceOrder', {
            finalAmount: subtotal,
            discountMessage
        });
    }

    let sql = 'SELECT role FROM users WHERE userid = ?';
    conn.query(sql, [userId], (err, results) => {
        if (err) throw err;

        let finalAmount = subtotal;
        let discountMessage = "";

        if (results.length > 0) {
            let role = results[0].role;

            if (role === 'ITAdmin' || role === 'MemberPlayer') {
                finalAmount = subtotal * 0.9; // 10% discount
                discountMessage = "Enjoy your 10% Discount Exclusive to Members only";
            } else {
                discountMessage = "Register and become member to Enjoy 10% Discount across all items and services.";
            }
        } else {
            // User not found in DB
            discountMessage = "Register and become member to Enjoy 10% Discount across all items and services.";
        }

        res.render('PlaceOrder', {
            finalAmount,
            discountMessage
        });
    });
});



  // Confirm Order route
   app.get('/confirm-order', (req, res) => {
    const subtotal = parseFloat(req.query.subtotal || 0);
    let discountApplied = false;
    let discountMessage = "Register and become member to Enjoy 10% Discount across all items and services";

    if (!req.session.userId) {
        // No login → guest
        return res.render('confirmOrder', {
            subtotal,
            finalAmount: subtotal,
            discountMessage,
            discountApplied
        });
    }

    const sql = 'SELECT role FROM users WHERE userId = ?';
    conn.query(sql, [req.session.userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Database error');
        }

        if (results.length > 0) {
            const role = results[0].role;

            if (role === 'ITAdmin' || role === 'MemberPlayer') {
                discountApplied = true;
                discountMessage = "Enjoy your 10% Discount Exclusive to Members only";
                const discountedAmount = subtotal * 0.9; // apply 10% discount
                return res.render('confirmOrder', {
                    subtotal,
                    finalAmount: discountedAmount,
                    discountMessage,
                    discountApplied
                });
            }
        }

        // If GuestPlayer or role not matching
        res.render('confirmOrder', {
            subtotal,
            finalAmount: subtotal,
            discountMessage,
            discountApplied
        });
    });
});



      // POST: Confirm and save order
app.post('/confirm-order', (req, res) => {
  const { date, name, email, phone, amount } = req.body;

  let userid = 0;
  let finalAmount = parseFloat(amount);
  let discountMessage = "";

  if (req.session && req.session.loggedin) {
    if (req.session.userid) {
      userid = req.session.userid;
    } else if (email) {
      // Lookup userid from DB if missing in session
      return conn.query(
        'SELECT userid FROM users WHERE email = ? LIMIT 1',
        [email],
        (err, results) => {
          if (err) {
            console.error('❌ Error fetching userid from DB:', err);
            return res.status(500).send('Database error while checking user');
          }
          if (results.length > 0) {
            userid = results[0].userid;
          }
          applyDiscountAndSave();
        }
      );
    }
  }

  // Apply discount & save immediately if no DB lookup needed
  applyDiscountAndSave();

  function applyDiscountAndSave() {
    const role = req.session.role ? req.session.role.toLowerCase() : "";


      if (role === 'memberplayer' || role === 'itadmin') {
  // Apply 10% discount
  finalAmount = parseFloat((finalAmount * 0.9).toFixed(2));
  discountMessage = `
    <div style="background: linear-gradient(90deg, #4CAF50, #2E7D32); 
                color: white; 
                padding: 12px 20px; 
                border-radius: 8px; 
                font-size: 1.1rem; 
                margin-top: 15px; 
                box-shadow: 0px 4px 6px rgba(0,0,0,0.1);
                text-align:center;">
      🎉 <strong>Enjoy your 10% Discount!</strong> 🎉 <br>
      <span style="font-size:0.95rem;">Exclusive to Members only</span>
    </div>
  `;
  console.log(`💰 Discount applied. New amount: $${finalAmount}`);
} else {
  discountMessage = `
    <div style="background: linear-gradient(90deg, #FF9800, #F57C00); 
                color: white; 
                padding: 12px 20px; 
                border-radius: 8px; 
                font-size: 1.1rem; 
                margin-top: 15px; 
                box-shadow: 0px 4px 6px rgba(0,0,0,0.1);
                text-align:center;">
      🌟 <strong>Become a Member Today!</strong> 🌟 <br>
      <span style="font-size:0.95rem;">Register now and enjoy 10% OFF across all items & services</span>
    </div>
  `;
}


    const sql = `
      INSERT INTO confirmorder (date, name, email, phone, amount, userid, message)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    conn.query(
      sql,
      [date, name, email, phone, finalAmount, userid, discountMessage],
      (err, result) => {
        if (err) {
          console.error('❌ Error saving order:', err);
          return res.status(500).send('Database error while saving order');
        }

        console.log('✅ Order saved to database with ID:', result.insertId);

        res.send(`
          <h2>✅ Order Confirmed!</h2>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Customer:</strong> ${name}</p>
          <p><strong>Amount Paid:</strong> $${finalAmount}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p>${discountMessage}</p>
          <p>You will be notified via email or text message when your order is ready for pickup.</p>

          ${
            req.session.loggedin && role === 'itadmin'
              ? `<a href="/view-orders" class="btn btn-primary">View All Orders</a>`
              : `<a href="/login" class="btn btn-warning">Login to View All Orders</a>`
          }

          <br><br>
          <a href="/" style="padding: 10px 20px; background-color: lightblue; border-radius: 5px; text-decoration: none;">← Back to Home</a>
        `);
      }
    );
  }
});


  
    // View saved orders (accessible to ITadmin)
   app.get('/view-orders', isAdmin, (req, res) => {
    const sql = `
        SELECT userid, date, name, email, phone, amount, created_at
        FROM confirmorder
        ORDER BY created_at DESC
    `;

    conn.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching orders:', err);
            return res.status(500).send('Error fetching orders');
        }

        res.render('ViewOrder', { orders: results });
    });
});


  //Logout route
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      res.send('Error logging out');
    } else {
      res.redirect('/login'); // or your homepage
    }
  });
});

// Start server
app.listen(3001, () => {
    console.log('Running at Port 3001');
});


// DropDown route
app.use('/public', express.static('public'));

app.get('/services', (req, res) => {
  res.render('services');
});

app.get('/shop', (req, res) => {
  res.render('shop');
});

app.get('/food', (req, res) => {
  res.render('food');
});

app.get('/booking', (req, res) => {
  res.render('booking');
});

// Court Bookings 
   app.post('/book-court', (req, res) => {
  const { court, date, time } = req.body;

  const sql = 'INSERT INTO booking (court, date, time) VALUES (?, ?, ?)';
  const values = [court, date, time];

  conn.query(sql, values, (err, result) => {
    if (err) {
      console.error('Error saving booking:', err);
      return res.status(500).send('Error saving booking');
    }
    // You would normally save this to your DB here
  res.send(`✅ Booking confirmed for ${court} on ${date} at ${time}`);
    });
});

